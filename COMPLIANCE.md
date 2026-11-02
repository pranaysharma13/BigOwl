# Compliance log

Running record of privacy, security, accessibility and licensing decisions for BigOwl. Run the checklist at the bottom before every production deploy.

> These notes reduce risk but are not legal advice. Items marked **Lawyer?** are worth a professional opinion if the site ever grows beyond friends and family.

## Scope

- Free, non-commercial personal project shared with friends. No payments, no ads, no analytics.
- Operator: the site owner (an individual). There is no public contact email by the owner's choice; users contact the owner directly.
- No Terms of Service, by the owner's choice. Not legally required for a free personal site. **Lawyer?** if it becomes public or commercial.

## Personal data

| Data | Purpose | Where | Retention |
|---|---|---|---|
| Email address | Magic-link sign-in, account identity | Supabase Auth (Americas region) | Until the account is deleted |
| `age_confirmed_at` timestamp | Self-declared 13+/16+ confirmation; the user can edit it, so it is not a verified record | Supabase Auth user metadata | Until the account is deleted |
| Progress JSON (topics, patterns, solved problems, scores, active days, language preference) | Show and sync progress | Supabase `public.progress`, RLS-protected | Until deleted; assessment history capped at 50, active days at 400 |
| Request logs (IP, user agent, time) | Hosting, security | Vercel, Supabase | Provider defaults (short-lived) |
| Browser local storage: progress copy, Supabase session, theme | Strictly necessary for the site to work | User's browser | Until sign-out (progress and session cleared) or browser data cleared |

- No personal data in URLs. Magic-link tokens are handled by Supabase with PKCE and removed from the URL.
- Users can **export** (Account → Download my data, JSON) and **delete** (Account → Delete my account, calls `delete_my_account()`, cascades to `progress`).
- Privacy page at `/privacy`, linked from the footer and the sign-in form.

## Processors and third parties

| Service | Role | Data sent | Notes |
|---|---|---|---|
| Supabase | Auth, database, sign-in email | Email, progress JSON, request metadata | Americas region. DPA available in Supabase dashboard. |
| Vercel | Static hosting | Request metadata | Hobby plan: personal, non-commercial use only. |
| LeetCode | Outbound links only | Nothing until the user clicks; then the normal referrer is limited by `Referrer-Policy: strict-origin-when-cross-origin` and `rel="noopener noreferrer"` | Not embedded. |

No other runtime scripts, SDKs, CDNs, fonts, iframes or embeds. Adding any requires an entry here first, stating what data it sends.

## Children (COPPA / GDPR-K)

- Sign-in form requires ticking "I am at least 13 years old (16 if I live in the EU or UK)". The timestamp is stored in user metadata as a self-declaration. It is not verified: users can edit their own metadata, and someone calling the Supabase API directly can skip the checkbox. That is normal for a small site with no age verification.
- Privacy page states the site is not for younger children and how to request deletion.

## Cookies and consent

- No cookies set by BigOwl. Local storage holds only strictly necessary items (session, progress, theme), so no consent banner is required under ePrivacy.
- No tracking or analytics. If analytics are ever added, they must load only after opt-in consent.

## Security

