# Devowl Transcriptor

> AI-powered audio transcription and translation — upload any audio file and get a high-accuracy transcription plus a fluent English translation in seconds.

![Built with Vite](https://img.shields.io/badge/Vite-React-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase&logoColor=white)
![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)

---

## Overview

**Devowl Transcriptor** is a full-stack web application that allows authenticated users to:

- Upload any audio file and receive an **accurate transcription** in the original spoken language
- Get a **fluent English translation** of the transcription (or an English cleanup pass if the audio was already in English)
- **Review and manage history** — all transcriptions are saved per user and can be revisited or deleted at any time

---

## Features

| Feature | Description |
|---|---|
| 🎙️ Audio Upload | Client-side validation and base64 encoding before sending to backend |
| 📝 Transcription | Powered by the Lovable AI Gateway via a Supabase Edge Function |
| 🌐 Translation | Separate Edge Function produces fluent English output |
| 🗂️ History | All results are persisted in Postgres and accessible from the dashboard |
| 🔐 Authentication | OTP-based email verification; dashboard is protected (auth required) |

---

## Architecture

```mermaid
flowchart LR
  Browser[Browser UI] -->|Upload audio| Frontend[Vite + React App]
  Frontend -->|invoke transcribe| FnTranscribe[Edge Function: transcribe]
  FnTranscribe -->|Lovable AI Gateway| AI1[AI Transcription Model]
  Frontend -->|invoke translate| FnTranslate[Edge Function: translate]
  FnTranslate -->|Lovable AI Gateway| AI2[AI Translation Model]
  Frontend -->|read / write history| DB[(Supabase Postgres)]
  Frontend <-->|session management| Auth[Supabase Auth]
```

---

## Project Structure

### Supabase Database (Migrations in `supabase/migrations/`)

| Table | Purpose |
|---|---|
| `profiles` | Stores user profile data |
| `transcriptions` | Saves transcription and translation history per user |
| `email_verifications` | Supports the OTP email verification flow |

### Supabase Edge Functions (`supabase/functions/`)

| Function | Input | Output |
|---|---|---|
| `transcribe` | `{ audioBase64, mimeType, fileName }` | `{ transcription }` |
| `translate` | `{ text, detectedLanguage }` | `{ translation, isEnglish }` |
| `send-otp` | User email | Sends OTP via Resend |
| `verify-otp` | OTP token | Verifies and authenticates user |

---

## Environment Variables

### Frontend (Vite)

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Supabase Edge Functions

Set these secrets in your Supabase project dashboard (not in the frontend):