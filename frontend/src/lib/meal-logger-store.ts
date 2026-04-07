import { getFirebaseAdminDb } from "@/lib/firebase-admin";

export type MealLogEntry = {
  id: string;
  uid: string;
  dateStr: string; // YYYY-MM-DD
  foodSlug: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
  loggedAtMillis: number;
};

const collectionName = "mealLogs";

export async function logMeal(entry: MealLogEntry) {
  await getFirebaseAdminDb().collection(collectionName).doc(entry.id).set(entry);
}

export async function getDailyMeals(uid: string, dateStr: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(collectionName)
    .where("uid", "==", uid)
    .where("dateStr", "==", dateStr)
    .orderBy("loggedAtMillis", "asc")
    .get();

  return snapshot.docs.map(doc => doc.data() as MealLogEntry);
}

export async function deleteMealLog(id: string) {
  await getFirebaseAdminDb().collection(collectionName).doc(id).delete();
}
