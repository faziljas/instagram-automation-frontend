# Email Templates for LogicDM

This directory contains custom email templates for Supabase authentication emails.

## How to Use

### 1. Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### 2. Update Email Verification Template

**Option A: Use the existing Supabase template format (Recommended)**
1. Click on **"Confirm signup"** template in Supabase
2. Copy the **entire contents** of `verify-email-supabase.html`
3. Paste it into the Supabase email template editor (replace all existing content)
4. **Important:** Make sure to click **Save changes** button
5. **Test:** Send a test email to verify the button shows white background with black text

**Option B: Use the full-featured template**
1. Click on **"Confirm signup"** template
2. Copy the **entire contents** of `verify-email.html`
3. Paste it into the Supabase email template editor (replace all existing content)
4. Click **Save changes**

**What Changed:**
- Button changed from blue (`#2563EB`) to white background (`#ffffff`)
- Button text changed from white to black (`#000000`)
- Added black border (`2px solid #000000`) for better visibility
- Added `!important` flags to prevent email clients from overriding styles

**Note:** If the button still appears blue after updating:
- Clear your browser cache
- Check if Supabase saved the template correctly (look at the "Source" tab)
- Some email clients may cache old templates - wait a few minutes and try again
- The template uses `!important` flags to ensure styles aren't overridden

### 3. Template Variables
Supabase uses Go template syntax. The following variables are available:
- `{{ .ConfirmationURL }}` - The verification link URL
- `{{ .Token }}` - The verification token (if needed)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address

## Design Features

- **White background** (`#ffffff`) for main content area
- **Black text** (`#000000`) for headings and body text
- **Blue accent** (`#2563eb`) for brand name and CTA button
- **Responsive design** that works on mobile and desktop
- **Clear call-to-action** button with white text on blue background
- **Alternative link** provided for users who can't click the button

## Customization

You can customize:
- Colors: Update hex codes in the template
- Fonts: Change the font-family in the `<head>` section
- Spacing: Adjust padding values
- Button style: Modify the CTA button colors and size
