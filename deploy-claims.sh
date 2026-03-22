#!/bin/bash
set -e

if [ -z "$PRIVATE_KEY" ]; then
  echo "Error: Set PRIVATE_KEY first"
  echo "  export PRIVATE_KEY=0xYOUR_PRIVATE_KEY"
  exit 1
fi

export PATH="$HOME/.foundry/bin:$PATH"

echo "==> Building contracts..."
forge build

echo "==> Running tests..."
forge test

echo "==> Deploying BuilderClaims to Monad Testnet..."
OUTPUT=$(forge script script/DeployClaims.s.sol:DeployClaimsScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key "$PRIVATE_KEY" \
  --broadcast 2>&1)

echo "$OUTPUT"

CLAIMS_ADDRESS=$(echo "$OUTPUT" | grep "BuilderClaims deployed at:" | awk '{print $NF}')

if [ -z "$CLAIMS_ADDRESS" ]; then
  echo "Error: Could not extract contract address"
  exit 1
fi

echo ""
echo "==> BuilderClaims deployed at: $CLAIMS_ADDRESS"

# Append to frontend .env.local (don't overwrite existing vars)
echo "NEXT_PUBLIC_CLAIMS_ADDRESS=$CLAIMS_ADDRESS" >> frontend/.env.local
echo "==> Updated frontend/.env.local"

# Extract ABI for frontend
cat out/BuilderClaims.sol/BuilderClaims.json | jq '.abi' > frontend/lib/claims-abi.json
echo "==> Extracted ABI to frontend/lib/claims-abi.json"

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "Claims Contract: $CLAIMS_ADDRESS"
echo "Explorer: https://testnet.monadscan.com/address/$CLAIMS_ADDRESS"
echo ""
echo "Next: Update Vercel env var NEXT_PUBLIC_CLAIMS_ADDRESS=$CLAIMS_ADDRESS"
