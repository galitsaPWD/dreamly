# Dreamly 🌙

Dreamly is an AI-powered bedtime story generator for children, designed to create personalized, high-quality audio narrations that blend education with wonder.

## 🚀 Features

- **AI-Powered Narratives**: Bespoke stories generated using Groq (LLaMA 3) based on child profile and interests.
- **Premium Audio Content**: High-fidelity narrations powered by ElevenLabs.
- **Smart Ambient Sound**: Automatically assigned background soundscapes (Rain, Ocean, Space, Forest, etc.) based on story themes.
- **Offline Resilience**: Integrated local caching system that allows stories to be generated and read even when internet is spotty.
- **Progressive Narrations**: Background audio "repair" that upgrades basic TTS to premium ElevenLabs audio once generated.
- **Multi-platform**: Built with Expo for iOS, Android, and Web support.

## 🛠️ Technical Stack

- **Framework**: Expo / React Native
- **Styles**: NativeWind (Tailwind CSS)
- **Database/Auth**: Supabase
- **LLM**: Groq (LLaMA 3)
- **TTS**: ElevenLabs API / Expo-Speech Fallback
- **Storage**: AsyncStorage + Supabase Cloud Sync
- **Animations**: React Native Reanimated

## 📦 Getting Started

### 1. Prerequisites

- Node.js (v18+)
- Expo Go app on your physical device (optional but recommended)

### 2. Installation

```bash
git clone <repository-url>
cd dreamly
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory and add the following:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### 4. Running the App

```bash
# Start the Expo development server
npx expo start

# For specific platforms
npm run android
npm run ios
npm run web
```

## 🔐 Security & Auth

Dreamly uses Supabase Auth for parent accounts. All child data is stored securely and scoped to the authenticated parent session. Local storage is encrypted and isolated per user.

## 📄 License

Internal Project - All Rights Reserved.
