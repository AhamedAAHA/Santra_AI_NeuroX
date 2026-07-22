# MongoDB OAuth (GitHub + Google)

SANTRA uses **MongoDB-backed** social sign-in. Callbacks go to your app, not Supabase.

## 1. GitHub OAuth app

1. [GitHub → Developer settings → OAuth Apps](https://github.com/settings/developers) → **New OAuth App**
2. **Application name:** `SANTRA AI`
3. **Homepage URL:** `https://santra-ai-neurox.vercel.app`
4. **Authorization callback URL:**
   ```text
   https://santra-ai-neurox.vercel.app/api/auth/oauth/github/callback
   ```
   For local dev, create a second OAuth app or update the callback when testing locally:
   ```text
   http://localhost:3001/api/auth/oauth/github/callback
   ```
5. Copy **Client ID** and **Client secret** into `.env.local`

## 2. Google OAuth client

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. **OAuth consent screen** → External → add test users while in Testing mode
3. **Create OAuth client ID** → **Web application**
4. **Authorized JavaScript origins:**
   ```text
   https://santra-ai-neurox.vercel.app
   http://localhost:3001
   ```
5. **Authorized redirect URIs:**
   ```text
   https://santra-ai-neurox.vercel.app/api/auth/oauth/google/callback
   http://localhost:3001/api/auth/oauth/google/callback
   ```
6. Copy **Client ID** and **Client secret** into `.env.local`

## 3. Environment variables

Add to `.env.local` (both keys required per provider):

```env
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
SENTRA_APP_URL=https://santra-ai-neurox.vercel.app
NEXT_PUBLIC_APP_URL=https://santra-ai-neurox.vercel.app
```

Restart `npm run dev`. Open `/sign-in` — **Continue with GitHub** / **Continue with Google** appear when MongoDB is ready and both ID + secret are set.

## 4. Vercel production

Add the same OAuth variables in **Vercel → Settings → Environment Variables**, then redeploy.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| OAuth buttons hidden | Set both client ID and secret; confirm MongoDB workspace is ready |
| `redirect_uri_mismatch` | Callback must match exactly: `/api/auth/oauth/{github\|google}/callback` |
| `oauth_not_configured` | Missing secret or wrong env var name on server |
| GitHub has no email | Add a verified primary email on your GitHub account |

Legacy Supabase OAuth docs remain in [OAUTH_SETUP.md](./OAUTH_SETUP.md) if you still use that path.
