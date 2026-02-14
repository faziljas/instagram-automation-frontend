# Supabase email templates

Use these when configuring **Authentication → Email Templates** in the Supabase dashboard.

## Reset Password

1. In Supabase: **Authentication** → **Email Templates** → **Reset Password**.
2. Paste the contents of `reset-password.html` into the template body (or use the HTML editor if available).
3. **Why the button is inline-styled:** The "Reset Password" button uses **inline styles** (`style="background-color: #2563eb; ..."`) instead of a class. Many email clients (Gmail, Outlook, etc.) ignore or override `<style>` and class-based CSS when rendering. Inline styles ensure the button stays **blue** in the actual sent email, not red.

## Logo

- The template uses the same logo as the "Confirm signup" email: `https://logicdm.app/logo.png`.
- Ensure `public/logo.png` is deployed so that URL is reachable in emails.
