# Resilient Home 2040

A six-round household sustainability serious game for postgraduate project risk management workshops.

## Components
- `index.html`, `style.css`, `game.js`: single-browser demonstration, with four households and six rounds.
- `classroom.js`: shared classroom student submission and lecturer controls.
- `supabase/schema.sql`: protected database tables.
- `supabase/functions/classroom/index.ts`: authenticated session API and server-side simulation.

## Local demonstration
Open `index.html` in a browser. Use **Student workspace** to make decisions and **Lecturer dashboard** to advance after all four teams submit. Data is stored in that browser only.

## Shared classroom setup
1. Create a Supabase project. In its SQL Editor run `supabase/schema.sql`.
2. Install the Supabase CLI, log in and link the project.
3. Deploy the function with `supabase functions deploy classroom --no-verify-jwt`. This is necessary for the token-based classroom API. The function checks session/team tokens on every protected operation.
4. Configure the Edge Function secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` through Supabase. **Never** place the service-role key in browser JavaScript or a GitHub repository.
5. Host the static files over HTTPS, for example using an appropriate static hosting service. Open **Shared classroom**, enter the Supabase project URL and select **Create lecturer session**.
6. Save the generated lecturer token and four separate team tokens. Give each student team its own token and the session code. Teams join through the **Shared classroom** page on their own devices.
7. Students submit decisions. The lecturer selects **Refresh dashboard** to check status, then **Advance all teams** once all four have submitted. Students refresh to see updated results.

## Security and operational limitations
This is a teaching prototype. The session code is not a secret; tokens are credentials. Do not share the host token with students. The browser stores credentials in localStorage, so use trusted devices and clear browser storage after the workshop. There is no user login, token rotation, session expiry, or rate limiting. Do not store personal or sensitive student information in rationales. The API is cross-origin enabled for easy initial deployment; restrict allowed origins before production.

The Edge Function uses sequential database updates. It does not yet implement a fully atomic database transaction for advancing all teams, so interrupted requests could leave a partially advanced round. **Pilot-test with mock teams before teaching.** Status refresh is manual, not push-based real-time. Production deployment should add transactional round advancement, automatic refresh/realtime subscriptions, role-specific UI, recovery tools, access control hardening and automated tests.

## Scientific and pedagogical boundaries
Carbon reductions, costs and resilience indices are illustrative game parameters, not forecasts or independently validated household carbon calculations. The simulator does not physically model climate. Household investment choices affect emissions, resilience, comfort and finances. Exogenous events represent uncertainty. Compare decision quality and justified trade-offs, not a single 'winning' score.

## Suggested workshop
10:00–10:40 briefing and household analysis; 10:40–12:40 rounds 1–3; 12:40–13:25 lunch; 13:25–15:20 rounds 4–6 and final choices; 15:20–15:40 team comparison; 15:40–16:00 reflection.
