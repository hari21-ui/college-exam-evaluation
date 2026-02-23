# Assessment Admin Module Prototype (Vue 3 + Vite + TypeScript)

## Setup

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite (default: `http://localhost:5173`).

## MVP Features

- App shell with fixed left sidebar + full-width content area.
- Assessments module with fixed-scene pages:
  - `/assessments/upload`
  - `/assessments/evaluate`
- Upload pipeline simulation: uploading → converting → ready/failed.
- Student ID validation: mandatory and duplicate warning.
- Evaluation workspace with 3-column layout:
  - Student Navigator (200 mock students)
  - PDF viewer (pdf.js rendering `/public/sample.pdf`)
  - Scoring panel with 20 questions and max-mark validation.

## Locking model in this MVP

- Status values: `available | locked_by_me | locked_by_other | in_progress | completed`.
- Opening a student:
  - `available` or `in_progress` acquires lock to current evaluator.
  - `locked_by_other` opens in view-only mode.
- Autosave simulates debounce save (`500ms`) + persistence delay (`400ms`) and displays `Saving...`/`Saved`.
- Mark complete sets status to `completed` and releases lock.
- Re-open for edits triggers a confirmation modal and re-enters `in_progress` with lock acquired by current evaluator.

## V2 ideas

- Edit history timeline and conflict resolution.
- Evaluator productivity analytics and workload balancing.
- Objective-question support and rubric templates.
- Real conversion pipeline (OCR, PDF normalization, storage URLs, retry jobs).
