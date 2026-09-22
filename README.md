# Royal Services - Agent Updates App

> **A STEP AHEAD** — Enterprise Client Tracking, Token Management, & Expiry Notification Platform.

[![Production Deployment](https://img.shields.io/badge/Vercel-Deployed-success?logo=vercel)](https://rsagentapp.vercel.app)
[![Tests Passing](https://img.shields.io/badge/Tests-37%2F37%20Passing-brightgreen?logo=jest)](https://github.com/harishchandrakgehlot/rsagentapp)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.0%20(Turbopack)-black?logo=next.js)](https://nextjs.org/)
[![Brand Color](https://img.shields.io/badge/Brand%20Color-%232D3774-blue)](https://rsagentapp.vercel.app)

---

## 🌐 Live URLs & Repositories

- **Live Production App**: [https://rsagentapp.vercel.app](https://rsagentapp.vercel.app)
- **GitHub Repository**: [https://github.com/harishchandrakgehlot/rsagentapp](https://github.com/harishchandrakgehlot/rsagentapp)
- **Super Admin Account**: `harishchandrakgehlot@gmail.com`

---

## 🚀 Key Features (PRD v1.0 Compliant)

### 1. 🔍 Public Client Status Tracker (`/` and `/track/[token]`)
- **Direct Search & Shareable URL**: Clients can look up service progress instantly using their unique tracking token (e.g. `RS-TRV-8821`, `RS-AC-4019`).
- **Strict Privacy Boundary**: Agent phone numbers, internal operational notes, and admin authentication details are **never** exposed on public tracking endpoints.
- **Progress Visualizer**: Clear visual status timeline (`Registered` → `Document Review` → `Processing` → `Completed`) with real-time timestamps.
- **Downloadable PDF Summary**: One-click branded client receipt & status certificate formatted with the official Royal Services logo and `#2D3774` corporate palette.

### 2. 🔐 Super Admin Portal (`/admin/*`)
- **Protected by Next.js 16 Proxy Convention**: Secured using session cookies and `src/proxy.ts` routing guards.
- **Token Management**:
  - Issue new tracking tokens with agent assignment, service category, start date, and expiry date.
  - Real-time status update modal with audit history recording previous state, new state, timestamp, and operator note.
  - **Renewal Engine**: Expired tokens cannot have their dates manually stretched; they must be formally renewed via the dedicated renewal workflow with historical continuity.
- **Agent Directory**:
  - Filter and manage agents across Royal Services divisions (*Royal Travel*, *Royal Aircon*, *Royal Express*, *Royal Care*).
  - Quick WhatsApp chat trigger and active assignment tally.
- **System Settings & Activity Log**:
  - Full immutable audit log of every token creation, status change, renewal, and system notification.

### 3. ⏰ Automated Expiry Notifications (IST Timezone)
- **Schedule**: Triggers reminder dispatches at **30 days**, **15 days**, **7 days**, and **on the day of expiry** at 09:00 IST.
- **Channels**: Integrated with WhatsApp Cloud API webhook handler (`/api/notifications/whatsapp-webhook`) and transactional email templates with token-masked alert bodies.
- **Scheduled Trigger**: Endpoint `/api/cron/expiry-reminders` protected by `CRON_SECRET` for serverless cron execution.

---

## 🎨 Brand Identity

- **Primary Brand Color**: `#2D3774` (Deep Royal Navy)
- **Accent Brand Color**: `#161E42` (Midnight Ink)
- **Wordmark Neutral**: `#353439` (Slate Charcoal)
- **Official Motto**: *"A STEP AHEAD"*

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (Turbopack, App Router)](https://nextjs.org/)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Document Generation**: jsPDF
- **Deployment Platform**: Vercel Serverless

---

## 🧪 Acceptance Verification & Automated Tests

The application includes an automated test suite verifying all 37 functional, privacy, and architectural criteria outlined in PRD v1.0.

Run the test suite locally:

```bash
npm test
```

### Verification Results:
- **Total Test Suites**: 8
- **Total Test Checks**: 37 passed, 0 failed
- **Coverage**:
  1. `PRD-REQ-1`: Public Tracking & Privacy Bounds
  2. `PRD-REQ-2`: Super Admin Auth & Proxy Route Guards
  3. `PRD-REQ-3`: Token Creation & Duplicate Prevention
  4. `PRD-REQ-4`: Status Transition Audit Trail
  5. `PRD-REQ-5`: Token Expiry & Renewal Invariant
  6. `PRD-REQ-6`: IST Reminder Schedule Cadence (30d, 15d, 7d, 0d)
  7. `PRD-REQ-7`: WhatsApp & Email Webhook Payloads
  8. `PRD-REQ-8`: Branded PDF Generation & Royal Theme Palette

---

## 💻 Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/harishchandrakgehlot/rsagentapp.git
   cd rsagentapp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Provide your secrets:
   ```env
   SUPER_ADMIN_EMAIL=harishchandrakgehlot@gmail.com
   SUPER_ADMIN_INITIAL_PASSWORD=RoyalAdmin2026!
   CRON_SECRET=royal-services-cron-secret-2026
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deployment on Vercel

The project is linked to the Vercel project `rsagentapp` under account `harishchandrakgehlot-6808`:

```bash
npx vercel --prod
```

To enable continuous automatic deployments on every `git push`:
1. Open your Vercel Dashboard at [https://vercel.com/account/login-connections](https://vercel.com/account/login-connections)
2. Connect your GitHub account (`harishchandrakgehlot`).
3. Navigate to [Project Git Settings](https://vercel.com/harishchandrakgehlot-6808/rsagentapp/settings/git) and link `harishchandrakgehlot/rsagentapp`.

---

© 2026 Royal Services. All rights reserved. "A STEP AHEAD".

