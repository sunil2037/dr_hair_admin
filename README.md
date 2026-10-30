# Dr. Hair Admin Panel

Next.js and TypeScript admin-panel UI for the Dr. Hair mobile app.

## Start locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The sign-in screen is a UI preview only. The email selects a seeded demo role; any password is accepted for these UI-only accounts:

- Admin: `nandini.rao@drhair.health`
- Super Admin (Dr. Jai Bansal): `jai.bansal@drhair.health`

## Structure

```text
src/
  app/                         # Next.js entry point and global styling
  features/
    admin-users/               # Super Admin team and audit screens
    app-management/            # Content, notifications, updates, feature controls
    commerce/                  # Products, orders, coupons, referrals
    content/                   # Banners, videos, patient stories
    dashboard/                 # Role-aware workspace overview
    feature-controls/           # App feature and admin-module controls
    operations/                # Patients, reports, orders, clinic appointments
    shared/
      components/              # Shell, sign-in, dialogs, reusable UI
      lib/                     # Access rules and sample records
      types/                   # Shared role, record, and feature types
```

Feature screens stay grouped by domain. Shared UI and role/access rules live in `shared/`; sample records live behind `demo-data.ts`. This keeps screens independent and gives future API integration clear places to add feature-specific data access without introducing backend code into the UI.

## Demo behavior

- Super Admin can see all Admin workspace areas plus Admin Users, App Management controls, and Audit Log.
- Super Admin can invite demo admins, assign modules and actions, edit access, and suspend/reactivate demo accounts.
- App feature controls update local demo state. Admin Panel module controls also update which workspace sections appear in the Admin preview.
- Clinic appointments are browser previews from staff and sample app sources. The Flutter app has a separate local physical visit request flow for Dr. Jai Bansal; requests do not sync yet.
- Content/product forms, search, status filters, and record detail dialogs use local sample data.
- No authentication, API calls, or database writes are connected. Feature changes do not affect the Flutter app yet.

## Brand

The interface uses the Flutter app palette: navy `#1A365D`, teal `#0D9488`, canvas `#F7F9FC`, and border `#E2E8F0`.
