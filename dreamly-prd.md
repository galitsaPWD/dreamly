# 🌙 Dreamly
### Product Requirements Document (PRD)
**Version:** 1.0  
**Author:** Wana  
**Status:** Planning

---

## 1. Overview

**Dreamly** is a personal mobile app that generates warm, personalized AI-powered bedtime stories for children. Built with love — not for scale, but for one child someday. May be published in the future if it feels ready.

> *"I built this before I even had a kid, because I wanted to be a good dad."*

---

## 2. Problem

Generic bedtime stories don't feel personal. Parents want something that speaks directly to their child — their name, their age, their interests, the lessons they need right now. Nothing on the market feels intimate enough.

---

## 3. Goal

Build a minimal, beautiful, offline-first mobile app that generates personalized bedtime stories using AI, reads them aloud, and saves them for later — all without requiring an account.

---

## 4. Target User

- Primary: A parent reading to a young child (ages 2–12)
- Platform: iOS & Android
- Auth: None — fully local in V1
- Tone: Personal, quiet, meaningful

---

## 5. Design Principles

- **One thing at a time** — never overwhelm, never clutter
- **Minimal and intentional** — every screen earns its place
- **Soft dark mode** — navy/indigo palette, warm cream text, stars and moon motifs
- **Emotional first, functional second** — this is a bedtime experience, not a utility app

---

## 6. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Expo (SDK 51+) |
| Language | TypeScript |
| Navigation | Expo Router |
| Styling | NativeWind v4 (Tailwind) |
| AI | Groq API (llama-3.3-70b-versatile) |
| Narration | Expo Speech (V1), ElevenLabs (V2) |
| Local Storage | AsyncStorage |
| Cloud Storage | Supabase (sync + backup) |
| Deployment | Expo EAS Build |

---

## 7. App Flow

```
Launch
  │
  ├── First time → Onboarding → Home
  └── Returning  → Home directly

Home
  ├── Generate a Story → Wizard → Generating → Story Reader
  └── Library → Saved Stories → Story Reader
```

---

## 8. Screens

### 8.1 Onboarding *(runs once)*
| Step | Content |
|---|---|
| 1 | Welcome screen — app name, tagline, "Let's begin" CTA |
| 2 | Create child profile — emoji avatar, name, age |
| 3 | Pick interests — grid of illustrated tags (max 3) |
| 4 | "You're all set" — profile preview, "Read your first story" CTA |

**Logic:** Saved to AsyncStorage on completion. Never shown again.

---

### 8.2 Home
- Greeting (time-aware: Good morning / evening)
- Active child profile card
- Generate Story CTA (primary, full-width)
- Recent Stories list (last 2–3)
- Tab bar: Generate · Library

---

### 8.3 Story Wizard *(4 steps)*
| Step | Input |
|---|---|
| 1 | Age confirmation (tap to select) |
| 2 | Interests (pre-filled from profile, adjustable) |
| 3 | Story style (Funny / Gentle / Magical / Adventurous) |
| 4 | Lesson (free text + quick-select presets: "be kind", "don't be afraid", "listen to others", "try your best", "sharing is caring") |

- Progress bar across top
- Back button on every step
- Final step triggers generation

---

### 8.4 Generating
- Fullscreen loading state
- Moon icon + animated dots
- Rotating atmospheric copy:
  - "gathering stars…"
  - "softening the night…"
  - "finding the perfect words…"
  - "your story is almost here…"
- Feels like something being woven, not computed
- Auto-transitions to Story Reader on completion

---

### 8.5 Story Reader
- Story cover (emoji-based, gradient bg)
- Subtle header: *"Tonight's story for {child_name}"*
- Title — serif, centered, spaced out, let it breathe like a real book
- Tags (lesson, read time)
- Narration player (play/pause, scrubber, volume)
  - Expo Speech `rate: 0.82` — slow, drifting, almost sleepy pacing
  - Small pauses injected between paragraphs
  - Auto-scroll synced to narration (optional toggle — on by default)
- Story text (serif font, comfortable reading size)
- Post-story moment: display *"The night grows quiet."* — no buttons, no UI, just a pause. Then fade controls back in gently.
- Save to library button

---

### 8.6 Library
- List of all saved stories
- Filter by child profile (future)
- Tap to open in Story Reader

---

## 9. V1 Features

| Feature | Details |
|---|---|
| Story generation | Groq API, llama-3.3-70b, 300–450 words, JSON response (title + story) |
| Story guard | If title missing, story missing, or story < 250 words → silent retry once |
| Narration | Expo Speech, device TTS |
| Save stories | AsyncStorage + Supabase sync |
| Onboarding | Single child profile, local |
| Offline reading | Saved stories work without internet |
| Language | English only |

---

## 10. V2 Features

| Feature | Details |
|---|---|
| Offline mode | Full offline generation fallback handling |
| ElevenLabs narration | Warm, natural voice — swap from Expo Speech |
| Ambient sounds | Rain, ocean, forest — plays under narration |
| Story cover art | Auto-generated illustration style per story |
| Multiple child profiles | Profile switcher on Home |

---

## 11. V3+ Ideas *(future)*

- Story Journal — parent notes attached to a story
- Yearly recap — *"10 stories you read together this year"*
- PDF keepsake export
- Story dedicated to someone (*"Made for Lily on her 5th birthday"*)
- Published to App Store / Play Store

---

## 12. Groq Prompt Template

```
System:
You are a warm, imaginative children's story author.
Write calming bedtime stories with gentle pacing and a soothing ending.
Stories should be 300–450 words, age-appropriate, and naturally weave in the lesson.

Follow this structure strictly:
- Beginning: introduce the child character and setting — soft, calm, unhurried
- Middle: a gentle problem or moment of curiosity to explore
- Ending: a peaceful resolution that winds down naturally into sleep tone
- Final line: always end with a single calming sentence suitable for drifting to sleep

Respond in this JSON format only:
{
  "title": "A soft, poetic title like 'Liam and the Quiet Forest'",
  "story": "Full story content here, no headers or formatting"
}

User:
Write a bedtime story for a {age}-year-old {gender} who loves {interests}.
Style: {style}. Lesson: {lesson}.
```

---

## 13. Data Schema

### AsyncStorage Keys
```
dreamly:profile         → { name, age, emoji, interests }
dreamly:stories         → [ ...story objects ]
dreamly:onboarded       → boolean
```

### Supabase Tables
```sql
profiles  → id, name, age, emoji, created_at
stories   → id, profile_id, title, content, style,
            lesson, play_count, last_read_at, created_at
```

### Offline Behavior
- Offline detected via `@react-native-community/netinfo`
- Generate button disabled when offline
- Message shown: *"No internet — read a saved story instead 🌙"*
- Redirects to Library
- No fake loading states, ever

---

## 14. Build Order

- [x] PRD complete
- [ ] Expo project setup + NativeWind
- [ ] Onboarding flow
- [ ] Home screen
- [ ] Story wizard
- [ ] Groq integration
- [ ] Story reader + Expo Speech
- [ ] AsyncStorage save/load
- [ ] Supabase sync
- [ ] Library screen
- [ ] Polish + animations
