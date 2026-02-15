
# Audio Transcription & Translation Dashboard

## Overview
A clean, professional SaaS-style dashboard for transcribing audio files and translating them to English. No authentication required — immediately usable on load.

## Pages & Layout

### Single-Page Dashboard
- **Hero section** with app title and brief description
- **Central drag-and-drop upload zone** — large, prominent area supporting MP3, WAV, M4A, OGG, FLAC files (up to 10 minutes / ~20MB)
- **Processing status area** with step-by-step progress indicators: Uploading → Transcribing → Translating → Done
- **Split-pane results view**: Original Transcription (left) and English Translation (right)
- **Action bar**: Copy to clipboard buttons for each pane, and a Download as .txt button

## Design
- Minimalist, high-contrast SaaS aesthetic with generous whitespace
- Light mode by default with clean typography
- Subtle animations for upload zone hover/drop states and progress transitions
- Responsive layout — split pane stacks vertically on mobile

## Core Features

### 1. Audio Upload
- Drag-and-drop or click-to-browse file picker
- Client-side validation for file type and size before upload
- Visual upload progress bar

### 2. Transcription (via Lovable AI)
- Audio file sent to a backend edge function
- Edge function uses Lovable AI gateway to transcribe the audio with high accuracy
- Automatic source language detection
- Status updates shown in real-time on the frontend

### 3. Translation to English
- After transcription, a second AI call translates the text to fluent English
- If the source language is already English, the translation pane shows a note indicating no translation needed
- LLM-powered post-processing for formatting and punctuation correction

### 4. Results & Export
- Side-by-side display of original transcription and English translation
- One-click copy to clipboard for each pane
- Download as .txt file containing both the original and translated text

## Backend (Lovable Cloud)
- **Edge function for transcription**: Receives audio, calls Lovable AI for speech-to-text processing
- **Edge function for translation**: Takes transcribed text, detects language, returns English translation via Lovable AI
- Clear error handling with user-friendly messages for rate limits, unsupported files, or processing failures

## Error Handling
- File type/size validation with clear error toasts
- Network error feedback
- Rate limit (429) and payment (402) error messages surfaced to the user
- Graceful fallback if audio quality is too poor for transcription
