#!/bin/bash
# Szódarab – Vercel env setup script
# Futtatás: bash setup-vercel-env.sh
set -e

cd "$(dirname "$0")"

echo "=== Szódarab Vercel konfiguráció ==="
echo ""

# CLERK
echo "1. CLERK kulcsok"
echo "   → https://dashboard.clerk.com → app → API Keys"
echo ""
read -p "   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_...): " CLERK_PK
read -p "   CLERK_SECRET_KEY (sk_...): " CLERK_SK
echo ""

# GOOGLE SERVICE ACCOUNT
echo "2. Google Service Account JSON"
echo "   → Másold ide a letöltött JSON fájl tartalmát (egysoros)"
echo "   Tipp: cat ~/Downloads/szodarab-*.json | tr -d '\n'"
echo ""
read -p "   GOOGLE_SERVICE_ACCOUNT_JSON: " GSA_JSON
echo ""

# RESEND (optional)
echo "3. Resend email (opcionális – Enter a kihagyáshoz)"
echo "   → https://resend.com → API Keys"
echo ""
read -p "   RESEND_API_KEY (re_... vagy Enter): " RESEND_KEY
read -p "   RESEND_FROM_EMAIL (pl. szodarab@pozsonyi.hu vagy Enter): " RESEND_FROM

echo ""
echo "=== Env változók beállítása Vercel-ben ==="

# Set env vars (all environments)
echo "$CLERK_PK" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production --force
echo "$CLERK_PK" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY preview --force
echo "$CLERK_SK" | vercel env add CLERK_SECRET_KEY production --force
echo "$CLERK_SK" | vercel env add CLERK_SECRET_KEY preview --force
echo "$GSA_JSON" | vercel env add GOOGLE_SERVICE_ACCOUNT_JSON production --force
echo "$GSA_JSON" | vercel env add GOOGLE_SERVICE_ACCOUNT_JSON preview --force
echo "1QVrd_7bkmVmDLsAsqTtIo02lmWOyyKkxacTmjOuWqok" | vercel env add GOOGLE_SHEETS_ID production --force
echo "1QVrd_7bkmVmDLsAsqTtIo02lmWOyyKkxacTmjOuWqok" | vercel env add GOOGLE_SHEETS_ID preview --force

# Clerk redirect URLs
echo "/sign-in" | vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL production --force
echo "/" | vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL production --force

if [ -n "$RESEND_KEY" ]; then
  echo "$RESEND_KEY" | vercel env add RESEND_API_KEY production --force
fi
if [ -n "$RESEND_FROM" ]; then
  echo "$RESEND_FROM" | vercel env add RESEND_FROM_EMAIL production --force
fi

echo ""
echo "✅ Env változók beállítva!"
echo ""
echo "=== Redeploy ==="
vercel --prod --yes

echo ""
echo "🎉 Kész! Az app él: https://szoda.pozsonyi.hu"
echo "   (DNS propagáció: max 24h, de általában 5-10 perc)"
