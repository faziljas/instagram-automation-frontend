# Email Templates for LogicDM

This directory contains custom email templates for Supabase authentication emails.

## How to Use

### 1. Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### 2. Update Email Verification Template
1. Click on **"Confirm signup"** template
2. Copy the contents of `verify-email.html`
3. Paste it into the Supabase email template editor
4. Save the template

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
