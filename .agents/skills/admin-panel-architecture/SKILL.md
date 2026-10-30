---
name: admin-panel-architecture
description: Structure and extend the Dr Hair Next.js admin panel, including authentication boundaries, feature data access, and API-backed workflows.
---

# Admin Panel Architecture

Use this skill when implementing admin sign-in/onboarding, patient profile screens, API integration, or changes spanning multiple admin features.

## Follow this repository's Next.js version

- Read the repository `AGENTS.md` first. Before editing Next.js code, consult the relevant installed guide under `node_modules/next/dist/docs/`; this repo uses Next.js 16 and local guidance warns that conventions differ from older examples.
- Keep feature code under `src/features/<domain>/`, shared UI/access rules in `src/features/shared/`, and route composition in `src/app/`. Keep business/data logic out of presentation components.
- Inspect the current demo-data and session-state flows before replacing or extending them. Introduce a typed API client/service boundary and domain-specific response types rather than calling `fetch` throughout components.
- Keep loading, empty, error, and success states explicit. Preserve current visual patterns and role-aware navigation while changing data behavior.

## Authentication and authorization

- The existing sign-in screen is explicitly demo-only. Do not present its seeded-role or any-password behavior as real authentication, and do not treat hidden navigation as server authorization.
- Inspect the backend OpenAPI and auth middleware before choosing a login flow. The panel must use a server-issued session and backend-enforced permissions; do not invent password, OTP, role, or session behavior that the API does not support.
- Do not expose server secrets in `NEXT_PUBLIC_*`, browser bundles, local storage, UI messages, or logs. Keep private tokens in the narrowest server-side boundary supported by this app's architecture.
- Patient clinical data is sensitive: fetch only what the signed-in admin is authorized to view, and avoid unnecessary caching or browser persistence.

## Change scope

- Keep reusable controls in the existing shared component layer. Avoid broad rewrites of demo workflows when the task is limited to a single onboarding/profile path.
- Read `../backend/docs/openapi.yaml` and the Flutter app's current API behavior when a workflow spans clients. Update the source contract and clients together when endpoint behavior changes.
- For workflows that change navigation, permissions, or API shapes, trace the complete route and affected feature screens before editing.
