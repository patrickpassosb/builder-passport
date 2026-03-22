# Builder Passport v2: Composable Portfolio Platform

## Why This Matters

Builder Passport is currently a single-hackathon tool (hardcoded to hackathon ID 0). To differentiate from DevPost, it needs to become a **cross-hackathon composable portfolio**:

- **DevPost**: Organizer controls everything. Company owns your data. They can delete your account.
- **Builder Passport**: Reputation lives onchain on Monad. Peers verify your skills (not just judges). Any dApp/DAO can read your reputation. No company can revoke it.

The existing smart contract already supports multi-hackathon and profile editing — the frontend just doesn't use these features. A new **BuilderClaims** contract adds the ability to import and peer-verify past hackathon achievements from external platforms.

**No changes to the existing BuilderPassport contract. It stays deployed as-is.**

---

## Architecture Overview

```
                    ┌──────────────────────┐
                    │   BuilderPassport    │  (existing, deployed)
                    │   0x0dEE...aEC4      │
                    │                      │
                    │  - Profiles          │
                    │  - Hackathons        │
                    │  - Attestations      │
                    │  - Awards            │
                    └──────────┬───────────┘
                               │
    ┌──────────────────────────┼──────────────────────────┐
    │                          │                          │
    │   ┌──────────────────┐   │   ┌──────────────────┐   │
    │   │  BuilderClaims   │   │   │   Next.js App    │   │
    │   │  (NEW contract)  │   │   │                  │   │
    │   │                  │   │   │  /hackathons     │   │
    │   │  - Claims        │   │   │  /hackathon/[id] │   │
    │   │  - Verifications │   │   │  /passport/[addr]│   │
    │   └──────────────────┘   │   │  /builders       │   │
    │                          │   │  /api/summary    │   │
    │        Monad Testnet     │   └──────────────────┘   │
    └──────────────────────────┘          Vercel          │
                                                          │
```

---

## Step 1: BuilderClaims Smart Contract

### Purpose
Let builders import past hackathon achievements (from DevPost, Kaggle, MLH, ETHGlobal, etc.) and have them peer-verified onchain.

### Contract: `src/BuilderClaims.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract BuilderClaims {
    struct Claim {
        uint256 id;
        address builder;
        string hackathonName;   // "ETHGlobal Istanbul 2023"
        string result;          // "Winner", "Finalist", "Participant"
        string proofUrl;        // DevPost link, tweet, certificate
        uint256 verifications;
        bool exists;
    }

    mapping(uint256 => Claim) private _claims;
    mapping(address => uint256[]) private _builderClaims;  // builder -> claimIds
    mapping(uint256 => mapping(address => bool)) private _hasVerified;

    uint256 public nextClaimId;

    event ClaimCreated(uint256 indexed claimId, address indexed builder, string hackathonName);
    event ClaimVerified(uint256 indexed claimId, address indexed verifier);

    function createClaim(
        string calldata hackathonName,
        string calldata result,
        string calldata proofUrl
    ) external returns (uint256) {
        require(bytes(hackathonName).length > 0, "Hackathon name required");
        require(bytes(result).length > 0, "Result required");

        uint256 id = nextClaimId++;
        _claims[id] = Claim({
            id: id,
            builder: msg.sender,
            hackathonName: hackathonName,
            result: result,
            proofUrl: proofUrl,
            verifications: 0,
            exists: true
        });
        _builderClaims[msg.sender].push(id);

        emit ClaimCreated(id, msg.sender, hackathonName);
        return id;
    }

    function verifyClaim(uint256 claimId) external {
        require(_claims[claimId].exists, "Claim does not exist");
        require(_claims[claimId].builder != msg.sender, "Cannot verify own claim");
        require(!_hasVerified[claimId][msg.sender], "Already verified");

        _hasVerified[claimId][msg.sender] = true;
        _claims[claimId].verifications++;

        emit ClaimVerified(claimId, msg.sender);
    }

    function getClaim(uint256 claimId) external view returns (Claim memory) {
        return _claims[claimId];
    }

    function getBuilderClaimIds(address builder) external view returns (uint256[] memory) {
        return _builderClaims[builder];
    }

    function getClaimCount(address builder) external view returns (uint256) {
        return _builderClaims[builder].length;
    }

    function hasVerified(uint256 claimId, address verifier) external view returns (bool) {
        return _hasVerified[claimId][verifier];
    }
}
```

### Tests: `test/BuilderClaims.t.sol`

Write Foundry tests covering:
- `testCreateClaim` — creates claim, verifies storage and event
- `testCannotCreateClaimWithoutName` — revert on empty hackathon name
- `testVerifyClaim` — another address verifies, count increments
- `testCannotSelfVerify` — revert when builder tries to verify own claim
- `testCannotDoubleVerify` — revert on duplicate verification
- `testGetBuilderClaimIds` — returns correct array of claim IDs
- `testMultipleClaims` — builder creates multiple claims, all tracked

### Deploy Script: `script/DeployClaims.s.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/BuilderClaims.sol";

