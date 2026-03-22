# 🛂 Builder Passport

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Monad Testnet](https://img.shields.io/badge/Network-Monad%20Testnet-blue)](https://monad.xyz/)

A portable onchain record of hackathon participation, contribution, and wins — built on **Monad**.

Builder Passport turns hackathon achievements into public, verifiable credentials. It allows builders to create a unified identity across multiple events, recognize their peers, and collect official awards from organizers.

---

## ✨ Key Features

- 🆔 **Builder Profiles** — Create a persistent, onchain builder identity with GitHub and LinkedIn links.
- 🏆 **Hackathon Registry** — Organizers can create events onchain and builders can join them.
- 🤝 **Peer Attestations** — Builders recognize each other's contributions (Technical, Product, Pitch, Helpful, Teamwork).
- 🏅 **Organizer Awards** — Verifiable results issued by event organizers (Winner, Finalist, Honorable Mention, Best Technical Solution).
- 📜 **Passport Page** — A central display for all your onchain achievements.

---

## 🛠 Tech Stack

- **Smart Contract**: Solidity 0.8.28 (Foundry)
  - **EVM Version**: Prague
  - **Network**: Monad Testnet (Chain ID `10143`)
- **Frontend**: Next.js 15 (React 19, Tailwind CSS 4, Wagmi, Viem)
- **Deployment**: Foundry Scripts

---

## 📂 Project Structure

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

## 🚀 Getting Started

### Prerequisites

- [Foundry](https://getfoundry.sh/) (for smart contracts)
- [Node.js](https://nodejs.org/) (for frontend)
- [NPM](https://www.npmjs.com/) or [PNPM](https://pnpm.io/)

### 🛠 Backend (Smart Contracts)

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

### 🌐 Frontend

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

## 🏗 Deployment to Monad Testnet

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

## 📜 Contract Overview

The `BuilderPassport.sol` contract exposes the following core functions:

| Function | Description | Access |
|---|---|---|
| `createProfile` | Create a builder identity | Anyone |
| `updateProfile` | Update profile fields | Profile Owner |
| `createHackathon` | Create a new event | Anyone (becomes Organizer) |
| `joinHackathon` | Join an active hackathon | Registered Builder |
| `attestContribution` | Recognize a peer's contribution | Participant |
| `assignAward` | Assign official results | Organizer |

---

## ⚖️ License

Distributed under the **MIT License**. See `LICENSE` for more information.
