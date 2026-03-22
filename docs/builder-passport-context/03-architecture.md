# Architecture

## Overview
A simple web app with one contract and a lightweight frontend.

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- viem / wagmi
- MetaMask wallet connect

### Smart contract
One Solidity contract responsible for:
- profiles
- hackathons
- participant joins
- peer attestations
- organizer awards

### Offchain AI summary
A minimal route or helper function that reads:
- joined hackathons
- attestation counts
- award type
and returns a short summary string.

## Onchain data
- profile basics
- event join status
- attestation counts
- award status
- emitted events

## Offchain data
- visual layout
- AI summary
- optional social links rendering
- local UI state

## Suggested page structure
- `/` landing page
- `/hackathon/[id]` event page
- `/passport/[address]` public passport page

## Demo wallets
Use three wallets:
- Builder wallet
- Peer wallet
- Organizer wallet
