# Workspace Instructions & Reference Guide for Campuna

## Technical Blueprint as Primary Source of Truth
Whenever working on the Campuna project (backend, database, API routes, or Next.js frontend), **ALWAYS** refer to:
1. [Campuna_Complete_Technical_Blueprint.md](file:///d:/Projects/campuna%20fullstack/docs/Campuna_Complete_Technical_Blueprint.md)
2. [Campuna_Complete_Technical_Blueprint.docx](file:///d:/Projects/campuna%20fullstack/Campuna_Complete_Technical_Blueprint.docx)

## Core Technical Rules & Architecture

### Stack
- **Frontend**: Next.js (App Router, Tailwind CSS, Framer Motion, Zustand)
- **Backend**: Node.js + Express API
- **Database**: PostgreSQL with Prisma ORM

### Key Architectural Guidelines
1. **User Roles & Account Types**: Single `users` table with `role` (`ADMIN` | `USER`) and `account_type` (`PRIVATE` | `COMMERCIAL`). Profiles are split into `private_profiles` and `company_profiles`.
2. **German URL Structure**: All public and private user routes use German slugs (`/de`, `/de/anmelden`, `/de/registrieren`, `/de/mein-konto`, `/de/anzeige-erstellen`, etc.).
3. **Account Separation & Listing Limits**:
   - **Private Accounts**: Free for occasional selling of personal camping gear/vehicles. No subscription or company tools. Free listings with optional paid boosts. No publicly advertised listing limit; internal system safeguard capped at 10 active listings (11th listing triggers commercial activity review).
   - **Commercial Accounts**: For businesses, dealers, campsites, workshops, and rental companies. Free tier (up to 3 listings, basic profile) and Business tier (€29/month, up to 25 listings, cover image, analytics, directory presence, etc.).
4. **Campuna Credit Ledger (1 CC = €0.01)**: Append-only ledger (`credit_transactions`) with complete audit trail. Non-withdrawable as cash. Used for listing Boosts and Spotlight bookings (not to permanently pay for the €29/mo Business subscription).
5. **Direct Referral Engine**: 1-level direct referrals only. Private referral = 500 CC (after reg + 1st approved listing). Commercial referral = 1,000 CC (after reg + complete company profile).
6. **Campuna Pioneer Program**: First 300 qualified users (email verified + complete profile + 3 approved listings). Rewards: permanent Pioneer badge + one-time 1,000 CC bonus (no permanent algorithmic ranking advantage).
7. **AI Moderation Engine**: Separate current status (`listings.status`) from decision history (`listing_moderation`).
8. **Business Monetization**: €29/month recurring professional presence for predictable platform cash flow.
