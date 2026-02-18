# Google Search Console: “Page with redirect” and indexing

## What the reports mean

- **Page with redirect** – The 2 URLs `http://www.logicdm.app/` and `http://logicdm.app/` redirect to `https://logicdm.app/`. That’s correct: we want one canonical URL. GSC lists them as “affected” because they are redirecting URLs, not because something is broken.
- **Duplicate without user-selected canonical** – Fixed (validation passed, 0 pages).
- **Duplicate, Google chose different canonical than user** – Google picked a different canonical than we want; we fix this by making our canonical explicit and consistent everywhere.

## What’s already in place (code)

- **Canonical base:** `https://logicdm.app` (no www) in `lib/canonical.ts`.
- **Middleware:** HTTP → HTTPS (301), www → non-www (301), trailing slash normalized (301).
- **Sitemap:** Only `getCanonicalBase()` URLs (so only `https://logicdm.app/...`).
- **Robots:** Sitemap URL uses `getCanonicalBase()`.
- **Canonical tags:** Root layout has `CanonicalLink`; home page has `alternates.canonical`.

So in code, only the canonical form is used; redirects are intentional.

## What to do in Google Search Console

1. **Don’t “fix” the redirects**  
   Keep HTTP and www redirecting to `https://logicdm.app`. Do not try to make `http://` or `http://www.` indexable.

2. **Validate the canonical URL**  
   - In GSC: **URL inspection** → enter `https://logicdm.app` → **Request indexing** for the canonical home page.  
   - Optionally do the same for `https://logicdm.app/pricing` and other main public pages.

3. **Optional: Remove old URLs**  
   If you want the 2 redirecting URLs to disappear from the report faster:  
   - **Removals** → **New request** → temporarily remove `http://www.logicdm.app/` and `http://logicdm.app/`.  
   - This only hides them from search for a short time; it doesn’t change the fact that they redirect (which is correct).

4. **Host (Vercel/Netlify) redirects**  
   Ensure the host also does 301 redirects so the chain is clean:
   - **Vercel:** Project → **Settings** → **Domains**: add `logicdm.app` (primary) and `www.logicdm.app`, and set “Redirect to primary domain” so `www` → non-www and HTTP → HTTPS at the edge.
   - **Netlify:** **Domain management** → add both domains, set primary to `logicdm.app`, enable “Redirect to HTTPS” and “Redirect www to non-www” (or equivalent).

## Why “Validation failed” can still show

When you click **Validate** for “Page with redirect”, Google re-crawls `http://` and `http://www.`. If they still redirect (as they should), GSC may keep counting them as “Page with redirect” and validation can still show as “failed” because the redirecting URLs are still there. That’s expected. What matters is:

- Only `https://logicdm.app` (and its subpaths) are in the sitemap and canonicals.
- HTTP and www keep redirecting with 301 to that canonical.

Over time, Google will index the canonical and the redirecting URLs will matter less in the report.

## Summary

| Action | Where |
|--------|--------|
| Keep HTTP → HTTPS and www → non-www (301) | Already in middleware + host |
| Sitemap and canonicals use only `https://logicdm.app` | Already in code |
| Request indexing for `https://logicdm.app` | GSC → URL inspection |
| Optional: temporary removal of http/www URLs | GSC → Removals |
| Ensure host does 301 for http and www | Vercel/Netlify domain settings |

No further code changes are required for “Page with redirect”; the remaining steps are configuration and GSC actions.
