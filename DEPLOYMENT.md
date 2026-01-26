# Deployment Guide

This guide covers deploying the Instagram Automation SaaS Frontend to Vercel (recommended) and other platforms.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Vercel Deployment](#vercel-deployment)
4. [Alternative Platforms](#alternative-platforms)
5. [Production Checklist](#production-checklist)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ A GitHub/GitLab/Bitbucket repository with your code
- ✅ Backend API deployed and accessible
- ✅ Stripe account with publishable key
- ✅ Domain name (optional, Vercel provides free subdomain)
- ✅ All environment variables ready

---

## Environment Variables

### Required Variables

Create these environment variables in your deployment platform:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# App Configuration
NEXT_PUBLIC_APP_NAME=Instagram Automation SaaS
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags (Optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEBUG=false
```

### Variable Descriptions

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://api.yoursite.com/api` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (starts with `pk_`) | `pk_live_...` |
| `NEXT_PUBLIC_SITE_URL` | Your frontend URL (for SEO metadata) | `https://yoursite.com` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Instagram Automation SaaS` |
| `NEXT_PUBLIC_APP_VERSION` | Version number | `1.0.0` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics tracking | `true` or `false` |
| `NEXT_PUBLIC_ENABLE_DEBUG` | Enable debug mode | `false` in production |

**Important:** All variables use `NEXT_PUBLIC_` prefix because they're exposed to the browser.

---

## Vercel Deployment

Vercel is the recommended platform for Next.js applications (created by the Next.js team).

### Step 1: Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### Step 2: Connect Repository

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your Git repository
4. Vercel auto-detects Next.js configuration
5. Click **"Deploy"**

#### Option B: Via Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow prompts to link project
```

### Step 3: Configure Environment Variables

1. Go to your project on Vercel Dashboard
2. Navigate to **Settings → Environment Variables**
3. Add all variables from the list above
4. Select environments: **Production**, **Preview**, **Development**
5. Click **"Save"**

### Step 4: Configure Build Settings

Vercel auto-detects these, but verify:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` or `next build`
- **Output Directory:** `.next` (auto-detected)
- **Install Command:** `npm install` or `yarn install`
- **Development Command:** `npm run dev`
- **Node Version:** 18.x or higher

### Step 5: Configure Domain

1. Go to **Settings → Domains**
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Vercel automatically provisions SSL certificate

### Step 6: Deploy

- **Automatic:** Push to your main/master branch
- **Manual:** Click "Redeploy" in Vercel Dashboard
- **CLI:** Run `vercel --prod`

---

## Alternative Platforms

### Netlify

```bash
# Build command
npm run build

# Publish directory
.next

# Environment variables
Add via Netlify Dashboard → Site Settings → Environment Variables
```

**Netlify Configuration** (`netlify.toml`):

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Railway

1. Connect GitHub repository
2. Railway auto-detects Next.js
3. Add environment variables in Railway Dashboard
4. Deploy automatically on push

### AWS Amplify

1. Connect repository in Amplify Console
2. Select branch to deploy
3. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `.next`
4. Add environment variables
5. Deploy

### Docker (Self-Hosted)

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

**Build & Run:**

```bash
docker build -t instagram-auto-frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.yoursite.com \
  -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... \
  instagram-auto-frontend
```

---

## Production Checklist

### Before Deployment

- [ ] All environment variables configured with production values
- [ ] `.env.local` is gitignored (not committed to repository)
- [ ] Backend API is deployed and accessible
- [ ] Stripe is in live mode (not test mode)
- [ ] `NEXT_PUBLIC_SITE_URL` points to production domain
- [ ] All console.log statements removed or disabled (handled by next.config.js)
- [ ] Error tracking configured (optional: Sentry, LogRocket)
- [ ] Analytics configured (optional: Google Analytics, Mixpanel)

### Assets & SEO

- [ ] Create `public/og-image.png` (1200x630px for social sharing)
- [ ] Create `public/favicon.ico`
- [ ] Create `public/favicon-16x16.png`
- [ ] Create `public/apple-touch-icon.png` (180x180px)
- [ ] Create `public/site.webmanifest` for PWA
- [ ] Update `robots.txt` if needed
- [ ] Create `sitemap.xml` (optional)

### Security

- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Security headers configured (done in next.config.js)
- [ ] CORS configured on backend API
- [ ] Rate limiting configured on backend
- [ ] No secrets in client-side code
- [ ] Content Security Policy reviewed

### Performance

- [ ] Images optimized (use Next.js Image component)
- [ ] Build succeeds without errors: `npm run build`
- [ ] Lighthouse score > 90 (run `npm run build && npm start`)
- [ ] Bundle size analyzed: `npm run build`

### Testing

- [ ] Test all authentication flows (login, register, logout)
- [ ] Test protected routes redirect to login
- [ ] Test all API integrations
- [ ] Test Stripe checkout flow
- [ ] Test on mobile devices (responsive design)
- [ ] Test error boundaries work correctly
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## Post-Deployment

### 1. Verify Deployment

Visit your production URL and check:

- [ ] Site loads without errors
- [ ] Login/register works
- [ ] Dashboard loads with data from backend
- [ ] Instagram account connection works
- [ ] Automation rules can be created/edited
- [ ] Stripe checkout redirects work
- [ ] All images load correctly
- [ ] No console errors in browser DevTools

### 2. Monitor Application

Set up monitoring for:

- **Error Tracking:** Sentry, LogRocket, or Rollbar
- **Analytics:** Google Analytics, Mixpanel, or Plausible
- **Uptime Monitoring:** UptimeRobot, Pingdom, or StatusCake
- **Performance:** Vercel Analytics, New Relic, or DataDog

### 3. Configure DNS & SSL

- Point your domain to Vercel/hosting provider
- Verify SSL certificate is active (HTTPS)
- Update `NEXT_PUBLIC_SITE_URL` if domain changed

### 4. Set Up CI/CD

Vercel provides automatic deployments:

- **Production:** Deploys from `main`/`master` branch
- **Preview:** Deploys from pull requests
- **Development:** Deploys from other branches

### 5. Configure Webhooks (Optional)

Set up deployment webhooks for:

- Slack notifications on deployment success/failure
- Discord notifications
- Custom automation triggers

---

## Troubleshooting

### Build Fails

**Error:** Module not found

```bash
# Solution: Install missing dependencies
npm install
```

**Error:** Environment variable undefined

```bash
# Solution: Check environment variables are set in deployment platform
# Verify they start with NEXT_PUBLIC_ for client-side access
```

### Runtime Errors

**Error:** API requests fail (CORS)

```bash
# Solution: Configure CORS on backend to allow your frontend domain
# Backend should allow: https://your-frontend-domain.com
```

**Error:** Stripe checkout fails

```bash
# Solution 1: Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is correct
# Solution 2: Ensure Stripe is in live mode (not test mode)
# Solution 3: Check success/cancel URLs are correct
```

### Performance Issues

**Slow page loads**

```bash
# Solution 1: Enable Vercel Edge Network (automatic)
# Solution 2: Optimize images with Next.js Image component
# Solution 3: Enable compression in next.config.js (already done)
```

**Large bundle size**

```bash
# Analyze bundle
npm run build

# Solution: Use dynamic imports for large components
import dynamic from 'next/dynamic'
const HeavyComponent = dynamic(() => import('./HeavyComponent'))
```

### Environment Variables Not Working

```bash
# Common issues:
# 1. Variable doesn't start with NEXT_PUBLIC_ (required for client-side)
# 2. Variables not saved in deployment platform
# 3. Rebuild needed after adding variables (redeploy)
```

**Solution:**

1. Verify variables in deployment platform
2. Ensure `NEXT_PUBLIC_` prefix for client-side variables
3. Redeploy after adding/changing variables

### 404 Errors on Refresh

**Issue:** Page works on navigation but 404 on refresh

```bash
# Solution: Configure rewrites in hosting platform
# Vercel handles this automatically for Next.js
# For other platforms, ensure SPA fallback is configured
```

---

## Build Commands Reference

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Production Build
npm run build            # Build optimized production bundle
npm start                # Start production server

# Linting & Type Checking
npm run lint             # Run ESLint
npx tsc --noEmit        # Check TypeScript types

# Testing (if configured)
npm test                 # Run tests
npm run test:e2e        # Run E2E tests
```

---

## Environment-Specific Configuration

### Development

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_DEBUG=true
```

### Staging

```env
NEXT_PUBLIC_API_URL=https://staging-api.yoursite.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SITE_URL=https://staging.yoursite.com
NEXT_PUBLIC_ENABLE_DEBUG=false
```

### Production

```env
NEXT_PUBLIC_API_URL=https://api.yoursite.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_SITE_URL=https://yoursite.com
NEXT_PUBLIC_ENABLE_DEBUG=false
```

---

## Support & Resources

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Stripe Docs:** [stripe.com/docs](https://stripe.com/docs)
- **Project Issues:** Create issue in GitHub repository

---

## Rollback Procedure

If deployment fails or has critical issues:

### Vercel Rollback

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "⋯" menu → "Promote to Production"
4. Deployment rolls back instantly

### CLI Rollback

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

---

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use environment variables** for all secrets
3. **Enable HTTPS** (automatic on Vercel)
4. **Review security headers** in next.config.js
5. **Keep dependencies updated:** `npm audit` and `npm update`
6. **Use Stripe live keys** only in production
7. **Configure rate limiting** on backend API
8. **Enable CORS** only for your frontend domain
9. **Monitor for vulnerabilities** with Dependabot or Snyk
10. **Implement CSP** (Content Security Policy) if needed

---

**Last Updated:** Phase 9, Step 9.3
**Status:** ✅ Ready for Production Deployment
