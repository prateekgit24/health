# Version 3 Roadmap: The "Pro" Upgrade

This document outlines the strategic roadmap for Version 3 of the HOW (Health Over Wealth) platform. It merges original architectural goals with exact user requirements.

## Raw User Requirements (The Foundation)
- changing google account/google health for better connection and reliability
- proper community of fitness
- proper badges and ui
- maps integration
- better ai support
- proper policy follow
- twice security
- all better ui and design
- light theme ui in white, blue sky, black, red theme (along with dark theme support)
- advanced calorie/macro requirements (TDEE, BMR) already built being put to use

---

## Pillar 1: The "Action" Tracker (Nutrition & Workouts)
*Right now, you have advanced calorie/macro requirements and a massive curated food database. Version 3 puts them into action.*
*   **Daily Meal Logger:** Let users search your food database and log their meals with progress bars comparing consumed calories against their TDEE goals.
*   **Workout Execution Mode:** Let a user click "Start Workout" instead of just browsing `/routines`, enabling them to check off sets and reps.

## Pillar 2: Deep Analytics & Progress Visualizations (The "Strava" effect)
*   **Interactive Charts:** Add dynamic trend charts using `recharts` to overlay weight trends against active minutes or caloric deficits.
*   **Milestones & Streaks:** Implement tracking for consistency streaks.

## Pillar 3: Proactive AI Coaching (*Better AI Support*)
*   **Weekly Action Reports:** AI looks at 7 days of Google Fit data and provides structured reports ("You hit your step goal, but your active minutes dropped on the weekend").
*   **AI Meal Suggestions:** Based on daily macro gaps, AI reads the user's diet preferences and recommends exactly 3 foods from the database to hit their targets perfectly.

## Pillar 4: Friend Leaderboards & Challenges (*Proper Community of Fitness*)
*   **Weekly Leaderboards:** A ranked list comparing the user and their friends by steps or active minutes.
*   **Micro-Challenges:** Let a user invite a friend to specific "Weekend Step" or "Drink Water" challenges.

## Pillar 5: Redesign & Dual-Theme System (*All Better UI and Design*)
*   **Dual Theme Support:** Fully support both the original Dark Theme and the new Light Theme environments.
*   **Light Theme Pattern:** Crisp, high-contrast athletic UI using a White background, Sky Blue accents, Black typography, and striking Red hooks for alerts/actions.
*   **Design Upgrades:** Refined layouts, Apple Health/Strava-style polished components, and more breathing room for data.

## Pillar 6: Upgraded Google Health Sync (*Better Connection and Reliability & Maps Integration*)
*   **Connection Reliability:** Implement robust background refresh tokens and streamlined account handling so users don't face constant disconnects or timeouts.
*   **Maps Integration:** Utilize the requested location data to visualize walk/run routes directly on a map view inside the user's dashboard.

## Pillar 7: Proper Badges & UI
*   **Trophy Room UI:** A dedicated showcase for unlocked achievements.
*   **Beautiful Badging:** Upgraded SVG badges for hitting step targets, health goals, and calculator improvements seamlessly integrated into the user's profile loop.

## Pillar 8: Enterprise-Grade Compliance (*Proper Policy Follow & Twice Security*)
*   **Twice Security (2FA/MFA):** Enforce Two-Factor Authentication via Firebase Auth for user accounts to securely protect their sensitive biometrics.
*   **Strict Policy Follow:** Implement full GDPR & HIPAA-aligned data processing flows (explicit consent inputs, robust "Delete My Data" options, and comprehensive Terms of Service).
refresh rate