- Secrets: only the Supabase URL and anon/publishable key are used in the frontend, via `VITE_` env vars in `.env.local` (git-ignored) and Vercel settings. The service_role key and database password are never used in this project.
- Database: RLS on `public.progress` with select/insert/update/delete policies `(select auth.uid()) = user_id`. All privileges revoked from `anon`; default privileges revoked because the project was created with "automatically expose new tables" on. Row size check under 256 KB.
- Grant hardening (`supabase/migrations/20261103000000_harden_grants.sql`, security review L3 and L4): revokes TRUNCATE, REFERENCES and TRIGGER on `progress` from `authenticated`, stops new functions in `public` being executable by PUBLIC, and revokes direct execution of Supabase's `rls_auto_enable()` event-trigger function. Migrations are applied manually by pasting them into the Supabase SQL Editor; the file is safe to run more than once.
- `delete_my_account()`: `security definer`, `search_path = ''`, executable by `authenticated` only, deletes only the caller.
- Headers (`vercel.json`): CSP `default-src 'self'`, scripts self only, `connect-src` limited to this project's Supabase host, `frame-ancestors 'none'`, `object-src 'none'`; HSTS; `X-Content-Type-Options: nosniff`; `Referrer-Policy`; `Permissions-Policy`; `Cross-Origin-Opener-Policy`.
- XSS: user input (visualizer inputs) is rendered with `textContent` or escaped. `innerHTML` / `dangerouslySetInnerHTML` is used only for first-party content bundled with the site.
- Progress import was removed (security review L1), so untrusted progress files can't enter the app. Users can still download their data.
- `style-src 'unsafe-inline'` is allowed because the visualizers set inline styles for positions and sizes. No inline scripts.
- Dependencies: `npm audit` reports one `minimatch` advisory, which npm lists as 11 entries because of ESLint's dependency chain. It is dev-only and not shipped to users; waiting on an ESLint release. Recheck on each dependency update.

### Accepted Security Advisor warnings

- `delete_my_account` is executable by signed-in users on purpose: it is how users delete their own account, and it only ever deletes the caller.
- "Leaked password protection" does not apply: BigOwl signs in with magic links and has no passwords.

## Accessibility (WCAG 2.1 AA target)

- Skip link, visible focus styles, semantic landmarks, labelled controls, `aria-pressed` and `aria-selected` on toggles and tabs.
- Visualizer narration is an `aria-live="polite"` region; every figure step is also described in text.
- Reduced motion respected (wordmark, graph animation, FLIP transitions).
- Colour: small orange text uses `--signal-text` (darker in light mode, lighter in dark mode) to keep 4.5:1 contrast. Status is never shown by colour alone.
- Known gap to review: full keyboard alternative for "click on the figure" prediction questions (Show me is always available).

## Content and licensing

- Textbook: structure and section numbers follow CLRS 3rd edition. All prose, pseudocode (BigOwl's own notation), figures and questions are original. Non-affiliation notice in the footer and on `/about`. **Lawyer?** if the site is ever monetised.
- LeetCode: titles, numbers and links only; no statements copied. Trademark and non-affiliation notice on `/about` and `/patterns`.
- Fonts: Archivo, Newsreader, Geist, Geist Mono via `@fontsource-variable`, SIL Open Font License 1.1, self-hosted.
- Icons and illustrations: drawn for this project (inline SVG).
- Licences: application code under MIT (`LICENSE`); educational content in `src/content/` under CC BY-NC 4.0 (`LICENSE-CONTENT`). Stated in the README and on `/about`.
- npm dependencies: MIT / ISC / Apache-2.0 / BSD licences.

## Repository safeguards

- GitHub Actions CI (`.github/workflows/ci.yml`) runs type-check, lint, tests and build on every pull request and push to `main`, with read-only permissions. Actions are pinned to commit SHAs, and Dependabot (`.github/dependabot.yml`) updates them monthly.
- `SECURITY.md` explains how to report a vulnerability privately via GitHub's private vulnerability reporting.
- Node version pinned with `.nvmrc` (22) and `engines` in `package.json`.

## Pre-deploy checklist

- [ ] CI is green on the pull request (type-check, lint, tests, build)
- [ ] `npm audit --omit=dev` shows no high or critical issues
- [ ] No secrets in git (`git grep -n "service_role\|sb_secret"` returns nothing; `.env.local` not committed)
- [ ] Vercel env vars set for Production and Preview
- [ ] Every file in `supabase/migrations/` applied in the SQL Editor; RLS enabled on every table in `public`
- [ ] Supabase Auth redirect URLs include the production domain
- [ ] No new third-party script, font, CDN or embed (or it is documented above)
- [ ] Privacy page "Last updated" date reflects any data change
- [ ] Keyboard-only pass and a contrast check on any new UI
