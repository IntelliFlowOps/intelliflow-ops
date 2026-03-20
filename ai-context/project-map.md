# IntelliFlow Ops Project Map

## Stack
- Vite + React
- Deployed with GitHub + Vercel

## Data Rules
- Google Sheets is the source of truth
- App must remain read-only for business data
- App must never write to Google Sheets
- App must never expose API keys in frontend code

## Main App Purpose
- Internal ops dashboard for IntelliFlow Communications
- Used by founders and marketers
- Helps view business data from Google Sheets
- Includes AI assistant functionality

## Main Pages
- Dashboard
- Campaigns
- Customers
- Marketers
- Commission Ledger
- Ad Assistant

## Important Files
- src/pages/AdAssistantPage.jsx
- src/pages/CampaignsPage.jsx
- src/pages/DashboardPage.jsx
- src/hooks/useTabData.js

## Known Patterns
- Data is pulled from Google Sheets tabs
- Example hook pattern: useTabData('CAMPAIGNS')
- Business data must stay read-only

## Assistant Goals
- Founder mode should act like a real founder/operator assistant
- Ad Builder mode should help marketers build better ads
- Founder mode should usually stay concise
- Ad Builder mode should not have a strict short word limit

## Non-Negotiables
- Preserve anything already working
- Do not add write-back flows to Sheets
- Do not break deployed app behavior
