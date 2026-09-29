# Campuna — Feature Status & Roadmap Tracking Document

**Date**: September 2026  
**Tech Stack**: Next.js (App Router, Tailwind CSS, Zustand, Framer Motion) + Node.js/Express API + PostgreSQL (Prisma ORM)  
**Reference**: [Campuna Complete Technical Blueprint](file:///d:/Projects/campuna%20fullstack/docs/Campuna_Complete_Technical_Blueprint.md)

---

## 📊 Development Progress Overview

```
[██████████████████████░░░] ~82% Overall Completion
```

- ✅ **Completed / Ready**: Core Auth, Marketplace Listings, Search & Filters, Direct Messaging, Qwen AI Content Moderation, Credit Ledger, Pioneer Program, Admin Dashboard, Camping Calculators & SEO Infrastructure.
- 🔄 **In Progress / Polish**: Stripe Payment Gateway & Webhook Handlers, Real-time WebSockets/SSE for Chat.
- ⏳ **Pending / Planned**: Production Email Provider (SMTP/Resend/Postmark), Extended Commercial Analytics Dashboard, Dedicated Strategic Partner Portal.

---

## 1. Authentication, Users & Profiles

| Feature | Status | Details & Notes |
| :--- | :---: | :--- |
| **Registration (`/registrieren`)** | ✅ **Done** | Separation between Private and Commercial accounts, referral code input support. |
| **Login (`/login`) & JWT Authentication** | ✅ **Done** | Token-based auth, role & user type handling (`ADMIN`, `USER`, `PRIVATE`, `COMMERCIAL`). |
| **Email Verification (`/verify-email`, `/email-bestaetigen`)** | ✅ **Done** | Verification token generation and status updates in the database. |
| **Private Profile (`/mein-konto`)** | ✅ **Done** | First/last name, bio, location, phone, avatar/cover images, user listing overview. |
| **Company Profile & Dealer Landing Page (`/anbieter/[id]`)** | ✅ **Done** | Logo, cover banner, impressum, social media links, VAT ID, tier badge, public company profile. |
| **Password Reset (Forgot Password Flow)** | 🔄 **Partial** | Backend endpoints available; needs binding to a production SMTP/email provider. |

---

## 2. Listings & Marketplace (Core Marketplace)

| Feature | Status | Details & Notes |
| :--- | :---: | :--- |
| **Create Listing (`/anzeige-erstellen`)** | ✅ **Done** | Multi-step form with image uploads, categories, pricing, negotiable toggle, condition, location. |
| **Listings Catalog & Search (`/inserate`)** | ✅ **Done** | Dynamic filtering by category, price range, location, condition, seller type, and keywords. |
| **Listing Detail Page (`/inserate/[id]`)** | ✅ **Done** | Image gallery, seller info card, Pioneer badge indicator, report listing trigger, direct chat CTA. |
| **Category Pages (`/kategorien`, `/kategorie/[slug]`)** | ✅ **Done** | Dedicated SEO landing pages for motorhomes, caravans, camping gear, campervans, etc. |
| **Favorites / Watchlist (`/favoriten`)** | ✅ **Done** | Add/remove listings to watchlist with database persistence. |
| **Listing Protection Limits** | ✅ **Done** | Private: Safeguard soft-cap at 10 active listings. Commercial: 3 listings (Free) / 25+ listings (Business). |
| **Listing Reporting System** | ✅ **Done** | Flag suspicious listings; reports are routed directly to the admin moderation queue. |

---

## 3. AI Moderation Engine & Content Review (Qwen Model)

| Feature | Status | Details & Notes |
| :--- | :---: | :--- |
| **Qwen AI Content Moderation Pipeline** | ✅ **Done** | Automatic evaluation of titles, descriptions, and content on listing submission for guidelines compliance using Qwen. |
| **Confidence Scoring & Status Flow** | ✅ **Done** | Automated flow: `APPROVED` (published immediately), `REJECTED`, or `REVIEW` / `MANUAL_REVIEW`. |
| **Admin Moderation Queue** | ✅ **Done** | Dedicated admin UI to manually inspect, approve, or reject edge cases and flagged listings. |

---

## 4. Campuna Credit Ledger (1 CC = €0.01) & Boosts

| Feature | Status | Details & Notes |
| :--- | :---: | :--- |
| **Append-Only Credit Ledger** | ✅ **Done** | `credit_transactions` table ensuring a complete audit trail (credits, debits, adjustments). |
| **Listing Boosts (`/boosten`)** | ✅ **Done** | 7-day, 14-day, and 30-day reach boost options payable via Campuna Credits. |
| **Spotlight Placement for Dealers** | ✅ **Done** | Promoted visibility packages for company profiles and premium dealer listings. |
| **Credit Packages Purchase** | 🔄 **Partial** | UI and ledger credit actions ready; Stripe Checkout webhook for cash purchases in progress. |

---

## 5. Referral Engine & Pioneer Program

| Feature | Status | Details & Notes |
| :--- | :---: | :--- |
| **Direct 1-Level Referral System** | ✅ **Done** | Unique referral code per user; tracking and attribution of referred users. |
| **Automated Referral Rewards** | ✅ **Done** | Private: 500 CC after 1st approved listing. Commercial: 1,000 CC after company profile completion. |
| **Campuna Pioneer Program (First 300 Users)** | ✅ **Done** | Automatic qualification check (Verified email + complete profile + 3 approved listings). |
| **Pioneer Badge & 1,000 CC Bonus** | ✅ **Done** | Permanent trust badge on profile & listings + one-time 1,000 CC bonus credited to the ledger. |

---

## 6. Business Monetization & Subscriptions

| Feature | Status | Details & Notes |
| :--- | :---: | :--- |
| **Free vs. Business Tier Differentiation** | ✅ **Done** | 3 listings vs. 25+ listings, cover banner, extended bio (150 vs 1,000 chars), tier access rules. |
| **Subscription Booking Page (`/abo`)** | ✅ **Done** | €29/month Business plan presentation, feature matrix, and upgrade UI. |
| **Stripe Recurring Billing & Webhooks** | 🔄 **In Progress** | Stripe Customer Portal and webhook events (`checkout.session.completed`, `invoice.payment_succeeded`). |

---

## 7. Direct Messaging & Chat

| Feature | Status | Details & Notes |
| :--- | :---: | :--- |
| **Listing-Tied Chat System (`/nachrichten`)** | ✅ **Done** | Buyer-to-seller conversations mapped directly to specific listings. |
| **Unread Status & Badges** | ✅ **Done** | Unread message indicator (`is_read`) and chat thread management. |
| **Real-time Updates (WebSockets / SSE)** | ⏳ **Left** | Currently using REST polling; upgrade to Socket.io/SSE for instant real-time delivery planned. |
| **Offline Email Notifications for Messages** | ⏳ **Left** | Email alerts triggered when a user receives a new message while offline. |

---

## 8. Admin & Content Management System (`/admin`)

| Feature | Status | Details & Notes |
| :--- | :---: | :--- |
| **Admin Dashboard Overview** | ✅ **Done** | Key KPI cards (Total Users, Listings, Credits/Revenue, Reports, Subscriptions). |
| **User Management** | ✅ **Done** | View user types, roles, suspension toggle (`is_suspended`), and profile oversight. |
| **Listing & Report Moderation** | ✅ **Done** | Approve, reject, delete listings, inspect user reports, and resolve flagged content. |
| **System Broadcast Messages** | ✅ **Done** | Create, manage, and broadcast system-wide alerts and updates. |
| **Blog & Guide CMS (`/blog`, `/admin/posts`)** | ✅ **Done** | Post creation and management for SEO guides, tips, and camping news. |
| **Strategic Partners Management** | 🔄 **Partial** | Partner flag and basic setup present; dedicated partner dashboard expansion planned. |

---

## 9. Calculators, Tools, Content & SEO

| Feature | Status | Details & Notes |
| :--- | :---: | :--- |
| **Camping Trip Cost Calculator (`/reisekostenrechner`)** | ✅ **Done** | Interactive tool calculating fuel, tolls, campsites, and food expenses. |
| **Caravan / Motorhome Payload Calculator (`/zuladungsrechner`)** | ✅ **Done** | Interactive payload, axle weight, and safety margin calculator. |
| **Legal Pages** | ✅ **Done** | Impressum, Privacy Policy (Datenschutz), Terms (AGB), Nutzungsbedingungen, Safe Trading (Sicher handeln). |
| **Help & Informational Pages** | ✅ **Done** | How Campuna Works, About Us, FAQ & Help, User Feedback ("Fehlt dir etwas?"). |
| **SEO & Crawler Infrastructure** | ✅ **Done** | Dynamic `sitemap.js`, `robots.js`, OpenGraph metadata, and Schema.org structured data. |

---

## 📌 Summary of Remaining Action Items (To-Do / Left)

1. **Complete Stripe Payment Integration**:
   - Production webhook listeners for €29/month recurring Business subscriptions and Credit top-up packages.
2. **Production Email Service**:
   - Connect SMTP / Resend provider for transactional emails (verification links, password resets, offline chat alerts).
3. **Real-time Chat Infrastructure**:
   - Implement WebSockets / SSE for instant messaging and live notifications.
