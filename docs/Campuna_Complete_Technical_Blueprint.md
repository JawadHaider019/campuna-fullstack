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
- **Goal**: Reward early active supporters and establish foundational trust and platform liquidity.
- **Limit**: Strictly capped at the first 300 qualified users (private or commercial).
- **Qualification Criteria**:
  - **Private User**: Verified account (email) + complete profile (name, bio, location, picture) + at least 3 approved listings.
  - **Commercial User**: Verified business account (email) + complete company profile (company name, bio, location/address, logo, contact) + at least 3 approved listings.
- **Pioneer Status & Benefits**:
  - **Lifelong Pioneer Badge**: Displayed permanently on user profile and all published listings with award position (e.g. `position: 127`) as a high-trust early-supporter mark.
  - **One-time Reward of 1,000 CC**: Credited to the user's Credit Ledger upon initial qualification.
- **Strict Separation from Monetization & Visibility**:
  - **No Permanent Preferred Ranking**: Listings are sorted strictly by natural recency and paid Boosts.
  - **No Permanent Visibility Bonuses**: Does not grant artificial exposure multipliers.
  - **No Automatic Spotlight Advantages**: Spotlight is exclusively booked via separate packages.
  - *Principle*: Visibility benefits remain exclusively tied to Boosts, Business subscriptions, and Spotlight bookings. Pioneer status functions purely as early-supporter prestige and trust recognition.

---

## 9. Free + Business Monetization Model
- **Free Profile**:
  - Company name, logo, short description (max 150 characters), contact details, website.
  - Normal search visibility on Campuna.
  - Limited number of active listings (maximum of 3 active approved listings).
- **Business Profile** (€29/month recurring subscription):
  - Professional extended company profile (header cover image, up to 1,000 characters bio).
  - Higher listing limits (up to 25+ listings), performance analytics & lead pipeline.
  - CSV/API import and business inquiry management.
  - **Revenue Anchor**: Paid recurring professional presence (EUR cash/card/SEPA). Not permanently payable with credits to secure predictable, sustainable platform revenue.

---

## 10. Direct Referral System
- **Core Principle**: Win-win growth engine rewarding users for bringing new active users and providers to the platform.
- **Architecture**: Direct 1-level referral system (no multi-level marketing, non-withdrawable).
- **Private Referral Reward**: **500 CC** to both referrer and referee.
  - *Trigger*: Rewarded after registration + first approved listing.
- **Commercial Referral Reward**: **1,000 CC** to both referrer and referee.
  - *Trigger*: Rewarded after registration + completed/approved company profile.

---

## 11. Campuna Credit Ledger Engine
- **Valuation**: **1 Campuna Credit (CC) = €0.01** (1 Cent value).
- **Cash Policy**: Internal credit ledger (`credit_transactions`), strictly non-withdrawable as cash.
- **Use Cases (Spend)**:
  - **Listing Boosts**: 7-day, 14-day, and 30-day reach boosts for marketplace listings.
  - **Spotlight Bookings**: Promoted featured placements.
  - *Restriction*: Credits are not used to permanently replace the €29/month Business subscription.
- **Sources (Earn)**:
  - Direct referral rewards (500 CC private / 1,000 CC commercial).
  - Pioneer one-time achievement reward (1,000 CC).
  - Credit package top-ups (e.g., 500 CC, 800 CC, 1,300 CC, 2,500 CC) and administrative adjustments.

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
