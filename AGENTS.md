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
3. **Listing Free Limit**: Maximum of 3 active approved listings for free users (private and free commercial accounts).
4. **Campuna Credit Ledger**: Stored via append-only ledger (`credit_transactions`) with complete audit trail.
5. **AI Moderation Engine**: Separate current status (`listings.moderation_status`) from decision history (`listing_moderation`).
6. **Referral Engine**: Direct 1-level referral system (no multi-level, non-cash payouts).
7. **Pioneer Award**: First 300 qualified users with email verified + 3 approved listings.
