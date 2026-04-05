"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import type {
  ActivityLevel,
  DietPreference,
  GoalType,
  NutritionRequirements,
  ProfileSummary,
  StressLevel,
  UserProfile,
} from "@/lib/profile-types";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase-client";
import { buildHealthBadges, type HealthTotals } from "@/lib/achievement-badges";

type GoogleHealthSnapshotView = {
  syncedAt: string;
  startTimeMillis: number;
  endTimeMillis: number;
  steps: number;
  caloriesKcal: number;
  distanceMeters?: number;
  activeMinutes?: number;
  heartMinutes?: number;
  avgHeartRateBpm?: number;
  confidence?: "low" | "medium" | "high";
  dailyBuckets?: Array<{
    date: string;
    steps: number;
    caloriesKcal: number;
    distanceMeters: number;
    activeMinutes: number;
    heartMinutes: number;
    avgHeartRateBpm?: number;
  }>;
};

type SaveState = {
  loading?: boolean;
  authenticated?: boolean;
  user?: { id: string; email: string; name?: string };
  profile?: UserProfile;
  requirements?: NutritionRequirements;
  summary?: ProfileSummary;
  aiAnswer?: string;
  googleHealth?: GoogleHealthSnapshotView | null;
  error?: string;
};

type AuthUser = { id: string; email: string; name?: string };

type FriendIdentity = {
  uid: string;
  name: string;
  email?: string;
  avatarEmoji?: string;
  compareOptIn: boolean;
};

type FriendsState = {
  loading: boolean;
  incoming: Array<{ requestId: string; createdAt: string; from: FriendIdentity }>;
  outgoing: Array<{ requestId: string; createdAt: string; to: FriendIdentity }>;
  friends: Array<{ requestId: string; connectedAt: string; friend: FriendIdentity }>;
  compareEntries: Array<{
    uid: string;
    name: string;
    email?: string;
    avatarEmoji?: string;
    connectedAt?: string;
    health: {
      syncedAt: string;
      steps: number;
      caloriesKcal: number;
      distanceMeters?: number;
      activeMinutes?: number;
      heartMinutes?: number;
      dailySteps?: number;
      dailyCaloriesKcal?: number;
      dailyDistanceMeters?: number;
      dailyActiveMinutes?: number;
      dailyHeartPoints?: number;
    } | null;
  }>;
  ownSummary: {
    steps: number;
    caloriesKcal: number;
    distanceMeters?: number;
    activeMinutes?: number;
    heartMinutes?: number;
    dailySteps?: number;
    dailyCaloriesKcal?: number;
    dailyDistanceMeters?: number;
    dailyActiveMinutes?: number;
    dailyHeartPoints?: number;
  } | null;
  blockedCount: number;
  blockedReason?: string;
  globalPercentile?: {
    stepsPercentile: number | null;
    participantCount: number;
  } | null;
  message?: string;
};

type FormState = {
  name: string;
  email: string;
  avatarEmoji: string;
  age: string;
  sex: "male" | "female";
  heightCm: string;
  weightKg: string;
  activityLevel: ActivityLevel;
  goal: GoalType;
  dietPreference: DietPreference;
  targetWeightKg: string;
  weeklyWorkoutDays: string;
  compareOptIn: boolean;
  termsAccepted: boolean;
  googleFitConnected: boolean;
  detailed: {
    sleepHours: string;
    stressLevel: StressLevel;
    jobActivity: string;
    bloodGroup: string;
    hemoglobinGdl: string;
    eyesightLeft: string;
    eyesightRight: string;
    fastingSugarMgDl: string;
    postMealSugarMgDl: string;
    bloodPressureSystolic: string;
    bloodPressureDiastolic: string;
    restingHeartRateBpm: string;
    allergies: string;
    conditions: string;
    injuries: string;
    medications: string;
    medicalNotes: string;
    trainingTime: string;
    constraints: string;
    goalDate: string;
  };
};

const activityOptions: ActivityLevel[] = ["sedentary", "light", "moderate", "active", "very-active"];
const goalOptions: GoalType[] = ["fat-loss", "recomposition", "maintenance", "muscle-gain"];
const dietOptions: DietPreference[] = ["veg", "egg", "non-veg"];
const stressOptions: StressLevel[] = ["low", "moderate", "high"];
const avatarOptions = ["💚", "⚡", "🏃", "🏋️", "🧘", "🥗", "🚴", "🌿"];

function toAuthUser(user: User): AuthUser {
  return {
    id: user.uid,
    email: user.email ?? "",
    name: user.displayName ?? undefined,
  };
}

function numberOrUndefined(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatTime(value?: string) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString();
}

function hasDetailedValues(form: FormState) {
  return [
    form.detailed.sleepHours,
    form.detailed.jobActivity,
    form.detailed.bloodGroup,
    form.detailed.hemoglobinGdl,
    form.detailed.eyesightLeft,
    form.detailed.eyesightRight,
    form.detailed.fastingSugarMgDl,
    form.detailed.postMealSugarMgDl,
    form.detailed.bloodPressureSystolic,
    form.detailed.bloodPressureDiastolic,
    form.detailed.restingHeartRateBpm,
    form.detailed.allergies,
    form.detailed.conditions,
    form.detailed.injuries,
    form.detailed.medications,
    form.detailed.medicalNotes,
    form.detailed.trainingTime,
    form.detailed.constraints,
    form.detailed.goalDate,
  ].some((item) => item.trim().length > 0);
}

function hasSavedDetailedValues(profile?: UserProfile | null) {
  if (!profile) {
    return false;
  }

  return Boolean(
    profile.detailedProfile?.lifestyle?.sleepHours ||
      profile.detailedProfile?.lifestyle?.jobActivity ||
      profile.detailedProfile?.medical?.bloodGroup ||
      profile.detailedProfile?.medical?.hemoglobinGdl ||
      profile.detailedProfile?.medical?.eyesightLeft ||
      profile.detailedProfile?.medical?.eyesightRight ||
      profile.detailedProfile?.medical?.fastingSugarMgDl ||
      profile.detailedProfile?.medical?.postMealSugarMgDl ||
      profile.detailedProfile?.medical?.bloodPressureSystolic ||
      profile.detailedProfile?.medical?.bloodPressureDiastolic ||
      profile.detailedProfile?.medical?.restingHeartRateBpm ||
      profile.detailedProfile?.medical?.allergies ||
      profile.detailedProfile?.medical?.conditions ||
      profile.detailedProfile?.medical?.injuries ||
      profile.detailedProfile?.medical?.medications ||
      profile.detailedProfile?.medical?.notes ||
      profile.detailedProfile?.preferences?.trainingTime ||
      profile.detailedProfile?.preferences?.constraints ||
      profile.detailedProfile?.preferences?.goalDate ||
      profile.medicalNotes,
  );
}

function formatMetric(value: number | undefined, unit = "") {
  const safe = Number.isFinite(value ?? NaN) ? Number(value) : 0;
  const withUnit = unit ? ` ${unit}` : "";
  return `${Math.round(safe).toLocaleString()}${withUnit}`;
}

const defaultFormState: FormState = {
  name: "",
  email: "",
  avatarEmoji: "💚",
  age: "",
  sex: "male",
  heightCm: "",
  weightKg: "",
  activityLevel: "moderate",
  goal: "maintenance",
  dietPreference: "veg",
  targetWeightKg: "",
  weeklyWorkoutDays: "",
  compareOptIn: false,
  termsAccepted: false,
  googleFitConnected: false,
  detailed: {
    sleepHours: "",
    stressLevel: "moderate",
    jobActivity: "",
    bloodGroup: "",
    hemoglobinGdl: "",
    eyesightLeft: "",
    eyesightRight: "",
    fastingSugarMgDl: "",
    postMealSugarMgDl: "",
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    restingHeartRateBpm: "",
    allergies: "",
    conditions: "",
    injuries: "",
    medications: "",
    medicalNotes: "",
    trainingTime: "",
    constraints: "",
    goalDate: "",
  },
};

