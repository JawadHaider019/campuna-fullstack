# CAMPUNA
## Complete Technical Architecture, Workflows, Database Review and Development Blueprint
**Next.js + Node.js/Express + PostgreSQL (Prisma ORM)**
*Document version: August 2026*

This document consolidates the Campuna product architecture, existing Bubble database review, user workflows, monetization, referrals, Campuna Credit, AI moderation, admin system, SEO strategy and implementation roadmap.

---

## 1. Project Overview
Campuna is a public camping marketplace and platform. The strategic goal is to create a self-growing ecosystem: more companies create more offers and services; this creates more public content and SEO value; more Google visibility brings more traffic and private users; more traffic increases the value of Campuna for companies; and more companies join.

```
MORE COMPANIES ──► MORE LISTINGS + SERVICES ──► MORE PUBLIC SEO CONTENT
      ▲                                                    │
      │                                                    ▼
MORE VALUE FOR COMPANIES ◄── MORE TRAFFIC ◄── BETTER GOOGLE VISIBILITY
```

The referral system, Campuna Credit, Free + Business model and partner program are designed to accelerate this loop.

---

## 2. Public Access and SEO
Campuna should not be hidden behind a login or invitation code. Public content remains accessible to search engines and visitors.

| Public without login | Requires registration/login |
| :--- | :--- |
| Listings | Contacting providers |
| Company profiles | Publishing listings |
| Categories | Favorites |
| Guides and blog content | Chat |
| SEO landing pages | Personal account features |
| Relevant public content | Advanced paid features |

---

## 3. User Roles and Account Types
The system uses one central `users` table. A user has a `role`, and normal users also have an `account_type`.

```
USERS
 ├── ADMIN (Full platform access)
 └── USER
      ├── PRIVATE
      └── COMMERCIAL
```

| Field | Values | Purpose |
| :--- | :--- | :--- |
| `role` | `ADMIN` / `USER` | Authorization level |
| `account_type` | `PRIVATE` / `COMMERCIAL` | User profile and business rules |

---

## 4. Private User Workflow
```
VISITOR ──► /de/registrieren ──► Select PRIVATE ──► Create Account ──► Confirm Email ──► My Account
                                                                                              │
Create Listing ◄─────────────────────────────────────────────────────────────────────────────┘
      │
      ▼
AI Moderation ──┬──► Approved ──► PUBLIC
                ├──► Rejected ──► REJECTED
                └──► Manual Review ──► Admin Decision
```
- Free private users can create a maximum of **3 active listings** (configurable in settings).
- **Pioneer Award**: Granted after email confirmation and $\ge 3$ approved listings, subject to the first 300 qualified-user limit.

---

## 5. Commercial User Workflow
```
VISITOR ──► /de/registrieren ──► Select COMMERCIAL ──► Create Account ──► Confirm Email ──► Company Profile
                                                                                                │
FREE PLAN (Basic profile, normal visibility, limit 3 listings) ◄────────────────────────────────┘
      │
   Upgrade
      ▼
BUSINESS PLAN (Extended profile, cover image, longer description, higher limits, spotlight, statistics)
```

---

## 6. Admin System
Admin system includes: Users (Private/Commercial, Suspend/Restore), Listings (Pending, AI Approved, AI Rejected, Manual Review, Reports), Companies, Subscriptions, Invoices, Campuna Credits, Referrals, Pioneer Awards, Strategic Partners, Broadcast Messages, Posts/Guides, FAQ/Categories, Beta Feedback, and System Settings.

---

## 7. Listing and AI Moderation Engine
```
USER ──► CREATE LISTING ──► Save as PENDING
                                 │
                        OPENAI MODERATION
                                 ├── High confidence valid ──► APPROVED ──► PUBLIC
                                 ├── Clearly invalid ───────► REJECTED
                                 └── Uncertain ─────────────► MANUAL_REVIEW ──► ADMIN APPROVAL/REJECT
```
Keep listing status separate from full moderation decision history.

---

## 8. Campuna Pioneer Program
- Granted to users who confirm email and have $\ge 3$ approved listings.
- Capped at first 300 qualified users. Stored permanently with award position (e.g. `position: 127`).

---

## 9. Free + Business Monetization Model
- **Free Profile**:
  - Company name, logo, short description (max 150 characters), contact details, website.
  - Normal search visibility on Campuna.
  - Limited number of active listings (maximum of 3 active approved listings).
- **Business Profile** (~€29/month, exact price subject to final approval):
  - Professional extended company profile.
  - Custom header/background cover image.
  - Longer description (longer bio, e.g. up to 1000 characters).
  - High listing limits or unlimited listings.
  - Higher search visibility (Spotlight or highlighted placements).
  - Statistics/Performance analytics.
  - CSV/API import and additional business features.

---

## 10. Direct Referral System
- **Referral Code & Tracking**: Unique referral code and link for every account (both commercial and private users).
- **No Cash Payout / Direct Only**: Direct 1-level referral system (no multi-level marketing, no non-cash payout, no commissions for referrals made by referred users).
- **Commercial Referral reward**: If a company invites another commercial provider and the referred provider becomes a paying Business customer (completes email confirmation + first Business subscription payment), the referrer receives Campuna Credit.
- **Private Referral reward**: If a private user invites another camper, and the referred camper registers and publishes their first approved listing, the referrer receives a free Premium boost or Campuna credit.
- **Credit Use cases**:
  - Paying Business plan subscription fees.
  - Buying Premium boosts.
  - Spotlight placements.
  - Other paid Campuna marketplace features.

---

## 11. Campuna Credit Ledger Engine
- Internal non-cash balance (`credit_transactions`) with full audit trail.
- **Earn**: Referral rewards, promotions, admin adjustments.
- **Spend**: Business plan subscription fees, Premium Boosts, Spotlight placement, paid functions.

---

## 12. Strategic Partner System
- Partners receive a special **Strategic Partner Status** (custom field or flag).
- Enhanced custom visibility and branding on Campuna.
- Personal partner referral link.
- Dedicated partner landing pages or custom homepage sections.
- Individual/custom reward conditions and credit structures.

---

## 13. High-Level ERD Architecture
```
USERS ──┬──► private_profiles
      ├──► company_profiles
      ├──► user_achievements
      ├──► subscriptions ──────────► PLANS
      ├──► referral_codes ────────► REFERRALS
      ├──► credit_transactions
      ├──► favorites ──────────────► LISTINGS
      └──► conversation_members

LISTINGS ──┬──► CATEGORIES
         ├──► listing_images
         ├──► listing_moderation (History)
         ├──► listing_reports
         └──► conversations ──► conversation_members ──► messages
```

---

## 14. German URL Slug Structure
All user-facing and auth pages use German URLs:
- Home: `/de`
- Login: `/de/anmelden`
- Register: `/de/registrieren`
- Email Confirmation: `/de/e-mail-bestaetigen`
- My Account: `/de/mein-konto`
- Create Listing: `/de/anzeige-erstellen`
- My Listings: `/de/meine-anzeigen`
- Favorites: `/de/favoriten`
- Messages: `/de/nachrichten`
- Company Profile: `/de/unternehmen/[slug]`

---

## 15. The 4 Reusable Core Engines
1. **SUBSCRIPTION ENGINE**: Free / Business tier limits and feature gating.
2. **REFERRAL ENGINE**: Code generation, tracking, attribution, and qualification events.
3. **CREDIT LEDGER**: Immutable transaction audit log (Earn/Spend/Refunds).
4. **MODERATION ENGINE**: AI moderation, confidence scoring, and admin manual review queue.
