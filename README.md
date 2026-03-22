# Builder Passport

A portable onchain record of hackathon participation, contribution, and wins — built on Monad.

## What it does

Builder Passport turns hackathon achievements into a public, verifiable credential:

- **Profiles** — create a builder identity
- **Hackathons** — join events onchain
- **Peer attestations** — recognize contributions (Technical, Product, Pitch, Helpful, Teamwork)
- **Organizer awards** — official results (Winner, Finalist, Honorable Mention, Best Technical Solution)
- **Passport page** — display everything in one place

## Tech stack

- **Smart contract**: Solidity (Foundry, EVM version Prague)
- **Network**: Monad Testnet (chain ID 10143)
- **Frontend**: Google Stitch

## Build & test

```shell
forge build
forge test
```

## Deploy to Monad Testnet

```shell
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Contract overview

| Function | Description |
|---|---|
| `createProfile` | Create a builder identity |
| `updateProfile` | Update profile fields |
| `createHackathon` | Create an event (caller = organizer) |
| `joinHackathon` | Join an active hackathon |
| `attestContribution` | Peer recognition (no self-attest) |
| `assignAward` | Organizer-only official award |

## License

MIT