export default function ProfilePage() {
  const [profileId, setProfileId] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [question, setQuestion] = useState("What should I focus on this week?");
  const [state, setState] = useState<SaveState>({ loading: true, authenticated: false });
  const [isEditing, setIsEditing] = useState(true);
  const [showDetailed, setShowDetailed] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ kind: "created" | "updated"; at: string } | null>(null);
  const [healthFlowMessage, setHealthFlowMessage] = useState<string | null>(null);
  const [comparisonWindow, setComparisonWindow] = useState<"today" | "week">("week");
  const [dashboardWindow, setDashboardWindow] = useState<"today" | "week">("week");
  const [achievementWindow, setAchievementWindow] = useState<"today" | "week">("week");
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const profileFormRef = useRef<HTMLFormElement | null>(null);
  const [friendsState, setFriendsState] = useState<FriendsState>({
    loading: false,
    incoming: [],
    outgoing: [],
    friends: [],
    compareEntries: [],
    ownSummary: null,
    blockedCount: 0,
    blockedReason: undefined,
    message: undefined,
  });
  const [form, setForm] = useState<FormState>(defaultFormState);

  const profileLoaded = useMemo(() => Boolean(state.profile), [state.profile]);
  const hasDetailedFormData = useMemo(() => hasDetailedValues(form), [form]);
  const hasSavedDetailedData = useMemo(() => hasSavedDetailedValues(state.profile), [state.profile]);

  const healthConnected = useMemo(
    () => Boolean(state.googleHealth || state.profile?.googleFitConnected || form.googleFitConnected),
    [state.googleHealth, state.profile, form.googleFitConnected],
  );

  const identityChips = useMemo(() => {
    return [
      `Goal: ${form.goal}`,
      `Activity: ${form.activityLevel}`,
      `Diet: ${form.dietPreference}`,
      `Workout days: ${form.weeklyWorkoutDays || "n/a"}`,
      form.compareOptIn ? "Compare sharing: on" : "Compare sharing: private",
      form.termsAccepted ? "Terms accepted" : "Terms pending",
      healthConnected ? "Google Health: connected" : "Google Health: not connected",
    ];
  }, [form.goal, form.activityLevel, form.dietPreference, form.weeklyWorkoutDays, form.compareOptIn, form.termsAccepted, healthConnected]);

  const authedFetch = useCallback(async (input: string, init?: RequestInit) => {
    const firebaseAuth = getFirebaseAuth();
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      return fetch(input, init);
    }

    const token = await currentUser.getIdToken();
    const headers = new Headers(init?.headers ?? {});
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(input, {
      ...init,
      headers,
    });
  }, []);

  const loadFriendsData = useCallback(async () => {
    setFriendsState((prev) => ({ ...prev, loading: true, message: undefined }));

    try {
      const [friendsRes, compareRes] = await Promise.all([
        authedFetch("/api/friends"),
        authedFetch("/api/friends/compare"),
      ]);

      const friendsData = await friendsRes.json();
      const compareData = await compareRes.json();

      if (!friendsRes.ok) {
        throw new Error(friendsData.error ?? "Failed to load friends");
      }

      if (!compareRes.ok) {
        throw new Error(compareData.error ?? "Failed to load comparison feed");
      }

      setFriendsState({
        loading: false,
        incoming: friendsData.incoming ?? [],
        outgoing: friendsData.outgoing ?? [],
        friends: friendsData.friends ?? [],
        compareEntries: compareData.entries ?? [],
        ownSummary: compareData.ownSummary ?? null,
        blockedCount: Number(compareData.blockedCount ?? 0),
        blockedReason: compareData.blockedReason,
        message: undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load friends";
      setFriendsState((prev) => ({ ...prev, loading: false, message }));
    }
  }, [authedFetch]);

  const refreshGoogleHealth = useCallback(async () => {
    const healthRes = await authedFetch("/api/google-health/latest");
    const healthData = await healthRes.json();

    setState((prev) => ({
      ...prev,
      googleHealth: healthRes.ok ? (healthData.snapshot ?? null) : prev.googleHealth,
    }));
  }, [authedFetch]);

  const loadProfileData = useCallback(async (authUser?: AuthUser) => {
    const profileRes = await authedFetch("/api/profile");
    if (!profileRes.ok) {
      return;
    }

    const profileData = await profileRes.json();
    const profile = profileData.profile as UserProfile | null;

    if (!profile) {
      if (authUser) {
        setForm((prev) => ({
          ...prev,
          name: prev.name || authUser.name || "",
          email: prev.email || authUser.email || "",
        }));
      }
      setIsEditing(true);
      setShowProfilePanel(true);
      await loadFriendsData();
      return;
    }

    setProfileId(profile.id);
    setForm({
      name: profile.name ?? "",
      email: profile.email ?? "",
      avatarEmoji: profile.avatarEmoji ?? "💚",
      age: String(profile.age ?? ""),
      sex: profile.sex,
      heightCm: String(profile.heightCm ?? ""),
      weightKg: String(profile.weightKg ?? ""),
      activityLevel: profile.activityLevel,
      goal: profile.goal,
      dietPreference: profile.dietPreference,
      targetWeightKg: profile.targetWeightKg ? String(profile.targetWeightKg) : "",
      weeklyWorkoutDays: String(profile.weeklyWorkoutDays ?? ""),
      compareOptIn: Boolean(profile.compareOptIn),
      termsAccepted: Boolean(profile.termsAcceptedAt),
      googleFitConnected: profile.googleFitConnected,
      detailed: {
        sleepHours: profile.detailedProfile?.lifestyle?.sleepHours
          ? String(profile.detailedProfile.lifestyle.sleepHours)
          : "",
        stressLevel: profile.detailedProfile?.lifestyle?.stressLevel ?? "moderate",
        jobActivity: profile.detailedProfile?.lifestyle?.jobActivity ?? "",
        bloodGroup: profile.detailedProfile?.medical?.bloodGroup ?? "",
        hemoglobinGdl: profile.detailedProfile?.medical?.hemoglobinGdl
          ? String(profile.detailedProfile.medical.hemoglobinGdl)
          : "",
        eyesightLeft: profile.detailedProfile?.medical?.eyesightLeft ?? "",
        eyesightRight: profile.detailedProfile?.medical?.eyesightRight ?? "",
        fastingSugarMgDl: profile.detailedProfile?.medical?.fastingSugarMgDl
          ? String(profile.detailedProfile.medical.fastingSugarMgDl)
          : "",
        postMealSugarMgDl: profile.detailedProfile?.medical?.postMealSugarMgDl
          ? String(profile.detailedProfile.medical.postMealSugarMgDl)
          : "",
        bloodPressureSystolic: profile.detailedProfile?.medical?.bloodPressureSystolic
          ? String(profile.detailedProfile.medical.bloodPressureSystolic)
          : "",
        bloodPressureDiastolic: profile.detailedProfile?.medical?.bloodPressureDiastolic
          ? String(profile.detailedProfile.medical.bloodPressureDiastolic)
          : "",
        restingHeartRateBpm: profile.detailedProfile?.medical?.restingHeartRateBpm
          ? String(profile.detailedProfile.medical.restingHeartRateBpm)
          : "",
        allergies: profile.detailedProfile?.medical?.allergies ?? "",
        conditions: profile.detailedProfile?.medical?.conditions ?? "",
        injuries: profile.detailedProfile?.medical?.injuries ?? "",
        medications: profile.detailedProfile?.medical?.medications ?? "",
        medicalNotes: profile.detailedProfile?.medical?.notes ?? profile.medicalNotes ?? "",
        trainingTime: profile.detailedProfile?.preferences?.trainingTime ?? "",
        constraints: profile.detailedProfile?.preferences?.constraints ?? "",
        goalDate: profile.detailedProfile?.preferences?.goalDate ?? "",
      },
    });

    const [reqRes, summaryRes, healthRes] = await Promise.all([
      authedFetch("/api/profile/requirements"),
      authedFetch("/api/profile/summary"),
      authedFetch("/api/google-health/latest"),
    ]);

    const reqData = reqRes.ok ? await reqRes.json() : {};
    const summaryData = summaryRes.ok ? await summaryRes.json() : {};
    const healthData = healthRes.ok ? await healthRes.json() : {};

    setState((prev) => ({
      ...prev,
      profile,
      requirements: reqData.requirements,
      summary: summaryData.summary,
      googleHealth: healthData.snapshot ?? null,
    }));

    setShowDetailed(hasSavedDetailedValues(profile));
    setShowProfilePanel(false);
    setIsEditing(false);
    await loadFriendsData();
  }, [authedFetch, loadFriendsData]);

  useEffect(() => {
    const firebaseAuth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setProfileId("");
        setIsEditing(true);
        setShowDetailed(false);
        setShowProfilePanel(false);
        setSaveFeedback(null);
        setHealthFlowMessage(null);
        setForm(defaultFormState);
        setAuthForm({ name: "", email: "", password: "" });
        setFriendsState({
          loading: false,
          incoming: [],
          outgoing: [],
          friends: [],
          compareEntries: [],
          ownSummary: null,
          blockedCount: 0,
        });
        setState({ loading: false, authenticated: false });
        return;
      }

      const authUser = toAuthUser(user);
      setState((prev) => ({
        ...prev,
        loading: false,
        authenticated: true,
        user: authUser,
        error: undefined,
      }));

      await loadProfileData(authUser);
    });

    return () => unsubscribe();
  }, [loadProfileData]);

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    setState((prev) => ({ ...prev, error: undefined }));
    const firebaseAuth = getFirebaseAuth();

    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(firebaseAuth, authForm.email, authForm.password);
      } else {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, authForm.email, authForm.password);
        if (authForm.name.trim()) {
          await updateProfile(credential.user, { displayName: authForm.name.trim() });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      setState((prev) => ({ ...prev, error: message }));
    }
  }

  async function logout() {
    const firebaseAuth = getFirebaseAuth();
    await signOut(firebaseAuth);
    setProfileId("");
    setIsEditing(true);
    setShowDetailed(false);
    setShowProfilePanel(false);
    setSaveFeedback(null);
    setHealthFlowMessage(null);
    setForm(defaultFormState);
    setAuthForm({ name: "", email: "", password: "" });
    setState({ loading: false, authenticated: false });
  }

  async function continueWithGoogle() {
    setState((prev) => ({ ...prev, error: undefined }));
    const firebaseAuth = getFirebaseAuth();
    const googleProvider = getGoogleProvider();

    try {
      await signInWithPopup(firebaseAuth, googleProvider);
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : "";

      if (
        code === "auth/popup-blocked" ||
        code === "auth/operation-not-supported-in-this-environment" ||
        code === "auth/web-storage-unsupported"
      ) {
        await signInWithRedirect(firebaseAuth, googleProvider);
        return;
      }

      const messageByCode: Record<string, string> = {
        "auth/unauthorized-domain": "This domain is not authorized in Firebase Auth. Add it in Firebase Console > Authentication > Settings > Authorized domains.",
        "auth/popup-closed-by-user": "Google sign-in popup was closed before completion.",
        "auth/cancelled-popup-request": "A new sign-in attempt cancelled the previous popup. Please try again.",
      };

      const fallbackMessage = error instanceof Error ? error.message : "Google sign-in failed";
      setState((prev) => ({ ...prev, error: messageByCode[code] ?? fallbackMessage }));
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    const hadProfileBeforeSave = Boolean(state.profile);

    if (!hadProfileBeforeSave && !form.termsAccepted) {
      setShowTermsModal(true);
      setState((prev) => ({ ...prev, error: "Please accept Terms and Conditions to create your profile." }));
      return;
    }

    setSaveInProgress(true);
    setState((prev) => ({ ...prev, error: undefined }));

    const detailedProfile = hasDetailedFormData
      ? {
          lifestyle: {
            sleepHours: numberOrUndefined(form.detailed.sleepHours),
            stressLevel: form.detailed.stressLevel,
            jobActivity: form.detailed.jobActivity,
          },
          medical: {
            bloodGroup: form.detailed.bloodGroup,
            hemoglobinGdl: numberOrUndefined(form.detailed.hemoglobinGdl),
            eyesightLeft: form.detailed.eyesightLeft,
            eyesightRight: form.detailed.eyesightRight,
            fastingSugarMgDl: numberOrUndefined(form.detailed.fastingSugarMgDl),
            postMealSugarMgDl: numberOrUndefined(form.detailed.postMealSugarMgDl),
            bloodPressureSystolic: numberOrUndefined(form.detailed.bloodPressureSystolic),
            bloodPressureDiastolic: numberOrUndefined(form.detailed.bloodPressureDiastolic),
            restingHeartRateBpm: numberOrUndefined(form.detailed.restingHeartRateBpm),
            allergies: form.detailed.allergies,
            conditions: form.detailed.conditions,
            injuries: form.detailed.injuries,
            medications: form.detailed.medications,
            notes: form.detailed.medicalNotes,
          },
          preferences: {
            trainingTime: form.detailed.trainingTime,
            constraints: form.detailed.constraints,
            goalDate: form.detailed.goalDate,
          },
        }
      : undefined;

    const response = await authedFetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        age: numberOrUndefined(form.age),
        heightCm: numberOrUndefined(form.heightCm),
        weightKg: numberOrUndefined(form.weightKg),
        targetWeightKg: numberOrUndefined(form.targetWeightKg),
        weeklyWorkoutDays: numberOrUndefined(form.weeklyWorkoutDays),
        medicalNotes: form.detailed.medicalNotes,
        detailedProfile,
        compareOptIn: form.compareOptIn,
        termsAccepted: form.termsAccepted,
        avatarEmoji: form.avatarEmoji,
        googleFitConnected: healthConnected,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setSaveInProgress(false);
      setState((prev) => ({ ...prev, error: data.error ?? "Failed to save profile" }));
      return;
    }

    const profile = data.profile as UserProfile;
    setProfileId(profile.id);

    const [reqRes, summaryRes] = await Promise.all([
      authedFetch("/api/profile/requirements"),
      authedFetch("/api/profile/summary"),
    ]);

    const reqData = reqRes.ok ? await reqRes.json() : {};
    const summaryData = summaryRes.ok ? await summaryRes.json() : {};

    setState((prev) => ({
      ...prev,
      authenticated: true,
      profile,
      requirements: reqData.requirements,
      summary: summaryData.summary,
      error: undefined,
    }));

    setSaveInProgress(false);
    setSaveFeedback({ kind: hadProfileBeforeSave ? "updated" : "created", at: new Date().toISOString() });
    setShowProfilePanel(false);
    setIsEditing(false);
    await loadFriendsData();
  }

  async function connectGoogleHealth() {
    setState((prev) => ({ ...prev, error: undefined }));
    const response = await authedFetch("/api/google-health/auth-url");
    const data = await response.json();

    if (!response.ok) {
      setState((prev) => ({ ...prev, error: data.message ?? data.error ?? "Google Health API unavailable" }));
      return;
    }

    setHealthFlowMessage("Google Health authorization opened in a new tab. After approving, click Refresh status.");
    window.open(data.authUrl, "_blank", "noopener,noreferrer");
  }

  async function sendFriendRequest(event: FormEvent) {
    event.preventDefault();
    setFriendsState((prev) => ({ ...prev, message: undefined }));

    const response = await authedFetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", email: friendEmail }),
    });
    const data = await response.json();

    if (!response.ok) {
      setFriendsState((prev) => ({ ...prev, message: data.error ?? "Unable to send request" }));
      return;
    }

    setFriendEmail("");
    setFriendsState((prev) => ({ ...prev, message: "Friend request sent." }));
    await loadFriendsData();
  }

  async function respondToRequest(requestId: string, action: "accept" | "decline") {
    const response = await authedFetch("/api/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });

    const data = await response.json();
    if (!response.ok) {
      setFriendsState((prev) => ({ ...prev, message: data.error ?? "Unable to process request" }));
      return;
    }

    setFriendsState((prev) => ({
      ...prev,
      message: action === "accept" ? "Friend request accepted." : "Friend request declined.",
    }));
    await loadFriendsData();
  }

  async function askAiCoach() {
    if (!profileId) {
      setState((prev) => ({ ...prev, error: "Save profile first to use AI assistant." }));
      return;
    }

    const response = await authedFetch("/api/ai/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, question }),
    });
    const data = await response.json();

    if (!response.ok) {
      setState((prev) => ({ ...prev, error: data.error ?? "AI request failed" }));
      return;
    }

    setState((prev) => ({ ...prev, aiAnswer: data.answer }));
  }

  const baseFieldClass =
    "rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-100/55 disabled:cursor-not-allowed disabled:opacity-60";
  const softPanelClass =
    "rounded-2xl border border-emerald-200/15 bg-[linear-gradient(165deg,rgba(6,34,26,0.84),rgba(6,30,24,0.88),rgba(5,24,19,0.92))] p-5 transition-[background-color,border-color] duration-700 ease-linear";

  const detailedRows = [
    { label: "Sleep hours", value: state.profile?.detailedProfile?.lifestyle?.sleepHours ? `${state.profile.detailedProfile.lifestyle.sleepHours} h` : undefined },
    { label: "Stress", value: state.profile?.detailedProfile?.lifestyle?.stressLevel },
    { label: "Job activity", value: state.profile?.detailedProfile?.lifestyle?.jobActivity },
    { label: "Blood group", value: state.profile?.detailedProfile?.medical?.bloodGroup },
    { label: "Hemoglobin", value: state.profile?.detailedProfile?.medical?.hemoglobinGdl ? `${state.profile.detailedProfile.medical.hemoglobinGdl} g/dL` : undefined },
    { label: "Eyesight (L)", value: state.profile?.detailedProfile?.medical?.eyesightLeft },
    { label: "Eyesight (R)", value: state.profile?.detailedProfile?.medical?.eyesightRight },
    { label: "Fasting sugar", value: state.profile?.detailedProfile?.medical?.fastingSugarMgDl ? `${state.profile.detailedProfile.medical.fastingSugarMgDl} mg/dL` : undefined },
    { label: "Post-meal sugar", value: state.profile?.detailedProfile?.medical?.postMealSugarMgDl ? `${state.profile.detailedProfile.medical.postMealSugarMgDl} mg/dL` : undefined },
    {
      label: "Blood pressure",
      value:
        state.profile?.detailedProfile?.medical?.bloodPressureSystolic &&
        state.profile?.detailedProfile?.medical?.bloodPressureDiastolic
          ? `${state.profile.detailedProfile.medical.bloodPressureSystolic}/${state.profile.detailedProfile.medical.bloodPressureDiastolic} mmHg`
          : undefined,
    },
    { label: "Resting heart rate", value: state.profile?.detailedProfile?.medical?.restingHeartRateBpm ? `${state.profile.detailedProfile.medical.restingHeartRateBpm} bpm` : undefined },
    { label: "Allergies", value: state.profile?.detailedProfile?.medical?.allergies },
    { label: "Conditions", value: state.profile?.detailedProfile?.medical?.conditions },
    { label: "Injuries", value: state.profile?.detailedProfile?.medical?.injuries },
    { label: "Medications", value: state.profile?.detailedProfile?.medical?.medications },
    { label: "Medical notes", value: state.profile?.detailedProfile?.medical?.notes ?? state.profile?.medicalNotes },
    { label: "Preferred training time", value: state.profile?.detailedProfile?.preferences?.trainingTime },
    { label: "Constraints", value: state.profile?.detailedProfile?.preferences?.constraints },
    { label: "Goal date", value: state.profile?.detailedProfile?.preferences?.goalDate },
  ].filter((item) => Boolean(item.value));

  const dailyHealth = useMemo(
    () => state.googleHealth?.dailyBuckets ?? [],
    [state.googleHealth?.dailyBuckets],
  );
  const maxDailySteps = useMemo(
    () => dailyHealth.reduce((max, item) => Math.max(max, item.steps), 0),
    [dailyHealth],
  );
  const latestDailyHealth = useMemo(() => {
    if (dailyHealth.length === 0) {
      return undefined;
    }

    return [...dailyHealth].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  }, [dailyHealth]);
  const ownTotals = useMemo<HealthTotals>(() => ({
    steps: Number(state.googleHealth?.steps ?? 0),
    dailySteps: Number(latestDailyHealth?.steps ?? 0),
    caloriesKcal: Number(state.googleHealth?.caloriesKcal ?? 0),
    distanceMeters: Number(state.googleHealth?.distanceMeters ?? 0),
    activeMinutes: Number(state.googleHealth?.activeMinutes ?? 0),
    heartMinutes: Number(state.googleHealth?.heartMinutes ?? 0),
    dailyHeartPoints: Number(latestDailyHealth?.heartMinutes ?? 0),
  }), [state.googleHealth, latestDailyHealth]);
  const dashboardMetrics = useMemo(
    () =>
      dashboardWindow === "today"
        ? [
            { label: "Steps (today)", value: latestDailyHealth?.steps, unit: "" },
            { label: "Heart points (today)", value: latestDailyHealth?.heartMinutes, unit: "points" },
            { label: "Calories (today)", value: latestDailyHealth?.caloriesKcal, unit: "kcal" },
            { label: "Distance (today)", value: latestDailyHealth?.distanceMeters, unit: "m" },
            { label: "Active minutes (today)", value: latestDailyHealth?.activeMinutes, unit: "min" },
          ]
        : [
            { label: "Steps (7d)", value: state.googleHealth?.steps, unit: "" },
            { label: "Heart points (7d)", value: state.googleHealth?.heartMinutes, unit: "points" },
            { label: "Calories (7d)", value: state.googleHealth?.caloriesKcal, unit: "kcal" },
            { label: "Distance (7d)", value: state.googleHealth?.distanceMeters, unit: "m" },
            { label: "Active minutes (7d)", value: state.googleHealth?.activeMinutes, unit: "min" },
          ],
    [dashboardWindow, latestDailyHealth, state.googleHealth],
  );
  const achievementBadges = useMemo(() => buildHealthBadges(ownTotals), [ownTotals]);
  const visibleAchievementBadges = useMemo(
    () => achievementBadges.filter((badge) => badge.period === achievementWindow),
    [achievementBadges, achievementWindow],
  );
  const sortedCompareEntries = useMemo(() => {
    return [...friendsState.compareEntries].sort((a, b) => {
      const aSteps = comparisonWindow === "today" ? Number(a.health?.dailySteps ?? 0) : Number(a.health?.steps ?? 0);
      const bSteps = comparisonWindow === "today" ? Number(b.health?.dailySteps ?? 0) : Number(b.health?.steps ?? 0);
      return bSteps - aSteps;
    });
  }, [friendsState.compareEntries, comparisonWindow]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <section className="rounded-3xl border border-emerald-200/15 bg-emerald-950/25 p-6 sm:p-8">
        <h1 className="text-4xl font-semibold text-emerald-50">Profile and Goal Planner</h1>
        <p className="mt-3 max-w-3xl text-sm text-emerald-100/80">
          Build your base profile first, then unlock richer health insights, social comparison, and optional personal details.
        </p>
      </section>

      {state.loading ? <p className="mt-6 text-sm text-emerald-100/80">Checking session...</p> : null}

      {!state.loading && !state.authenticated ? (
        <section className="mt-6 max-w-2xl rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${authMode === "login" ? "bg-amber-300 text-zinc-900" : "border border-emerald-100/35 text-emerald-100"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("register")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${authMode === "register" ? "bg-amber-300 text-zinc-900" : "border border-emerald-100/35 text-emerald-100"}`}
            >
              Register
            </button>
          </div>
          <form onSubmit={submitAuth} className="mt-4 space-y-3">
            {authMode === "register" ? (
              <input
                value={authForm.name}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Full name (optional)"
                className={baseFieldClass}
              />
            ) : null}
            <input
              value={authForm.email}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email address"
              className={baseFieldClass}
              required
            />
            <input
              value={authForm.password}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Password (min 6 characters)"
              type="password"
              className={baseFieldClass}
              required
            />
            <button type="submit" className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-200">
              {authMode === "login" ? "Login" : "Create account"}
            </button>
          </form>
          <button type="button" onClick={continueWithGoogle} className="mt-3 rounded-full border border-emerald-100/35 px-5 py-2 text-sm font-semibold text-emerald-50 hover:border-amber-300 hover:text-amber-200">
            Continue with Google
          </button>
        </section>
      ) : null}

      {state.authenticated ? (
        <>
          <section className="mt-6 flex items-center justify-between rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-4">
            <p className="text-sm text-emerald-100/85">Logged in as {state.user?.email}</p>
            <button type="button" onClick={logout} className="rounded-full border border-emerald-100/35 px-4 py-1.5 text-sm font-semibold text-emerald-50 hover:border-rose-300 hover:text-rose-200">
              Logout
            </button>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Profile state</p>
              <div className="mt-3 flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(135deg,#34d399,#4ade80)] text-base font-semibold text-zinc-900">
                  {form.avatarEmoji || state.profile?.avatarEmoji || "💚"}
                </span>
                <div>
                  <p className="text-sm font-semibold text-emerald-50">{form.name || state.user?.name || "Your profile"}</p>
                  <p className="text-xs text-emerald-100/70">{form.email || state.user?.email || "No email set"}</p>
                  <p className="mt-1 text-xs text-emerald-100/70">
                    {profileLoaded ? `Updated ${formatTime(state.profile?.updatedAt)}` : "Profile not saved yet"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {profileLoaded ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setShowProfilePanel((prev) => !prev);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100/35 px-3 py-1 text-xs font-semibold text-emerald-50 hover:border-emerald-200/70"
                  >
                    {showProfilePanel ? "Hide profile" : "View profile"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setShowProfilePanel(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100/35 px-3 py-1 text-xs font-semibold text-emerald-50 hover:border-emerald-200/70"
                  >
                    Create profile
                  </button>
                )}
                {profileLoaded ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setShowProfilePanel(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100/35 px-3 py-1 text-xs font-semibold text-emerald-50 hover:border-emerald-200/70"
                  >
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                      <path d="M3 14.5V17h2.5l7.4-7.4-2.5-2.5L3 14.5Z" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M10.9 5.1 13.4 7.6" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                    Edit profile
                  </button>
                ) : null}
                {!isEditing && profileLoaded && showProfilePanel ? (
                  <span className="rounded-full border border-emerald-200/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                    Viewing mode
                  </span>
                ) : null}
              </div>
            </article>

            <article className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Save status</p>
              {saveInProgress ? (
                <p className="mt-3 text-sm text-emerald-100">Saving profile...</p>
              ) : saveFeedback ? (
                <>
                  <p className="mt-3 text-sm font-semibold text-lime-200">
                    {saveFeedback.kind === "created" ? "Profile created successfully" : "Profile updated successfully"}
                  </p>
                  <p className="mt-1 text-xs text-emerald-100/70">{formatTime(saveFeedback.at)}</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-emerald-100/75">No recent profile save in this session.</p>
              )}
            </article>

            <article className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Connection badges</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-200/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-50">
                  {healthConnected ? "Google Health connected" : "Google Health not connected"}
                </span>
                <span className="rounded-full border border-emerald-200/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-50">
                  {form.compareOptIn ? "Compare sharing enabled" : "Compare sharing private"}
                </span>
              </div>
              <p className="mt-2 text-xs text-emerald-100/70">
                {state.googleHealth ? `Last synced ${formatTime(state.googleHealth.syncedAt)}` : "No synced snapshot yet"}
              </p>
            </article>
          </section>

          <section className="mt-3 flex flex-wrap gap-2">
            {identityChips.map((chip) => (
              <span key={chip} className="rounded-full border border-emerald-200/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                {chip}
              </span>
            ))}
          </section>

          <section className="mt-6 space-y-6">
            {showProfilePanel ? (
            <form ref={profileFormRef} onSubmit={saveProfile} className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-amber-200">Basic profile</h2>
                  <p className="mt-1 text-sm text-emerald-100/75">
                    Start simple. Add optional details only if you want more personalization.
                  </p>
                </div>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100/35 px-4 py-1.5 text-xs font-semibold text-emerald-50 hover:border-emerald-200/70"
                  >
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                      <path d="M3 14.5V17h2.5l7.4-7.4-2.5-2.5L3 14.5Z" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M10.9 5.1 13.4 7.6" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                    Edit
                  </button>
                ) : null}
              </div>

              {!isEditing && profileLoaded ? (
                <p className="mt-3 rounded-lg border border-emerald-200/25 bg-emerald-500/10 p-2 text-xs text-emerald-100">
                  Profile is in viewing mode. Use the pencil button to edit.
                </p>
              ) : null}

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Avatar</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {avatarOptions.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, avatarEmoji: avatar }))}
                      disabled={!isEditing}
                      className={`grid h-9 w-9 place-items-center rounded-full border text-base ${
                        form.avatarEmoji === avatar
                          ? "border-emerald-200 bg-emerald-300/20"
                          : "border-emerald-100/30 bg-emerald-950/40"
                      } disabled:opacity-60`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Display name"
                  className={baseFieldClass}
                  disabled={!isEditing}
                />
                <input
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Email (optional)"
                  className={baseFieldClass}
                  disabled={!isEditing}
                />
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
                  placeholder="Age"
                  className={baseFieldClass}
                  disabled={!isEditing}
                />
                <select
                  value={form.sex}
                  onChange={(e) => setForm((prev) => ({ ...prev, sex: e.target.value as "male" | "female" }))}
                  className={baseFieldClass}
                  disabled={!isEditing}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <input
                  type="number"
                  value={form.heightCm}
                  onChange={(e) => setForm((prev) => ({ ...prev, heightCm: e.target.value }))}
                  placeholder="Height (cm)"
                  className={baseFieldClass}
                  disabled={!isEditing}
                />
                <input
                  type="number"
                  value={form.weightKg}
                  onChange={(e) => setForm((prev) => ({ ...prev, weightKg: e.target.value }))}
                  placeholder="Weight (kg)"
                  className={baseFieldClass}
                  disabled={!isEditing}
                />
                <input
                  type="number"
                  value={form.targetWeightKg}
                  onChange={(e) => setForm((prev) => ({ ...prev, targetWeightKg: e.target.value }))}
                  placeholder="Target weight (kg)"
                  className={baseFieldClass}
                  disabled={!isEditing}
                />
                <input
                  type="number"
                  value={form.weeklyWorkoutDays}
                  onChange={(e) => setForm((prev) => ({ ...prev, weeklyWorkoutDays: e.target.value }))}
                  placeholder="Workout days / week"
                  className={baseFieldClass}
                  disabled={!isEditing}
                />
                <select
                  value={form.activityLevel}
                  onChange={(e) => setForm((prev) => ({ ...prev, activityLevel: e.target.value as ActivityLevel }))}
                  className={baseFieldClass}
                  disabled={!isEditing}
                >
                  {activityOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  value={form.goal}
                  onChange={(e) => setForm((prev) => ({ ...prev, goal: e.target.value as GoalType }))}
                  className={baseFieldClass}
                  disabled={!isEditing}
                >
                  {goalOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  value={form.dietPreference}
                  onChange={(e) => setForm((prev) => ({ ...prev, dietPreference: e.target.value as DietPreference }))}
                  className={`${baseFieldClass} sm:col-span-2`}
                  disabled={!isEditing}
                >
                  {dietOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-lg border border-emerald-200/20 bg-emerald-950/35 p-3 text-sm text-emerald-100">
                  <input
                    type="checkbox"
                    checked={form.compareOptIn}
                    onChange={(e) => setForm((prev) => ({ ...prev, compareOptIn: e.target.checked }))}
                    disabled={!isEditing}
                  />
                  Allow friends to compare my shared stats
                </label>
                <div className="rounded-lg border border-emerald-200/20 bg-emerald-950/35 p-3 text-xs text-emerald-100/75">
                  Comparison is privacy-safe: only accepted friends with mutual sharing can view compare cards.
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-emerald-200/20 bg-emerald-950/35 p-3 text-xs text-emerald-100/80">
                {form.termsAccepted
                  ? "Terms and Conditions accepted for this account."
                  : "Terms and Conditions must be accepted on first profile creation."}
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-200/20 bg-emerald-950/35 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-emerald-100">Update detailed profile (optional)</p>
                  <button
                    type="button"
                    onClick={() => setShowDetailed((prev) => !prev)}
                    className="rounded-full border border-emerald-100/35 px-3 py-1 text-xs font-semibold text-emerald-50 hover:border-emerald-200/70"
                  >
                    {showDetailed ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-emerald-100/70">
                  These fields are optional and only used if you provide them.
                </p>

                {showDetailed ? (
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        type="number"
                        value={form.detailed.sleepHours}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, sleepHours: e.target.value } }))}
                        placeholder="Sleep hours"
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                      <select
                        value={form.detailed.stressLevel}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, stressLevel: e.target.value as StressLevel } }))}
                        className={baseFieldClass}
                        disabled={!isEditing}
                      >
                        {stressOptions.map((option) => (
                          <option key={option} value={option}>
                            Stress: {option}
                          </option>
                        ))}
                      </select>
                      <input
                        value={form.detailed.jobActivity}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, jobActivity: e.target.value } }))}
                        placeholder="Job activity (desk, field, mixed)"
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <select
                        value={form.detailed.bloodGroup}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, bloodGroup: e.target.value } }))}
                        className={baseFieldClass}
                        disabled={!isEditing}
                      >
                        <option value="">Blood group (optional)</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                      <input
                        type="number"
                        value={form.detailed.hemoglobinGdl}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, hemoglobinGdl: e.target.value } }))}
                        placeholder="Hemoglobin (g/dL)"
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                      <input
                        type="number"
                        value={form.detailed.restingHeartRateBpm}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, restingHeartRateBpm: e.target.value } }))}
                        placeholder="Resting heart rate (bpm)"
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        value={form.detailed.eyesightLeft}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, eyesightLeft: e.target.value } }))}
                        placeholder="Eyesight left (e.g. 6/6)"
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                      <input
                        value={form.detailed.eyesightRight}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, eyesightRight: e.target.value } }))}
                        placeholder="Eyesight right (e.g. 6/6)"
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={form.detailed.bloodPressureSystolic}
                          onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, bloodPressureSystolic: e.target.value } }))}
                          placeholder="BP sys"
                          className={baseFieldClass}
                          disabled={!isEditing}
                        />
                        <input
                          type="number"
                          value={form.detailed.bloodPressureDiastolic}
                          onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, bloodPressureDiastolic: e.target.value } }))}
                          placeholder="BP dia"
                          className={baseFieldClass}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="number"
                        value={form.detailed.fastingSugarMgDl}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, fastingSugarMgDl: e.target.value } }))}
                        placeholder="Fasting sugar (mg/dL)"
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                      <input
                        type="number"
                        value={form.detailed.postMealSugarMgDl}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, postMealSugarMgDl: e.target.value } }))}
                        placeholder="Post-meal sugar (mg/dL)"
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={form.detailed.allergies}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, allergies: e.target.value } }))}
                        placeholder="Allergies (optional)"
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                      <input
                        value={form.detailed.conditions}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, conditions: e.target.value } }))}
                        placeholder="Conditions (optional)"
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                      <input
                        value={form.detailed.injuries}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, injuries: e.target.value } }))}
                        placeholder="Injuries (optional)"
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                      <input
                        value={form.detailed.medications}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, medications: e.target.value } }))}
                        placeholder="Medications (optional)"
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                    </div>

                    <textarea
                      value={form.detailed.medicalNotes}
                      onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, medicalNotes: e.target.value } }))}
                      placeholder="Additional medical notes (optional)"
                      className={baseFieldClass}
                      rows={2}
                      disabled={!isEditing}
                    />

                    <div className="grid gap-3 sm:grid-cols-3">
                      <select
                        value={form.detailed.trainingTime}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, trainingTime: e.target.value } }))}
                        className={baseFieldClass}
                        disabled={!isEditing}
                      >
                        <option value="">Preferred training time (optional)</option>
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                        <option value="flexible">Flexible</option>
                      </select>
                      <input
                        type="date"
                        value={form.detailed.goalDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, goalDate: e.target.value } }))}
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                      <input
                        value={form.detailed.constraints}
                        onChange={(e) => setForm((prev) => ({ ...prev, detailed: { ...prev.detailed, constraints: e.target.value } }))}
                        placeholder="Constraints (time, equipment, schedule)"
                        className={baseFieldClass}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saveInProgress || !isEditing}
                  className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveInProgress ? "Saving..." : "Save profile"}
                </button>
                <button
                  type="button"
                  onClick={connectGoogleHealth}
                  className="rounded-full border border-emerald-100/35 px-5 py-2 text-sm font-semibold text-emerald-50 hover:border-amber-300 hover:text-amber-200"
                >
                  Connect Google Health
                </button>
                <button
                  type="button"
                  onClick={refreshGoogleHealth}
                  className="rounded-full border border-emerald-100/35 px-5 py-2 text-sm font-semibold text-emerald-50 hover:border-emerald-200"
                >
                  Refresh status
                </button>
              </div>
              {healthFlowMessage ? (
                <p className="mt-3 text-xs text-emerald-100/80">{healthFlowMessage}</p>
              ) : null}
            </form>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <section className={`${softPanelClass} lg:col-start-1`}>
                <h2 className="text-xl font-semibold text-amber-200">Profile Summary</h2>
                {!profileLoaded ? <p className="mt-3 text-sm text-emerald-100/75">Save profile to generate summary.</p> : null}
                {state.summary ? (
                  <>
                    <p className="mt-3 text-sm text-emerald-100/90">{state.summary.headline}</p>
                    <p className="mt-2 text-sm text-amber-100">{state.summary.status}</p>
                    <ul className="mt-3 space-y-1 text-sm text-emerald-100/85">
                      {state.summary.nextActions.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                    {state.summary.riskFlags.length > 0 ? (
                      <ul className="mt-3 space-y-1 text-sm text-rose-100/90">
                        {state.summary.riskFlags.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                ) : null}
              </section>

              <section className={`${softPanelClass} lg:col-start-2 lg:row-start-1`}>
                <h2 className="text-xl font-semibold text-amber-200">Optional details (if shared)</h2>
                {!hasSavedDetailedData ? (
                  <p className="mt-3 text-sm text-emerald-100/75">No optional details shared yet.</p>
                ) : (
                  <div className="mt-3 grid gap-2 text-sm text-emerald-100/90">
                    {detailedRows.map((item) => (
                      <p key={item.label}>
                        <span className="text-emerald-200">{item.label}:</span> {item.value}
                      </p>
                    ))}
                  </div>
                )}
                {!showDetailed && !hasDetailedFormData ? (
                  <p className="mt-2 text-xs text-emerald-100/70">
                    Use the Update detailed profile (optional) section to add these fields anytime.
                  </p>
                ) : null}
              </section>

              <section className={`${softPanelClass} lg:col-start-2`}>
                <h2 className="text-xl font-semibold text-amber-200">Daily Nutrition Requirements</h2>
                <p className="mt-2 text-xs text-emerald-100/70">
                  Calculator controls are now in
                  <Link href="/calculators/daily-requirements" className="ml-1 text-amber-200 underline underline-offset-2">
                    Daily Requirements Calculator
                  </Link>
                  . This section shows your saved profile output.
                </p>
                {state.requirements ? (
                  <div className="mt-3 grid gap-2 text-sm text-emerald-100/90 sm:grid-cols-2">
                    <p>Calories: {state.requirements.targetCalories} kcal</p>
                    <p>BMR: {state.requirements.bmr}</p>
                    <p>TDEE: {state.requirements.tdee}</p>
                    <p>Protein: {state.requirements.macros.protein_g} g</p>
                    <p>Carbs: {state.requirements.macros.carbs_g} g</p>
                    <p>Fat: {state.requirements.macros.fat_g} g</p>
                    <p>Water: {state.requirements.hydration.water_ml} ml</p>
                    <p>Fiber: {state.requirements.micros.fiber_g} g</p>
                    <p>Calcium: {state.requirements.micros.calcium_mg} mg</p>
                    <p>Iron: {state.requirements.micros.iron_mg} mg</p>
                    <p>Vitamin C: {state.requirements.micros.vitamin_c_mg} mg</p>
                    <p>Vitamin D: {state.requirements.micros.vitamin_d_iu} IU</p>
                    <p>Vitamin B12: {state.requirements.micros.vitamin_b12_mcg} mcg</p>
                    <p>Magnesium: {state.requirements.micros.magnesium_mg} mg</p>
                    <p>Zinc: {state.requirements.micros.zinc_mg} mg</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-emerald-100/75">No requirement data yet.</p>
                )}
              </section>

              <section className={`${softPanelClass} lg:col-start-2`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-amber-200">Google Health Dashboard</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-full border border-emerald-100/30 bg-emerald-950/40 p-1">
                      <button
                        type="button"
                        onClick={() => setDashboardWindow("today")}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          dashboardWindow === "today" ? "bg-amber-300 text-zinc-900" : "text-emerald-100"
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setDashboardWindow("week")}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          dashboardWindow === "week" ? "bg-amber-300 text-zinc-900" : "text-emerald-100"
                        }`}
                      >
                        This Week
                      </button>
                    </div>
                    {state.googleHealth?.confidence ? (
                      <span className="rounded-full border border-emerald-200/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                        Confidence: {state.googleHealth.confidence}
                      </span>
                    ) : null}
                  </div>
                </div>
                {state.googleHealth ? (
                  <>
                    <p className="mt-2 text-xs text-emerald-100/75">
                      Last synced: {formatTime(state.googleHealth.syncedAt)} | Window: {new Date(state.googleHealth.startTimeMillis).toLocaleDateString()} to {new Date(state.googleHealth.endTimeMillis).toLocaleDateString()}
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {dashboardMetrics.map((metric) => (
                        <div key={metric.label} className="rounded-xl border border-emerald-200/20 bg-emerald-950/35 p-3 text-sm text-emerald-100">
                          <p className="text-xs text-emerald-200/80">{metric.label}</p>
                          <p className="mt-1 text-lg font-semibold">{formatMetric(metric.value, metric.unit)}</p>
                        </div>
                      ))}
                    </div>
                    {dailyHealth.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Daily step trend</p>
                        <div className="mt-2 flex items-end gap-2 overflow-x-auto pb-1">
                          {dailyHealth.map((day) => {
                            const ratio = maxDailySteps > 0 ? day.steps / maxDailySteps : 0;
                            const height = Math.max(10, Math.round(ratio * 52));
                            return (
                              <div key={day.date} className="flex min-w-[44px] flex-col items-center gap-1">
                                <div className="w-7 rounded-t-md bg-[linear-gradient(180deg,#34d399,#10b981)]" style={{ height }} />
                                <span className="text-[10px] text-emerald-100/70">{day.date.slice(5)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-3 text-sm text-emerald-100/75">No synced Google Health data yet. Use Connect Google Health and then Refresh status.</p>
                )}
              </section>

              <section className={`${softPanelClass} lg:col-span-2 lg:col-start-1`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-amber-200">Achievements</h2>
                  <div className="flex rounded-full border border-emerald-100/30 bg-emerald-950/40 p-1">
                    <button
                      type="button"
                      onClick={() => setAchievementWindow("today")}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        achievementWindow === "today" ? "bg-amber-300 text-zinc-900" : "text-emerald-100"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setAchievementWindow("week")}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        achievementWindow === "week" ? "bg-amber-300 text-zinc-900" : "text-emerald-100"
                      }`}
                    >
                      This Week
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-emerald-100/75">
                  Badge counts increase each time you complete the same milestone again.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {visibleAchievementBadges.map((badge) => (
                    <article
                      key={badge.id}
                      className={`rounded-xl border p-3 transition-[background-color,border-color] duration-700 ease-linear ${
                        badge.unlocked
                          ? "border-emerald-200/40 bg-[linear-gradient(145deg,rgba(52,211,153,0.14),rgba(20,184,166,0.1),rgba(6,35,28,0.92))]"
                          : "border-emerald-200/20 bg-[linear-gradient(145deg,rgba(6,34,26,0.84),rgba(6,30,24,0.88),rgba(5,24,19,0.92))]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-emerald-50">{badge.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.badgeCount > 0 ? "bg-lime-300 text-zinc-900" : "bg-emerald-200/20 text-emerald-100"}`}>
                          {badge.badgeCount > 0 ? `x${badge.badgeCount}` : `${badge.progress}%`}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-emerald-100/75">{badge.description}</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-200/15">
                        <div className="h-full bg-[linear-gradient(90deg,#34d399,#22c55e)]" style={{ width: `${badge.progress}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-emerald-100/75">
                        Current: {formatMetric(badge.current, badge.unit)} | Next badge at {formatMetric(badge.nextTarget, badge.unit)}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className={`${softPanelClass} lg:col-start-1 lg:row-start-2`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-amber-200">Friends and Comparison</h2>
                  <Link href="/friends" className="text-xs font-semibold text-emerald-100 underline underline-offset-2">
                    Open full Friends page
                  </Link>
                </div>
                <div className="mt-3 flex rounded-full border border-emerald-100/30 bg-emerald-950/40 p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setComparisonWindow("today")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      comparisonWindow === "today" ? "bg-amber-300 text-zinc-900" : "text-emerald-100"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonWindow("week")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      comparisonWindow === "week" ? "bg-amber-300 text-zinc-900" : "text-emerald-100"
                    }`}
                  >
                    This Week
                  </button>
                </div>
                <p className="mt-2 text-xs text-emerald-100/75">
                  Send requests by email. Stats comparison is only shown when both sides have compare sharing enabled.
                </p>

                <form onSubmit={sendFriendRequest} className="mt-3 flex flex-wrap gap-2">
                  <input
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    placeholder="Friend email"
                    className="min-w-[220px] flex-1 rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-100/55"
                  />
                  <button type="submit" className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-emerald-200">
                    Send request
                  </button>
                </form>

                {friendsState.message ? <p className="mt-2 text-xs text-emerald-100/80">{friendsState.message}</p> : null}
                {friendsState.loading ? <p className="mt-2 text-xs text-emerald-100/75">Loading friend data...</p> : null}

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-200/20 bg-emerald-950/35 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Incoming</p>
                    {friendsState.incoming.length === 0 ? (
                      <p className="mt-2 text-xs text-emerald-100/70">No incoming requests.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {friendsState.incoming.map((item) => (
                          <div key={item.requestId} className="rounded-lg border border-emerald-200/20 bg-emerald-950/45 p-2">
                            <p className="text-sm font-semibold text-emerald-50">
                              {item.from.avatarEmoji ?? "💚"} {item.from.name}
                            </p>
                            <p className="text-xs text-emerald-100/70">{item.from.email ?? "No email"}</p>
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() => respondToRequest(item.requestId, "accept")}
                                className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold text-zinc-900"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => respondToRequest(item.requestId, "decline")}
                                className="rounded-full border border-emerald-100/35 px-3 py-1 text-xs font-semibold text-emerald-50"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-emerald-200/20 bg-emerald-950/35 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Friends</p>
                    {friendsState.friends.length === 0 ? (
                      <p className="mt-2 text-xs text-emerald-100/70">No friends connected yet.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {friendsState.friends.map((item) => (
                          <p key={item.requestId} className="text-sm text-emerald-100">
                            {item.friend.avatarEmoji ?? "💚"} {item.friend.name}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {friendsState.blockedReason ? (
                  <p className="mt-3 rounded-lg border border-amber-300/35 bg-amber-100/10 p-2 text-xs text-amber-100">
                    {friendsState.blockedReason}
                  </p>
                ) : null}
                {friendsState.blockedCount > 0 ? (
                  <p className="mt-2 text-xs text-emerald-100/70">
                    {friendsState.blockedCount} friend profile(s) are hidden from comparison due to privacy settings.
                  </p>
                ) : null}

                {friendsState.ownSummary || friendsState.compareEntries.length > 0 ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-sm text-emerald-100">
                      <thead>
                        <tr>
                          <th className="border-b border-emerald-200/20 px-2 py-2 text-left">Person</th>
                          <th className="border-b border-emerald-200/20 px-2 py-2 text-left">Steps</th>
                          <th className="border-b border-emerald-200/20 px-2 py-2 text-left">Calories</th>
                          <th className="border-b border-emerald-200/20 px-2 py-2 text-left">Distance</th>
                          <th className="border-b border-emerald-200/20 px-2 py-2 text-left">Active min</th>
                          <th className="border-b border-emerald-200/20 px-2 py-2 text-left">Heart points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {friendsState.ownSummary ? (
                          <tr>
                            <td className="border-b border-emerald-200/10 px-2 py-2 font-semibold">You</td>
                            <td className="border-b border-emerald-200/10 px-2 py-2">
                              {comparisonWindow === "today"
                                ? formatMetric(friendsState.ownSummary.dailySteps)
                                : formatMetric(friendsState.ownSummary.steps)}
                            </td>
                            <td className="border-b border-emerald-200/10 px-2 py-2">
                              {comparisonWindow === "today"
                                ? formatMetric(friendsState.ownSummary.dailyCaloriesKcal, "kcal")
                                : formatMetric(friendsState.ownSummary.caloriesKcal, "kcal")}
                            </td>
                            <td className="border-b border-emerald-200/10 px-2 py-2">
                              {comparisonWindow === "today"
                                ? formatMetric(friendsState.ownSummary.dailyDistanceMeters, "m")
                                : formatMetric(friendsState.ownSummary.distanceMeters, "m")}
                            </td>
                            <td className="border-b border-emerald-200/10 px-2 py-2">
                              {comparisonWindow === "today"
                                ? formatMetric(friendsState.ownSummary.dailyActiveMinutes, "min")
                                : formatMetric(friendsState.ownSummary.activeMinutes, "min")}
                            </td>
                            <td className="border-b border-emerald-200/10 px-2 py-2">
                              {comparisonWindow === "today"
                                ? formatMetric(friendsState.ownSummary.dailyHeartPoints, "points")
                                : formatMetric(friendsState.ownSummary.heartMinutes, "points")}
                            </td>
                          </tr>
                        ) : null}
                        {sortedCompareEntries.map((item) => (
                          <tr key={item.uid}>
                            <td className="border-b border-emerald-200/10 px-2 py-2">{item.avatarEmoji ?? "💚"} {item.name}</td>
                            <td className="border-b border-emerald-200/10 px-2 py-2">
                              {comparisonWindow === "today"
                                ? formatMetric(item.health?.dailySteps)
                                : formatMetric(item.health?.steps)}
                            </td>
                            <td className="border-b border-emerald-200/10 px-2 py-2">
                              {comparisonWindow === "today"
                                ? formatMetric(item.health?.dailyCaloriesKcal, "kcal")
                                : formatMetric(item.health?.caloriesKcal, "kcal")}
                            </td>
                            <td className="border-b border-emerald-200/10 px-2 py-2">
                              {comparisonWindow === "today"
                                ? formatMetric(item.health?.dailyDistanceMeters, "m")
                                : formatMetric(item.health?.distanceMeters, "m")}
                            </td>
                            <td className="border-b border-emerald-200/10 px-2 py-2">
                              {comparisonWindow === "today"
                                ? formatMetric(item.health?.dailyActiveMinutes, "min")
                                : formatMetric(item.health?.activeMinutes, "min")}
                            </td>
                            <td className="border-b border-emerald-200/10 px-2 py-2">
                              {comparisonWindow === "today"
                                ? formatMetric(item.health?.dailyHeartPoints, "points")
                                : formatMetric(item.health?.heartMinutes, "points")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>

              <section className={`${softPanelClass} lg:col-start-1 lg:row-start-3`}>
                <h2 className="text-xl font-semibold text-amber-200">AI Assistant</h2>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  className="mt-3 w-full rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-100/55"
                  placeholder="Ask for weekly plan, meal timing, recovery guidance"
                />
                <button type="button" onClick={askAiCoach} className="mt-3 rounded-full bg-emerald-300 px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-emerald-200">
                  Ask coach
                </button>
                {state.aiAnswer ? <p className="mt-3 text-sm text-emerald-100/90">{state.aiAnswer}</p> : null}
              </section>
            </div>
          </section>
        </>
      ) : null}

      {state.error ? (
        <p className="mt-6 rounded-xl border border-rose-300/40 bg-rose-200/10 p-3 text-sm text-rose-100">{state.error}</p>
      ) : null}

      {showTermsModal ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/55 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-emerald-200/25 bg-[#062018] p-6 shadow-2xl shadow-emerald-900/40">
            <h2 className="text-2xl font-semibold text-emerald-100">Accept Terms and Conditions</h2>
            <p className="mt-3 text-sm text-emerald-100/85">
              To create your profile, please review and agree to the platform terms.
            </p>
            <p className="mt-2 text-sm text-emerald-100/85">
              Read terms here:
              <Link href="/terms-and-conditions" className="ml-1 text-amber-200 underline underline-offset-2">
                Terms and Conditions
              </Link>
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({ ...prev, termsAccepted: true }));
                  setShowTermsModal(false);
                  setState((prev) => ({ ...prev, error: undefined }));
                  setTimeout(() => profileFormRef.current?.requestSubmit(), 0);
                }}
                className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-200"
              >
                I Agree and Continue
              </button>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="rounded-full border border-emerald-100/35 px-5 py-2 text-sm font-semibold text-emerald-50 hover:border-emerald-200/60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
