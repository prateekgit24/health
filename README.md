# HOW (Health Over Wealth) 🏋️‍♂️🥗

HOW (Health Over Wealth) is a comprehensive health and fitness knowledge and tracking platform. Built to help users build sustainable fitness habits, it combines verified nutrition facts, practical routines, and advanced health calculators into a robust, modern web application.

## ✨ Features

- **Health Calculators:** Advanced tools to compute BMI, BMR, TDEE, Body Fat percentage, and Daily Caloric Requirements.
- **Nutrition Tracking:** Extensive, verified food and nutrition database tracking macros and micronutrients.
- **Activity & Routines:** Pre-built, goal-based workout routines and activity tracking capabilities.
- **Social Integration:** Add friends and compare health milestones and activity benchmarks.
- **Google Fit / Health Connect:** Secure integration with external health tracking APIs.
- **User Dashboard:** Personalized insights, progress monitoring, and achievement badge unlocking.

## 💻 Tech Stack

- **Frontend:** [Next.js (App Router)](https://nextjs.org/) & React 19
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend/Auth:** [Firebase](https://firebase.google.com/) (Authentication, Firestore, Admin SDK)
- **Language:** TypeScript

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

- Node.js (v20+)
- npm or yarn
- A Firebase Project (with Authentication and Firestore enabled)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YourUsername/how.git
   cd how
   ```

2. **Install dependencies**
   Navigate to the frontend folder and install the required packages:
   ```bash
   cd frontend
   npm install
   ```

3. **Environment Setup**
   Copy the example environment file and fill in your Firebase credentials:
   ```bash
   cp .env.example .env.local
   ```
   *(Ensure you update `.env.local` with your actual Firebase API keys and Google Client IDs).*

4. **Add Firebase Admin SDK**
   Place your Firebase Admin SDK service account JSON file in `frontend/more/` matching the name pattern `health-32b40-firebase-adminsdk-*.json` or as specified in your environment variables.

5. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3500](http://localhost:3500) to view it in your browser.

## 🌍 Deployment

This project is optimized for deployment on **Vercel**. 

1. Push your code to GitHub.
2. Import the repository into your Vercel dashboard.
3. Set the **Root Directory** to `frontend`.
4. Add all your Firebase and Google API keys to the Vercel **Environment Variables** settings.
5. Click **Deploy**.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
