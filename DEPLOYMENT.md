# Classroom deployment checklist

## Current deployment
Supabase project: `Home2040DB` (`ytehmcrpuokcwckxlofr`).
Edge Function: `https://ytehmcrpuokcwckxlofr.supabase.co/functions/v1/classroom`.
Schema migration `initial_classroom_schema` and transactional round migration `atomic_classroom_round_advancement` have been applied.

## Publish the browser application
The static files `index.html`, `style.css`, `game.js` and `classroom.js` can be hosted by a static hosting service over HTTPS. If using GitHub Pages, check whether Pages is available for the private repository under your GitHub plan and configure it in **Settings → Pages**. A public Pages URL does not make the underlying private repository public, but the published game itself will be accessible to anyone who has its URL.

Do not put the service-role key into a static site.

## Classroom pilot
1. Open **Shared classroom** and create a lecturer session.
2. Save the host token and four team tokens separately. Avoid using real student names.
3. Open four independent browsers or private browsing contexts and join each as a different team.
4. Submit an affordable investment and a rationale for each team.
5. Confirm that advancing is blocked until all four have submitted.
6. Advance and verify that all teams have the same round and that purchases cannot be repeated.
7. Repeat through round six, including the final completion state.

## Known limitations
The application still requires manual refresh, token storage uses browser localStorage, and session creation is unauthenticated. A production-facing deployment should add lecturer login, session expiry, rate limiting and stricter CORS origins. The simulator uses illustrative teaching assumptions, not validated household forecasts.
