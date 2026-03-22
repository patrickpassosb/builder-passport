#!/bin/bash
set -e

# ─── Builder Passport: Deploy to Monad Testnet ───────────────────────
# Usage: ./deploy.sh
# Requires: PRIVATE_KEY env var set with your wallet private key

if [ -z "$PRIVATE_KEY" ]; then
  echo "Error: Set PRIVATE_KEY first"
  echo "  export PRIVATE_KEY=0xYOUR_PRIVATE_KEY"
  exit 1
fi

export PATH="$HOME/.foundry/bin:$PATH"

echo "==> Building contract..."
forge build

echo "==> Running tests..."
forge test

echo "==> Deploying to Monad Testnet..."
OUTPUT=$(forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key "$PRIVATE_KEY" \
  --broadcast 2>&1)

echo "$OUTPUT"

# Extract contract address
CONTRACT_ADDRESS=$(echo "$OUTPUT" | grep "BuilderPassport deployed at:" | awk '{print $NF}')

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "Error: Could not extract contract address from deploy output"
  exit 1
fi

echo ""
echo "==> Contract deployed at: $CONTRACT_ADDRESS"

# Update frontend .env.local
echo "NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" > frontend/.env.local
echo "==> Updated frontend/.env.local"

# Create initial hackathon
echo "==> Creating 'Monad Blitz' hackathon..."
cast send "$CONTRACT_ADDRESS" \
  "createHackathon(string,string)" "Monad Blitz" "Sao Paulo" \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key "$PRIVATE_KEY"

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "Contract:  $CONTRACT_ADDRESS"
echo "Explorer:  https://testnet.monadscan.com/address/$CONTRACT_ADDRESS"
echo "Frontend:  Update Vercel env var NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS"
echo ""
echo "Next steps:"
echo "  1. git add -A && git commit -m 'deploy' && git push"
echo "  2. Connect repo to Vercel, set env var, deploy"
