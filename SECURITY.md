# Security policy

## Reporting a vulnerability

Please report security problems **privately**, not in a public issue:

1. Open the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Describe what you found, how to reproduce it, and what an attacker could do with it.

Only the maintainer can see the report. You should get a reply within a week.

Examples of what's worth reporting:
- reading or changing another user's progress
- bypassing sign-in
- script injection on the site
- a secret committed to the repository

## Scope

- The site at https://bigowl.vercel.app and the code in this repository.
- The database rules in `supabase/migrations/`.

Problems in Supabase, Vercel or GitHub themselves should go to those companies.

## How BigOwl is protected

- **Database:** every request goes through row-level security, so each user can only read and write their own row.
- **Keys:** the browser only holds Supabase's publishable key. No secret keys are used anywhere in this project.
- **Browser:** a strict Content Security Policy allows scripts only from the site itself and network requests only to Supabase.
- **Third parties:** there are no analytics or other third-party scripts.

The full privacy and security checklist is in [COMPLIANCE.md](COMPLIANCE.md).
