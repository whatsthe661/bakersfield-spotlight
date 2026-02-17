# CloudKit + Vercel Setup for What's the 661

This guide helps fix the website → CloudKit → iOS app nomination flow.

## Flow

1. **Website** (whatsthe661.com) → form submits to `POST /api/nominate`
2. **Vercel** (`api/nominate.ts`) → writes to CloudKit public database
3. **iOS app** (CloudKitService) → syncs Nominations from `iCloud.com.vetraclients.app`
4. **Push notification** → app badge updates when new records arrive

## Common Issues

### 1. Trailing newline in `CLOUDKIT_CONTAINER_ID`

Vercel can add a trailing `\n` when pasting. The code now trims this. Ensure the value is exactly:

```
iCloud.com.vetraclients.app
```

(No spaces, no newlines. The iOS app reads from this container.)

### 2. Private key parse error (`error:1E08010C:DECODER routines::unsupported`)

The parser supports several formats. **Base64-encoded PEM** (e.g. `LS0tLS1CRUdJTiBFQyBQ...` — the entire PEM file base64-encoded) is now supported automatically.

Other supported formats:
- **JSON**: `{"privateKey":"-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----"}`
- **Raw PEM** with `\n` or real newlines
- **Raw base64** of just the key material (between the headers)

Redeploy after any env var changes.

### 3. Wrong container

The iOS app's `CloudKitService` reads **Nominations** from `iCloud.com.vetraclients.app`.  
Do **not** use `iCloud.com.whatsthe661.prospects` for the nominate API — that's a different container.

### 4. Vercel not deploying from Git

If pushes to GitHub don't trigger new deployments:

```bash
cd "/Users/brandonrose/Whats The 661 website/bakersfield-spotlight"
npx vercel --prod
```

This deploys directly and promotes to production.

## Diagnostic

Visit `https://whatsthe661.com/api/nominate` (GET) to check:

- `cloudkitTest: "SUCCESS - wrote test record"` → CloudKit is working
- `cloudkitTest: "ERROR: Private key failed to parse"` → Fix `CLOUDKIT_PRIVATE_KEY` format (use JSON)
- `CLOUDKIT_CONTAINER_ID: "iCloud.com.vetraclients.app"` → Correct (no trailing `\n`)

## Required Vercel env vars

| Variable | Value |
|----------|-------|
| `CLOUDKIT_CONTAINER_ID` | `iCloud.com.vetraclients.app` |
| `CLOUDKIT_KEY_ID` | From CloudKit Dashboard → Server-to-Server Keys |
| `CLOUDKIT_PRIVATE_KEY` | JSON format (see above) |
| `CLOUDKIT_ENVIRONMENT` | `development` or `production` |
| `SLACK_WEBHOOK_URL` | Required for nominations |
| `OPENAI_API_KEY` | Optional (AI insights) |
