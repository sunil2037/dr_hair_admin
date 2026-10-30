#!/usr/bin/env bash

# ==============================================================================
# Dr. Hair Admin Panel - Local CI/CD Build & Production Deployment Pipeline
# ==============================================================================
# Usage:
#   npm run deploy
#   or:
#   ./deploy.sh "optional commit message"
# ==============================================================================

set -e

# Terminal colors
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BOLD}${CYAN}=====================================================${NC}"
echo -e "${BOLD}${CYAN} 🚀 DR. HAIR ADMIN PANEL - LOCAL CI/CD PIPELINE      ${NC}"
echo -e "${BOLD}${CYAN}=====================================================${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 1: Dependencies & Node Path Check
# ------------------------------------------------------------------------------
echo -e "${BOLD}[1/4] 🔍 Verifying Environment & Toolchains...${NC}"

if [ -d "/Users/sunil/Documents/all_sdk/nodejs/bin" ]; then
  export PATH="/Users/sunil/Documents/all_sdk/nodejs/bin:$PATH"
fi

echo -e "  • Node version: $(node -v)"
echo -e "  • NPM version:  $(npm -v)"
echo -e "  • Vercel CLI:   $(npx --yes vercel --version)"
echo -e "${GREEN}  ✓ Environment verified!${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 2: TypeScript & Next.js Production Build
# ------------------------------------------------------------------------------
echo -e "${BOLD}[2/4] 🏗️  Building Next.js Production Package...${NC}"

npm run build

echo -e "${GREEN}  ✓ Production build compiled cleanly with 0 errors!${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 3: Deploy Directly to Vercel Production
# ------------------------------------------------------------------------------
echo -e "${BOLD}[3/4] ☁️  Deploying Live to Vercel Production...${NC}"

npx --yes vercel --prod --yes

echo -e "${GREEN}  ✓ Successfully published to Vercel Production!${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 4: Git Sync (Commit & Push to GitHub)
# ------------------------------------------------------------------------------
echo -e "${BOLD}[4/4] 📦 Synchronizing GitHub Repository (sunil2037/dr_hair_admin)...${NC}"

if [ -d ".git" ]; then
  git add -A
  if git diff-index --quiet HEAD --; then
    echo -e "  • Git working tree is already clean. Nothing to commit."
  else
    COMMIT_MSG="${1:-deploy: update admin panel and deploy to production}"
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}  ✓ Changes committed: '$COMMIT_MSG'${NC}"
  fi

  git push origin main
  echo -e "${GREEN}  ✓ GitHub repository synced with latest code!${NC}"
else
  echo -e "${YELLOW}  • No .git folder detected in current folder, skipping git push.${NC}"
fi

echo ""
echo -e "${BOLD}${GREEN}=====================================================${NC}"
echo -e "${BOLD}${GREEN} 🎉 CI/CD PIPELINE COMPLETE! YOUR ADMIN IS LIVE!     ${NC}"
echo -e "${BOLD}${GREEN}=====================================================${NC}"
echo -e "  🌐 Production URL: ${BOLD}${CYAN}https://adminpanal-ruby.vercel.app${NC}"
echo -e "  🌐 Direct Domain:   ${BOLD}${CYAN}https://adminpanal-test11-b8fc.vercel.app${NC}"
echo -e "  📦 GitHub Repo:     ${BOLD}https://github.com/sunil2037/dr_hair_admin${NC}"
echo ""

