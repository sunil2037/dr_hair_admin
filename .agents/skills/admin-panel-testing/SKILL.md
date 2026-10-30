---
name: admin-panel-testing
description: Plan or add reliable tests for Dr Hair admin-panel authentication, role access, forms, API states, and patient-profile workflows.
---

# Admin Panel Testing

Use this skill when the task requests admin-panel test coverage or verification, especially for authentication, permissions, forms, and API integration.

## Discover the available test setup

- Read `AGENTS.md` and the installed Next.js testing guide under `node_modules/next/dist/docs/01-app/02-guides/testing/` before choosing a framework or writing Next-specific tests.
- Check `package.json` and the lockfile for an existing runner. The current scripts expose lint/build but may not include a test runner; do not assume Jest, Vitest, or Playwright is installed.
- Prefer the smallest test layer that proves the requested behavior: pure unit tests for access/data helpers, component tests for interaction and states, and browser tests only for critical end-to-end flows.
- Do not add a testing dependency or broad test scaffold unless the task calls for tests and the existing tooling cannot cover them.

## Behaviors to cover

- Authentication and role checks, including denied access and direct navigation to protected routes.
- Form validation, submission locking, API success/error recovery, and preservation of user-entered values after failures.
- Loading, empty, error, and populated states without relying on live services or demo records that can change.
- Patient profile privacy and permission checks; never assert or print real patient data in fixtures or logs.
- Use accessible labels and user-level interactions where component testing is available; avoid tests coupled to implementation details or styling class names.
