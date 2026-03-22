# Builder Passport

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Monad Testnet](https://img.shields.io/badge/Network-Monad%20Testnet-blue)](https://monad.xyz/)

Builder Passport is a portable on-chain record of hackathon participation, contribution, and achievements, built on **Monad**.

The platform transforms hackathon milestones into verifiable public credentials. It enables builders to establish a unified identity across multiple events, facilitate peer recognition, and receive official awards from organizers.

---

## Key Features

- **Builder Profiles** — Maintain a persistent, on-chain identity linked to GitHub and LinkedIn.
- **Hackathon Registry** — Tools for organizers to create events and for builders to register on-chain.
- **Peer Attestations** — Facilitates peer-to-peer recognition across Technical, Product, Pitch, and Teamwork categories.
- **Organizer Awards** — Verifiable achievement badges issued by event organizers (e.g., Winner, Finalist, Honorable Mention).
- **Passport Dashboard** — A centralized interface to showcase all on-chain achievements.

---

## Tech Stack

- **Smart Contracts**: Solidity 0.8.28 (Foundry)
  - **EVM Version**: Prague
  - **Network**: Monad Testnet (Chain ID `10143`)
- **Frontend**: Next.js 15 (React 19, Tailwind CSS 4, Wagmi, Viem)
- **Deployment**: Foundry Scripts

---

## Project Structure

```bash
.
├── src/                # Solidity smart contracts
├── script/             # Foundry deployment scripts
├── test/               # Solidity unit and integration tests
├── frontend/           # Next.js web application
├── lib/               # Git submodules (Foundry libs)
└── docs/              # Additional documentation
```

---

## Getting Started

### Prerequisites

- [Foundry](https://getfoundry.sh/) (Smart contract development)
- [Node.js](https://nodejs.org/) (Frontend development)
- [NPM](https://www.npmjs.com/) or [PNPM](https://pnpm.io/)

### Backend (Smart Contracts)

1. **Install dependencies:**
   ```bash
   forge install
   ```
2. **Build the contracts:**
   ```bash
   forge build
   ```
3. **Run tests:**
   ```bash
   forge test
   ```

### Frontend

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
4. **Build for production:**
   ```bash
   npm run build
   ```

---

## Deployment to Monad Testnet

Ensure you have a `.env` file or export your `PRIVATE_KEY`.

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Monad Testnet Details
- **RPC URL**: `https://testnet-rpc.monad.xyz`
- **Chain ID**: `10143`
- **Currency**: `MON`
- **Faucet**: Visit the [Monad Discord](https://discord.gg/monad) or official faucet.

---

## Contract Overview

The `BuilderPassport.sol` contract manages the core logic through the following functions:

| Function | Description | Access |
|---|---|---|
| `createProfile` | Initialize a builder identity | Public |
| `updateProfile` | Modify profile information | Profile Owner |
| `createHackathon` | Register a new hackathon event | Public (becomes Organizer) |
| `joinHackathon` | Participate in an active event | Registered Builder |
| `attestContribution` | Endorse a peer's contribution | Event Participant |
| `assignAward` | Issue official achievement results | Organizer |

---

## License

Distributed under the **MIT License**. See `LICENSE` for more information.

