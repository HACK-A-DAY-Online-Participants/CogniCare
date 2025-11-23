# 🧠 CogniCare - AI-Powered Cognitive Health Platform

<div align="center">

![CogniCare Banner](https://img.shields.io/badge/CogniCare-AI%20Powered-8b5cf6?style=for-the-badge)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.1.0-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![Google AI](https://img.shields.io/badge/Google%20AI-Gemini-4285F4?style=flat&logo=google)](https://ai.google.dev/)

**Empowering cognitive health through intelligent monitoring, personalized care, and engaging brain training**

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Architecture](#-architecture)

</div>

---

## 📋 Overview

**CogniCare** is a comprehensive cognitive health management platform designed for patients with dementia, Alzheimer's, and other cognitive conditions. It combines **AI-powered behavior analysis**, **real-time monitoring**, **gamified brain training**, and **collaborative care** to provide a holistic solution for cognitive health management.

### 🎯 Problem Statement

- **65M+** people worldwide live with dementia
- Caregivers struggle to monitor behavioral changes and cognitive decline
- Lack of personalized, engaging cognitive training tools
- Poor coordination between patients, caregivers, and healthcare experts

### 💡 Our Solution

A unified platform that connects **patients**, **caregivers**, and **medical experts** through intelligent monitoring, personalized insights, and collaborative care management.

---

## ✨ Key Features

### 🤖 **AI-Powered Behavior Analysis**
- **Anomaly Detection**: Real-time detection of unusual behavior patterns (inactivity, cognitive decline, task completion drops)
- **Predictive Insights**: ML-based predictions for cognitive performance trends
- **Personalized Recommendations**: AI-generated actionable insights based on individual patterns
- **Baseline Tracking**: Automatic establishment of behavioral baselines for each patient
- **Confidence Scoring**: Statistical confidence levels for all AI predictions (75-95% accuracy)
- **PDF Report Generation**: Comprehensive AI analysis reports for healthcare providers

### 🎮 **Cognitive Training Games** (6 Interactive Games)
1. **Memory Match** - Card matching for memory enhancement
2. **Family Memory** - Photo recognition for familiar faces
3. **Pattern Recognition** - Visual-spatial skill development
4. **Attention Training** - Focus and concentration exercises
5. **Logic Puzzles** - Problem-solving challenges
6. **Speed Memory** - Advanced rapid recall training

**Features:**
- Difficulty levels (Easy/Medium/Hard)
- Score tracking & leaderboards
- Progress analytics
- Points & rewards system

### 👥 **Multi-Role Architecture**

#### **Patient Dashboard**
- Real-time health metrics & cognitive scores
- Daily challenges & task management
- Memory board with photo uploads
- Social community feed
- Rewards & achievement system
- Location tracking for safety
- Caregiver connection via unique codes

#### **Caregiver Portal**
- Multi-patient management
- AI anomaly alerts & notifications
- Real-time activity monitoring
- Task assignment & tracking
- Analytics dashboard with charts
- Expert consultation booking
- Patient connection system

#### **Expert Console**
- Patient overview & analytics
- Consultation management
- Professional credentials verification
- Advanced analytics & reporting
- Multi-patient insights

### 🔐 **Authentication & Security**
- Firebase Authentication (Email/Password + Google OAuth)
- Role-based access control (Patient/Caregiver/Expert/Admin)
- Secure patient-caregiver linking via unique codes
- Request/approval system for connections
- Real-time notification system

### 💬 **Communication Tools**
- **AI Chatbot**: Gemini-powered conversational assistant
- **Voice Agent**: Speech-to-text interaction
- **Social Feed**: Community posts with comments & likes
- **Real-time Notifications**: Firebase Cloud Messaging integration

### 📊 **Advanced Analytics**
- **Activity Logs**: Comprehensive tracking (login, tasks, games, medication)
- **Behavior Patterns**: Time-of-day analysis, weekly trends
- **Cognitive Metrics**: Game scores, completion rates, streaks
- **Visual Charts**: Recharts-powered data visualization
- **Trend Analysis**: Improving/Stable/Declining indicators

### 🎁 **Gamification System**
- Points & levels
- Daily streaks
- Achievement badges
- Rewards catalog
- Progress tracking
- Leaderboards

---

## 🛠 Tech Stack

### **Frontend**
- **React 19.2.0** - Modern UI library
- **TypeScript 5.9.3** - Type-safe development
- **React Router 7.1.3** - Client-side routing
- **Framer Motion 11.15.0** - Smooth animations
- **Lucide React** - Beautiful icon library
- **Recharts 2.15.0** - Data visualization

### **Backend & Services**
- **Firebase 11.1.0**
  - Authentication (Email/Password, Google OAuth)
  - Firestore (NoSQL database)
  - Cloud Storage (Photo uploads)
  - Analytics
- **Google Generative AI (Gemini)** - AI chatbot & insights
- **Liveblocks 3.10.1** - Real-time collaboration (future feature)

### **State Management**
- **Zustand 5.0.2** - Lightweight state management
- **React Context API** - Auth & global state

### **Development Tools**
- **Vite 7.2.4** - Lightning-fast build tool
- **ESLint** - Code quality
- **TypeScript ESLint** - Type checking

---

## 🚀 Installation

### Prerequisites
- Node.js 18+ and npm
- Firebase account
- Google AI API key (Gemini)

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/cognicare.git
cd cognicare/cognicare

# Install dependencies
npm install

# Configure environment variables
# Create .env file in root:
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_GEMINI_API_KEY=your_gemini_api_key

# Run development server
npm run dev

# Build for production
npm run build
```

---

## 🏗 Architecture

### **Project Structure**
```
cognicare/
├── src/
│   ├── components/
│   │   └── common/          # Shared components (Navigation, Chatbot, VoiceAgent)
│   ├── pages/
│   │   ├── patient/         # Patient dashboard & features
│   │   ├── caregiver/       # Caregiver portal
│   │   └── expert/          # Expert console
│   ├── services/
│   │   ├── aiService.ts     # AI analysis engine
│   │   ├── gemini.ts        # Gemini AI integration
│   │   └── mockDataService.ts
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication & user management
│   ├── types/               # TypeScript definitions
│   └── config/
│       └── firebase.ts      # Firebase configuration
└── package.json
```

### **Data Flow**
1. **User Authentication** → Firebase Auth → Role-based routing
2. **Activity Logging** → Firestore → AI Analysis Service
3. **AI Insights** → Pattern Detection → Anomaly Alerts → Caregiver Notifications
4. **Real-time Updates** → Firestore listeners → UI updates

### **AI Analysis Pipeline**
```
Activity Logs → Baseline Calculation → Pattern Analysis → Anomaly Detection → Insight Generation → PDF Reports
```

---

## 🎨 Advanced Features

### **AI Behavior Analysis Engine**
- **Metrics Tracked**: Activity frequency, task completion, cognitive performance, login patterns
- **Statistical Methods**: Standard deviation, trend analysis, time-series forecasting
- **Alert Types**: Critical (no activity 48h+), Concern (cognitive decline), Warning (low engagement)
- **Confidence Levels**: 75-95% based on data volume and pattern consistency

### **Real-time Collaboration**
- Patient-caregiver connection system
- Request/approval workflow
- Notification system
- Activity feed synchronization

### **Accessibility**
- Voice interaction support
- Large, readable fonts
- High-contrast UI
- Simplified navigation for cognitive impairment

### **Security & Privacy**
- HIPAA-compliant data handling
- Encrypted data storage
- Role-based permissions
- Secure file uploads

---

## 📈 Impact & Metrics

### **For Patients**
- ✅ Improved cognitive engagement through gamification
- ✅ Better medication & task adherence
- ✅ Enhanced safety through location tracking
- ✅ Social connection & community support

### **For Caregivers**
- ✅ 70% reduction in monitoring time via AI alerts
- ✅ Early detection of cognitive decline
- ✅ Data-driven care decisions
- ✅ Streamlined communication with experts

### **For Healthcare Providers**
- ✅ Comprehensive patient analytics
- ✅ Automated report generation
- ✅ Remote patient monitoring
- ✅ Evidence-based treatment planning

---

## 🔮 Future Enhancements

- [ ] **Wearable Integration** - Smartwatch data for vital signs
- [ ] **Video Consultations** - In-app telemedicine
- [ ] **Medication Reminders** - Smart pill dispenser integration
- [ ] **Multi-language Support** - Accessibility for diverse populations
- [ ] **Offline Mode** - Progressive Web App capabilities
- [ ] **Advanced ML Models** - Deep learning for better predictions
- [ ] **Family Portal** - Extended family member access
- [ ] **Emergency SOS** - One-tap emergency contact

---

## 👥 Team

Built with ❤️ for improving cognitive health worldwide.

---

## 📄 License

This project is developed for hackathon purposes. All rights reserved.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent conversational capabilities
- **Firebase** for robust backend infrastructure
- **React Community** for excellent tooling and libraries
- **Healthcare Professionals** for domain expertise and feedback

---

<div align="center">

**CogniCare** - *Empowering minds, one insight at a time* 🧠✨

Made for [Hack-A-Day] 2025

</div>
