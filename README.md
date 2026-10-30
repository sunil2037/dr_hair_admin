# Dr. Hair Admin Panel

Next.js and TypeScript admin-panel UI for the Dr. Hair mobile app.

## Start locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Admin sign-in uses the backend email OTP flow. Set `DRHAIR_BACKEND_URL` in the shell or local environment to the Express API origin (defaults to `http://localhost:5001`). The backend must include the admin email in its private `ADMIN_EMAILS` setting; development OTP behavior is controlled by the backend's `DEFAULT_TEST_OTP`.

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

Feature screens stay grouped by domain. Shared UI and role/access rules live in `shared/`; sample records live behind `demo-data.ts`. Server Route Handlers proxy authenticated requests so JWTs remain in an HttpOnly cookie. Registered patient profiles load from the paginated backend API; clinical assessments and other operations still use sample records until their APIs are connected.

## Demo behavior

- Super Admin can see all Admin workspace areas plus Admin Users, App Management controls, and Audit Log.
- Super Admin can invite demo admins, assign modules and actions, edit access, and suspend/reactivate demo accounts.
- App feature controls update local demo state. Admin Panel module controls also update which workspace sections appear in the Admin preview.
- Clinic appointments are browser previews from staff and sample app sources. The Flutter app has a separate local physical visit request flow for Dr. Jai Bansal; requests do not sync yet.
- Content/product forms, search, status filters, and record detail dialogs use local sample data.
- The current backend admin role has no granular server-side permissions, so the connected panel exposes the patient directory as read-only. Other operational screens remain UI previews and do not persist to the backend.
- Admin media uploads can use `/api/admin/media/upload`; the route streams multipart data to the shared Cloudinary upload endpoint without exposing the admin session token to browser JavaScript. Save a returned video URL as a draft through `/api/admin/media/videos`.

## Brand

The interface uses the Flutter app palette: navy `#1A365D`, teal `#0D9488`, canvas `#F7F9FC`, and border `#E2E8F0`.