contract DeployClaimsScript is Script {
    function run() external {
        vm.startBroadcast();
        BuilderClaims claims = new BuilderClaims();
        console.log("BuilderClaims deployed at:", address(claims));
        vm.stopBroadcast();
    }
}
```

### Deploy Script: `deploy-claims.sh`

```bash
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

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "Claims Contract: $CLAIMS_ADDRESS"
echo "Explorer: https://testnet.monadscan.com/address/$CLAIMS_ADDRESS"
echo ""
echo "Next: Update Vercel env var NEXT_PUBLIC_CLAIMS_ADDRESS=$CLAIMS_ADDRESS"
```

### Frontend Integration

After deploying, extract ABI:
```bash
cat out/BuilderClaims.sol/BuilderClaims.json | jq '.abi' > frontend/lib/claims-abi.json
```

Add to `frontend/lib/contract.ts`:
```ts
import claimsAbi from "./claims-abi.json";

export const CLAIMS_ADDRESS = (process.env.NEXT_PUBLIC_CLAIMS_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as Address;

export const CLAIMS_ABI = claimsAbi;
```

---

## Step 2: Event Log Helper Utility

### File: `frontend/lib/contract.ts`

Add at the bottom of the existing file:

```ts
import { parseAbiItem, type PublicClient } from "viem";

export const EVENT_SIGNATURES = {
  ProfileCreated: "event ProfileCreated(address indexed user, string handle)",
  JoinedHackathon: "event JoinedHackathon(uint256 indexed hackathonId, address indexed participant)",
  ContributionAttested: "event ContributionAttested(uint256 indexed hackathonId, address indexed from, address indexed to, uint8 category)",
  AwardAssigned: "event AwardAssigned(uint256 indexed hackathonId, address indexed participant, uint8 awardType)",
  ClaimCreated: "event ClaimCreated(uint256 indexed claimId, address indexed builder, string hackathonName)",
  ClaimVerified: "event ClaimVerified(uint256 indexed claimId, address indexed verifier)",
} as const;

export async function getEventLogs(
  publicClient: PublicClient,
  contractAddress: Address,
  eventSignature: string,
  args?: Record<string, unknown>
) {
  return publicClient.getLogs({
    address: contractAddress,
    event: parseAbiItem(eventSignature) as any,
    args,
    fromBlock: BigInt(0),
    toBlock: "latest",
  });
}
```

This helper is used by steps 4, 5, 6, and 9.

---

## Step 3: Fix Navbar Links

### File: `frontend/components/Navbar.tsx`

Change `navLinks` array (line 40-43):

```ts
const navLinks = [
  { href: "/hackathons", label: "Hackathons", match: "/hackathon" },
  { href: "/builders", label: "Builders", match: "/builders" },
  { href: `/passport/${mounted && address ? address : "0x"}`, label: "My Passport", match: "/passport" },
];
```

Changes:
- `/hackathon/0` → `/hackathons` (listing page)
- Add `/builders` link (leaderboard)
- Rename "Passports" → "My Passport"

---

## Step 4: Dynamic Landing Page Stats + Fix CTAs

### File: `frontend/app/page.tsx`

#### 4a. Add imports and state

Add to imports:
```ts
import { usePublicClient } from "wagmi";
import { CONTRACT_ADDRESS, EVENT_SIGNATURES, getEventLogs } from "@/lib/contract";
```

Add state + effect inside the component:
```ts
const publicClient = usePublicClient();
const [stats, setStats] = useState({ profiles: 0, attestations: 0, awards: 0 });

useEffect(() => {
  if (!publicClient) return;
  async function fetchStats() {
    const [profiles, attestations, awards] = await Promise.all([
      getEventLogs(publicClient!, CONTRACT_ADDRESS, EVENT_SIGNATURES.ProfileCreated),
      getEventLogs(publicClient!, CONTRACT_ADDRESS, EVENT_SIGNATURES.ContributionAttested),
      getEventLogs(publicClient!, CONTRACT_ADDRESS, EVENT_SIGNATURES.AwardAssigned),
    ]);
    setStats({
      profiles: profiles.length,
      attestations: attestations.length,
      awards: awards.length,
    });
  }
  fetchStats();
}, [publicClient]);
```

#### 4b. Replace stats section (lines 120-148)

Replace the hardcoded "Profiles", "Attestations", "Awards" text with:
```tsx
<p className="font-headline text-5xl font-bold text-on-surface mb-2">
  {stats.profiles}
</p>
// ... same for stats.attestations and stats.awards
```

#### 4c. Fix all CTAs

Replace all instances of `/hackathon/0` with `/hackathons`:
- Line 46: `router.push("/hackathon/0")` → `router.push("/hackathons")`
- Line 62: `href="/hackathon/0"` → `href="/hackathons"`
- Line 234: `router.push("/hackathon/0")` → `router.push("/hackathons")`

---

## Step 5: Hackathon Listing Page

### File: Create `frontend/app/hackathons/page.tsx`

This is a **new page** that lists all hackathons and lets anyone create new ones.

#### Data fetching approach
1. Read `nextHackathonId()` from contract → total count N
2. Loop 0 to N-1, call `publicClient.readContract({ functionName: "getHackathon", args: [i] })` for each
3. For each hackathon, count participants via `JoinedHackathon` event logs filtered by `hackathonId`

#### UI structure
```
┌─────────────────────────────────────────────────────┐
│  HACKATHON DIRECTORY                                │
│                                                     │
│  ┌─ Create Hackathon ────────────────────────────┐  │
│  │  Name: [________]  City: [________]  [Create] │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Card ─────────┐  ┌─ Card ─────────┐           │
│  │ Monad Blitz     │  │ ETH São Paulo  │           │
│  │ São Paulo       │  │ São Paulo      │           │
│  │ ● Active        │  │ ● Active       │           │
│  │ 5 Builders      │  │ 12 Builders    │           │
│  │ [View →]        │  │ [View →]       │           │
│  └─────────────────┘  └─────────────────┘           │
└─────────────────────────────────────────────────────┘
```

#### Key implementation notes
- Use `usePublicClient` for reads, `useWriteContract` for `createHackathon`
- Use wagmi `useAccount` to show "Connect Wallet" if not connected
- Card links go to `/hackathon/{id}`
- Follow existing design: `bg-surface-container`, `glass-card`, `monad-pulse` classes
- Show loading skeleton while fetching hackathons
- After creating a hackathon, reload the page

---

## Step 6: Multi-Hackathon Portfolio on Passport Page

### File: `frontend/app/passport/[address]/page.tsx`

This is the biggest change. The passport page currently hardcodes `hackathonId = BigInt(0)`.

#### 6a. Remove hardcoded hackathon ID

Delete:
```ts
const hackathonId = BigInt(0);
```

#### 6b. Fetch all hackathons the user joined

Replace the single-hackathon reads with a `useEffect` that:

1. Queries `JoinedHackathon` events filtered by `participant: userAddress`:
```ts
const logs = await getEventLogs(publicClient, CONTRACT_ADDRESS, EVENT_SIGNATURES.JoinedHackathon, {
  participant: userAddress,
});
const hackathonIds = logs.map(log => log.args.hackathonId as bigint);
```

2. For each hackathon ID, fetches:
   - `getHackathon(id)` → name, city
   - `getAttestationCount(id, userAddress, category)` for all 5 categories
   - `getAward(id, userAddress)` → award type

3. Stores in state as an array:
```ts
interface HackathonRecord {
  id: bigint;
  name: string;
  city: string;
  attestations: number[];  // [Technical, Product, Pitch, Helpful, Teamwork]
  award: number;
}
const [hackathonRecords, setHackathonRecords] = useState<HackathonRecord[]>([]);
```

#### 6c. Aggregate stats in hero section

Compute from `hackathonRecords`:
```ts
const totalAttestations = hackathonRecords.reduce(
  (sum, h) => sum + h.attestations.reduce((a, b) => a + b, 0), 0
);
const totalHackathons = hackathonRecords.length;
const bestAward = Math.max(...hackathonRecords.map(h => h.award), 0);
```

Display these in the existing 3-stat grid instead of hardcoded hackathon 0 values.

#### 6d. New "Hackathon History" section

Below the stats grid, add a timeline/card list:
```
┌─────────────────────────────────────────────┐
│  HACKATHON HISTORY                          │
│                                             │
│  ┌─ Monad Blitz · São Paulo ─────────────┐  │
│  │  Technical: 3  Product: 2  Pitch: 1   │  │
│  │  Award: Winner 🏆                     │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ ETH São Paulo · São Paulo ───────────┐  │
│  │  Technical: 1  Helpful: 2             │  │
│  │  Award: None                          │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

#### 6e. External Claims section (uses BuilderClaims contract)

Fetch claims for this user from the BuilderClaims contract:
```ts
const claimIds = await publicClient.readContract({
  address: CLAIMS_ADDRESS,
  abi: CLAIMS_ABI,
  functionName: "getBuilderClaimIds",
  args: [userAddress],
});

// For each claimId, fetch the claim details
const claims = await Promise.all(
  claimIds.map(id => publicClient.readContract({
    address: CLAIMS_ADDRESS,
    abi: CLAIMS_ABI,
    functionName: "getClaim",
    args: [id],
  }))
);
```

Display as cards with:
- Hackathon name + result
- Proof link (clickable)
- Verification count + "Verify" button (for other users viewing)

#### 6f. "Add Past Achievement" form (own profile only)

When `isOwnProfile === true`, show a form:
```
┌─ ADD PAST ACHIEVEMENT ───────────────────────┐
│  Hackathon Name: [ETHGlobal Istanbul 2023 ]  │
│  Result:         [Winner                  ]  │
│  Proof URL:      [https://devpost.com/... ]  │
│  [Submit Claim]                              │
└──────────────────────────────────────────────┘
```

Calls `writeContract({ functionName: "createClaim", args: [name, result, proofUrl] })` on the BuilderClaims contract.

#### 6g. Update AI summary

Pass multi-hackathon data + claims to the summary API:
```ts
body: JSON.stringify({
  handle: p.handle,
  displayName: p.displayName,
  bio: p.bio,
  hackathons: hackathonRecords.map(h => ({
    name: h.name,
    attestations: h.attestations,
    award: h.award,
  })),
  claims: claims.map(c => ({
    hackathonName: c.hackathonName,
    result: c.result,
    verifications: Number(c.verifications),
  })),
}),
```

### Also update: `frontend/app/api/summary/route.ts`

Update the prompt to accept the new data shape:
```ts
const { handle, displayName, bio, hackathons, claims } = await req.json();

// Build attestation summary across all hackathons
const hackathonLines = (hackathons ?? []).map(h => {
  const cats = CATEGORIES.map((cat, i) => `${cat}: ${h.attestations?.[i] ?? 0}`).join(", ");
  return `- ${h.name}: ${cats}, Award: ${AWARDS[h.award ?? 0]}`;
}).join("\n");

const claimLines = (claims ?? []).map(c =>
  `- ${c.hackathonName}: ${c.result} (${c.verifications} peer verifications)`
).join("\n");

const prompt = `...
Onchain hackathon history:
${hackathonLines || "No hackathons yet"}

External achievements (peer-verified claims):
${claimLines || "No external claims"}
...`;
```

---

## Step 7: Profile Edit from Passport Page

### File: `frontend/app/passport/[address]/page.tsx`

The contract already has `updateProfile()` — it's in the ABI but never called from the frontend.

#### Implementation

1. Add state:
```ts
const [isEditing, setIsEditing] = useState(false);
const [editHandle, setEditHandle] = useState("");
const [editDisplayName, setEditDisplayName] = useState("");
const [editBio, setEditBio] = useState("");
const [editGithub, setEditGithub] = useState("");
const [editLinkedin, setEditLinkedin] = useState("");
```

2. When `isEditing` is toggled on, pre-fill from current profile:
```ts
useEffect(() => {
  if (isEditing && p?.exists) {
    setEditHandle(p.handle);
    setEditDisplayName(p.displayName);
    setEditBio(p.bio);
    setEditGithub(p.githubUrl);
    setEditLinkedin(p.linkedinUrl);
  }
}, [isEditing]);
```

3. Add "Edit" button next to profile header (only when `isOwnProfile`):
```tsx
{isOwnProfile && (
  <button onClick={() => setIsEditing(!isEditing)} className="...">
    {isEditing ? "Cancel" : "Edit Profile"}
  </button>
)}
```

4. When editing, replace the display fields with inputs. Save button calls:
```ts
writeContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: "updateProfile",
  args: [editHandle, editDisplayName, editBio, editGithub, editLinkedin],
});
```

5. On success, reload page.

---

## Step 8: Link Participants to Passports

### File: `frontend/app/hackathon/[id]/page.tsx`

In the participant list (around line 436-449), wrap the participant's display name in a Link:

```tsx
import Link from "next/link";

// In the participant card:
<Link href={`/passport/${participant.address}`} className="flex-1 min-w-0">
  <div className="text-sm font-semibold text-on-surface truncate hover:text-primary transition-colors">
    {participant.displayName}
  </div>
  <div className="text-[0.7rem] text-on-surface-variant uppercase tracking-tighter">
    @{participant.handle}
  </div>
</Link>
```

Also wrap the avatar in the same link.

---

## Step 9: Builder Leaderboard

### File: Create `frontend/app/builders/page.tsx`

#### Data fetching

1. Fetch all `ProfileCreated` events → list of all registered addresses
2. For each address:
   - Fetch profile via `getProfile(address)`
   - Fetch `JoinedHackathon` events for this address → list of hackathon IDs
   - For each hackathon: fetch attestation counts (5 categories) + award
   - Fetch claims count from BuilderClaims contract
3. Compute reputation score per builder

#### Reputation score formula

```ts
const AWARD_WEIGHTS = { 0: 0, 1: 50, 2: 100, 3: 25, 4: 75 };
// None=0, Finalist=50, Winner=100, HonorableMention=25, BestTechnical=75

const score =
  totalAttestationsAcrossAllHackathons * 10 +
  sumOfAwardWeights +
  verifiedClaimsCount * 15;
```

#### UI structure

```
┌─────────────────────────────────────────────────────────┐
│  BUILDER LEADERBOARD                                    │
│                                                         │
│  Search: [__________________]                           │
│                                                         │
│  #  Avatar  Name          Attestations  Award    Score  │
│  ─────────────────────────────────────────────────────  │
│  1  [img]   Patrick P.    15           Winner    250   │
│  2  [img]   Alice B.      12           Finalist  170   │
│  3  [img]   Bob C.         8           —         80    │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

Each row links to `/passport/{address}`. Search filters by handle (client-side filter).

#### Performance note
For a hackathon with <50 participants, fetching all data client-side is fine. For scale, you'd need a subgraph/indexer — but that's out of scope for the demo.

---

## Execution Checklist

Run steps in this order. After each step, verify with `cd frontend && npx next build`.

| # | Task | Files | Est. Time |
|---|------|-------|-----------|
| 1 | BuilderClaims contract + tests + deploy script | `src/BuilderClaims.sol`, `test/BuilderClaims.t.sol`, `script/DeployClaims.s.sol`, `deploy-claims.sh` | 30 min |
| — | **USER ACTION**: Deploy claims contract | Run `chmod +x deploy-claims.sh && export PRIVATE_KEY=... && ./deploy-claims.sh` | 5 min |
| — | **USER ACTION**: Extract ABI | Run `cat out/BuilderClaims.sol/BuilderClaims.json \| jq '.abi' > frontend/lib/claims-abi.json` | 1 min |
| 2 | Event log helper utility | `frontend/lib/contract.ts` | 10 min |
| 3 | Fix navbar links | `frontend/components/Navbar.tsx` | 5 min |
| 4 | Dynamic landing stats + fix CTAs | `frontend/app/page.tsx` | 25 min |
| 5 | Hackathon listing page | NEW `frontend/app/hackathons/page.tsx` | 40 min |
| 6 | Multi-hackathon portfolio + claims on passport | `frontend/app/passport/[address]/page.tsx`, `frontend/app/api/summary/route.ts` | 50 min |
| 7 | Profile edit on passport | `frontend/app/passport/[address]/page.tsx` | 25 min |
| 8 | Link participants to passports | `frontend/app/hackathon/[id]/page.tsx` | 5 min |
| 9 | Builder leaderboard | NEW `frontend/app/builders/page.tsx` | 45 min |
| **Total** | | | **~4 hours** |

---

## Verification: Full Demo Flow

Test this end-to-end after all steps are complete:

1. **Landing page** → shows real onchain stats (not placeholder text)
2. **Click "Hackathons"** → `/hackathons` shows hackathon cards
3. **Create a new hackathon** → form submits, new card appears
4. **Click into hackathon** → join, create profile if needed
5. **Click a participant's name** → navigates to their passport
6. **Passport page** → shows multi-hackathon history timeline
7. **Add past achievement** → "ETHGlobal 2024 Winner" with DevPost link
8. **Another user views passport** → sees claim, clicks "Verify"
9. **Edit own profile** → change bio, save onchain
10. **Navigate to `/builders`** → leaderboard sorted by reputation score
11. **AI summary** → reflects all hackathons + verified claims

---

## Design System Reference

All new pages must use the existing Neon Brutalist design tokens from `frontend/app/globals.css`:

- **Backgrounds**: `bg-surface`, `bg-surface-container`, `bg-surface-container-low`
- **Text**: `text-on-surface`, `text-on-surface-variant`, `text-primary`
- **Cards**: `glass-card`, `bg-surface-container rounded-xl`
- **Buttons**: `bg-gradient-to-r from-primary to-primary-container text-on-primary`
- **Hover**: `monad-pulse` class for subtle pulse effect
- **Labels**: `font-label text-[0.6875rem] uppercase tracking-widest`
- **Headlines**: `font-headline` (Space Grotesk)
- **Body**: `font-body` (Inter)
- **Loading**: `animate-pulse` with `bg-surface-container-high` placeholders

---

## Environment Variables

After deployment, ensure these are set in both `.env.local` and Vercel:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0dEE19015b1AFE07301a229C38Bba789B9aDaEC4
NEXT_PUBLIC_CLAIMS_ADDRESS=<deployed-claims-address>
MISTRAL_API_KEY=<your-mistral-api-key>
```

---

## Key Technical Notes

- **Contract `nextHackathonId()`**: Returns total count of hackathons. Use it to iterate all hackathons.
- **Contract `updateProfile()`**: Already in ABI but never used by frontend. Step 7 exposes it.
- **Event logs `fromBlock: BigInt(0)`**: Safe because the contract is young. For production, track the deployment block.
- **Hooks rule**: The current passport page calls `useReadContract` inside a `.map()` loop. This works because the array length is constant (5 categories), but avoid dynamic-length hook loops.
- **wagmi `usePublicClient`**: Returns a viem PublicClient for direct RPC calls (getLogs, readContract). Use this for batch reads instead of multiple `useReadContract` hooks.
