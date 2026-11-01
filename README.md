# Event AI — Personal Event Planning Platform

Event AI is a full-stack, GenAI-powered event planning application built for weddings, college cultural fests, milestone birthdays, corporate summits, and community celebrations. It combines deterministic financial arithmetic, backward milestone scheduling, meteorological intelligence, live venue directory matching, table seating planning, AI multi-tone invitation copy generation, and an offline-first Event Day Mode.

---

## Key Features

### 1. 7-Step Create Event Wizard & Curated Templates
- **Zod Schema Validation**: Real-time inline field validation ensuring dates, guest counts, and currencies conform to strict domain bounds.
- **Autosave Draft Recovery**: Saves state to `localStorage` every few seconds with an autosave badge and draft reset button.
- **Curated 1-Click Templates**: Instant pre-fills for Grand Heritage Weddings, College Cultural Fests, 50th Golden Birthdays, and AI Leadership Summits.
- **AI Plan Generation**: Calls Gemini 3.8 Flash (`gemini-3.8-flash`) via secure Express backend with structured JSON validation and a deterministic rule-based fallback if offline.

### 2. Deterministic Budget Planner
- **Zero Floating-Point Financial Math**: All currency storage and operations are computed deterministically in integer minor units (paise/cents).
- **Indian Lakh/Crore Notation**: Automatically formats values like `₹5,00,000` or compact `₹12 Lakh` / `₹1.50 Cr`, alongside USD, EUR, and GBP.
- **Visual Analytics**: Interactive Recharts Pie and Bar charts comparing target allocations against committed spend.
- **Category Variance Warnings**: Instant alerts when actual expenses exceed budgeted targets.
- **AI Savings Suggestions**: Identifies tangible optimizations with a 1-click confirm-to-apply action.

### 3. Timeline & Gantt Generator
- **Backward Scheduling Engine**: Automatically schedules milestone deadlines backwards from the target event date (T-90 days, T-30 days, T-7 days, T-1 day).
- **Dependency Graph Enforcement**: Tasks with prerequisites cannot be completed prematurely without an explicit override confirmation dialog.
- **Dual Visual Modes**: Switch between a phase-categorized checklist and an interactive Gantt chart.

### 4. Vendor Management & Quote Comparison
- **Multi-Quote Comparison**: Compare vendor bids side-by-side on quoted price, package inclusions, and ratings.
- **Award Vendor**: 1-click award automatically syncs the negotiated cost into the event's budget ledger.
- **Direct Dialing**: Integrated phone links (`tel:...`) and email links (`mailto:...`).

### 5. Guest Manager, Table Seating & RSVP
- **CSV Import & Export**: Import guest lists from CSV with automatic column detection, unique token assignment, and undo capability.
- **Public RSVP Links**: Dedicated `/rsvp/:token` URLs allowing guests to confirm attendance, plus-ones, and dietary restrictions without logging in.
- **Table Seating Planner**: Enforces table capacity constraints, assigning guests with visual occupancy badges.
- **AI Multi-Tone Invitations**: Generates invitation copy across 4 tones (Traditional, Formal, Modern, Playful) in English and regional languages.

### 6. Venues & Meteorological Intelligence
- **Open-Meteo Integration**: Fetches real-time weather forecasts and rain probabilities for the event date and geographic coordinates.
- **Weather Contingency Banner**: Generates specific contingency guidance (e.g. waterproof canopies, misting fans) based on precipitation probability.
- **Side-by-Side Venue Comparison**: Evaluates shortlisted venues on capacity match, indoor/outdoor setup, noise curfew hours, valet parking, and power backup.

### 7. Mobile-First Event Day Mode & Offline PWA
- **Live Run-of-Show**: Real-time timeline with live ticking clock ticker and "What's Next" milestone spotlight.
- **Emergency Speed-Dial**: 1-tap phone access to emergency services (112, 108, 101), venue duty manager, and AV leads.
- **Live Issue Log**: Record incidents with severity tags (low, medium, high, critical) and resolve them on the fly.
- **Offline PWA Support**: Service worker caching allows the app to function inside banquet halls with weak network connectivity.

### 8. Extras
- **Command Palette (`⌘K`)**: Quick fuzzy search across events, tasks, guests, and venues.
- **Dark Mode**: High-contrast, theme-aware palette toggle.
- **Executive PDF Brief Export**: Formatted printable brief for co-hosts, family members, and print shops (`window.print()`).
- **Eco Score Calculator**: Computes environmental sustainability rating based on local sourcing and digital workflows.

---

## Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express, tsx.
- **AI Engine**: Google Gen AI SDK (`@google/genai`) using `gemini-3.8-flash`.
- **Database & Auth**: Google Cloud Firestore & Firebase Auth (`firebase/firestore`, `firebase/auth`).
- **Build Tooling**: Vite 8.

---

## Getting Started

### Prerequisites
- Node.js 20+ (Node 22 recommended)
- npm 10+

### Installation
```bash
# Install dependencies
npm install

# Setup environment variables (optional for local mock fallback)
cp .env.example .env
```

### Running Locally
```bash
# Start full-stack dev server (Express backend + Vite frontend on port 3000)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Unit Tests
```bash
# Executes native deterministic calculation test suite
npm test
```

### Type Checking & Linting
```bash
npm run lint
```

### Production Build
```bash
# Build optimized client assets
npm run build

# Start production server
npm start
```

### Seeding Demo Events to Cloud Firestore
```bash
# Populates Firestore with 3 comprehensive demo events
npm run seed:firestore
```

---

## License
MIT License. Built for the Google AI Studio Build platform.
