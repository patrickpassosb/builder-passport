# Prompt Pack

## Prompt 1 — Solidity contract
You are building a Monad hackathon MVP called Builder Passport.

Build a minimal Solidity smart contract for:
- profiles
- one or more hackathons
- participant joins
- peer attestations
- organizer awards

Requirements:
- use enums for contribution categories and award types
- prevent self-attestation
- only organizer can assign official awards
- emit events for profile creation, join, attestation, and award
- keep the contract small and hackathon-friendly
- no token, no NFT, no payments

Return:
1. contract code
2. short explanation
3. list of functions and events

## Prompt 2 — Frontend
Build a clean Next.js + TypeScript + Tailwind frontend for a Monad dapp called Builder Passport.

Pages:
1. Landing page
2. Hackathon page
3. Passport page

Design:
- modern
- minimal
- web3 aesthetic
- purple accents inspired by Monad
- demo-ready

Flows:
- connect MetaMask
- create profile
- join hackathon
- attest another participant
- organizer marks award
- render final public passport

For now, use mock data and mock states.
Do not integrate blockchain yet.

## Prompt 2 — Frontend
Build a clean Next.js + TypeScript + Tailwind frontend for a Monad dapp called Builder Passport.

Pages:
1. Landing page
2. Hackathon page
3. Passport page

Design:
- modern
- minimal
- web3 aesthetic
- purple accents inspired by Monad
- demo-ready

Flows:
- connect MetaMask
- create profile
- join hackathon
- attest another participant
- organizer marks award
- render final public passport

For now, use mock data and mock states.
Do not integrate blockchain yet.

## Prompt 3 — Integration
Integrate the Builder Passport frontend with the Solidity contract on Monad Testnet using MetaMask and viem/wagmi.

Requirements:
- use Monad Testnet chain configuration
- wallet connect with MetaMask
- read and write contract functions
- handle loading and transaction states clearly
- keep the integration simple and reliable for a hackathon demo

Return the exact files to create or edit.

## Prompt 4 — AI summary
Create a minimal AI summary helper for Builder Passport.

Input:
- profile metadata
- list of joined hackathons
- attestation counts by category
- award type

Output:
- a short 1–2 sentence reputation summary

Rules:
- do not invent unsupported facts
- reflect the categories and awards actually present
- keep it concise and presentation-friendly
