// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/BuilderPassport.sol";
import "../src/BuilderClaims.sol";

/// @notice Seeds demo data for the Builder Passport presentation.
///         Handles existing state gracefully — safe to run multiple times.
///         Requires 4 private keys as env vars: PATRICK_KEY, ORGANIZER_KEY, ANA_KEY, LUCAS_KEY.
///         Run: forge script script/SeedDemo.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast
contract SeedDemo is Script {
    BuilderPassport constant PASSPORT = BuilderPassport(0x0dEE19015b1AFE07301a229C38Bba789B9aDaEC4);
    BuilderClaims constant CLAIMS = BuilderClaims(0xF880E020BD3ae1fBC1eD0ECf1E8afe508DA1ea55);

    function run() external {
        uint256 patrickKey = vm.envUint("PATRICK_KEY");
        uint256 organizerKey = vm.envUint("ORGANIZER_KEY");
        uint256 anaKey = vm.envUint("ANA_KEY");
        uint256 lucasKey = vm.envUint("LUCAS_KEY");

        address patrick = vm.addr(patrickKey);
        address organizer = vm.addr(organizerKey);
        address ana = vm.addr(anaKey);
        address lucas = vm.addr(lucasKey);

        console.log("Patrick:", patrick);
        console.log("Organizer:", organizer);
        console.log("Ana:", ana);
        console.log("Lucas:", lucas);

        // ── 1. Create Profiles (skip if already exist) ──────────────────

        if (!PASSPORT.getProfile(patrick).exists) {
            vm.startBroadcast(patrickKey);
            PASSPORT.createProfile("patrick", "Patrick Passos", "Full-stack builder. Shipping onchain.", "https://github.com/ppassos", "https://linkedin.com/in/patrickpassos");
            vm.stopBroadcast();
            console.log("Created Patrick profile");
        } else {
            console.log("Patrick profile already exists, skipping");
        }

        if (!PASSPORT.getProfile(organizer).exists) {
            vm.startBroadcast(organizerKey);
            PASSPORT.createProfile("monadblitz", "Monad Blitz Official", "Official organizer account for Monad Blitz hackathons.", "", "");
            vm.stopBroadcast();
            console.log("Created Organizer profile");
        } else {
            console.log("Organizer profile already exists, skipping");
        }

        if (!PASSPORT.getProfile(ana).exists) {
            vm.startBroadcast(anaKey);
            PASSPORT.createProfile("ana", "Ana Silva", "Web3 engineer, Sao Paulo.", "https://github.com/anasilva", "");
            vm.stopBroadcast();
            console.log("Created Ana profile");
        } else {
            console.log("Ana profile already exists, skipping");
        }

        if (!PASSPORT.getProfile(lucas).exists) {
            vm.startBroadcast(lucasKey);
            PASSPORT.createProfile("lucas", "Lucas Ferreira", "Smart contract dev building on Monad.", "https://github.com/lucasf", "");
            vm.stopBroadcast();
            console.log("Created Lucas profile");
        } else {
            console.log("Lucas profile already exists, skipping");
        }

        // ── 2. Create 3 Hackathons (Organizer) ─────────────────────────
        // Read current nextHackathonId to determine what IDs we'll use

        uint256 baseId = PASSPORT.nextHackathonId();
        console.log("Current nextHackathonId:", baseId);

        vm.startBroadcast(organizerKey);
        PASSPORT.createHackathon("ETHGlobal Istanbul 2024", "Istanbul");
        PASSPORT.createHackathon("Monad Blitz Berlin 2025", "Berlin");
        PASSPORT.createHackathon("Monad Blitz Sao Paulo 2026", "Sao Paulo");
        vm.stopBroadcast();

        uint256 h0 = baseId;     // Istanbul
        uint256 h1 = baseId + 1; // Berlin
        uint256 h2 = baseId + 2; // Sao Paulo

        console.log("Created hackathons:", h0, h1, h2);

        // ── 3. Join Hackathons ──────────────────────────────────────────

        vm.startBroadcast(patrickKey);
        PASSPORT.joinHackathon(h0);
        PASSPORT.joinHackathon(h1);
        PASSPORT.joinHackathon(h2);
        vm.stopBroadcast();

        vm.startBroadcast(anaKey);
        PASSPORT.joinHackathon(h0);
        PASSPORT.joinHackathon(h1);
        PASSPORT.joinHackathon(h2);
        vm.stopBroadcast();

        vm.startBroadcast(lucasKey);
        PASSPORT.joinHackathon(h1);
        PASSPORT.joinHackathon(h2);
        vm.stopBroadcast();

        console.log("Hackathons joined");

        // ── 4. Attestations ─────────────────────────────────────────────
        // Categories: 0=Technical, 1=Product, 2=Pitch, 3=Helpful, 4=Teamwork

        // Hackathon 0 (Istanbul): Ana attests Patrick
        vm.startBroadcast(anaKey);
        PASSPORT.attestContribution(h0, patrick, 0); // Technical
        PASSPORT.attestContribution(h0, patrick, 3); // Helpful
        PASSPORT.attestContribution(h0, patrick, 4); // Teamwork
        vm.stopBroadcast();

        // Hackathon 1 (Berlin): Ana attests Patrick
        vm.startBroadcast(anaKey);
        PASSPORT.attestContribution(h1, patrick, 0); // Technical
        PASSPORT.attestContribution(h1, patrick, 1); // Product
        PASSPORT.attestContribution(h1, patrick, 2); // Pitch
        vm.stopBroadcast();

        // Hackathon 1 (Berlin): Lucas attests Patrick
        vm.startBroadcast(lucasKey);
        PASSPORT.attestContribution(h1, patrick, 0); // Technical
        PASSPORT.attestContribution(h1, patrick, 4); // Teamwork
        PASSPORT.attestContribution(h1, patrick, 3); // Helpful
        vm.stopBroadcast();

        // Hackathon 2 (Sao Paulo): Ana attests Patrick
        vm.startBroadcast(anaKey);
        PASSPORT.attestContribution(h2, patrick, 0); // Technical
        PASSPORT.attestContribution(h2, patrick, 1); // Product
        vm.stopBroadcast();

        // Hackathon 2 (Sao Paulo): Lucas attests Patrick
        vm.startBroadcast(lucasKey);
        PASSPORT.attestContribution(h2, patrick, 0); // Technical
        PASSPORT.attestContribution(h2, patrick, 2); // Pitch
        PASSPORT.attestContribution(h2, patrick, 4); // Teamwork
        vm.stopBroadcast();

        console.log("14 attestations issued");

        // ── 5. Awards (Organizer -> Patrick) ────────────────────────────
        // AwardType: 1=Finalist, 2=Winner, 3=HonorableMention, 4=BestTechnicalSolution

        vm.startBroadcast(organizerKey);
        PASSPORT.assignAward(h0, patrick, 1); // Istanbul: Finalist
        PASSPORT.assignAward(h1, patrick, 2); // Berlin: Winner
        PASSPORT.assignAward(h2, patrick, 4); // Sao Paulo: Best Technical Solution
        vm.stopBroadcast();

        console.log("3 awards assigned");

        // ── 6. External Claims (Patrick creates, Ana + Lucas verify) ────

        uint256 claimBase = CLAIMS.nextClaimId();
        console.log("Current nextClaimId:", claimBase);

        vm.startBroadcast(patrickKey);
        CLAIMS.createClaim("Ethereum Sao Paulo 2023", "2nd Place", "https://devpost.com/software/example-eth-sp");
        CLAIMS.createClaim("Solana Hacker House 2024", "Best DeFi App", "https://devpost.com/software/example-solana");
        vm.stopBroadcast();

        uint256 c0 = claimBase;
        uint256 c1 = claimBase + 1;

        // Ana verifies both claims
        vm.startBroadcast(anaKey);
        CLAIMS.verifyClaim(c0);
        CLAIMS.verifyClaim(c1);
        vm.stopBroadcast();

        // Lucas verifies both claims
        vm.startBroadcast(lucasKey);
        CLAIMS.verifyClaim(c0);
        CLAIMS.verifyClaim(c1);
        vm.stopBroadcast();

        console.log("2 claims created, each with 2 verifications");
        console.log("");
        console.log("=== DEMO SEEDING COMPLETE ===");
        console.log("Patrick address:", patrick);
        console.log("Hackathon IDs:", h0, h1, h2);
        console.log("Claim IDs:", c0, c1);
        console.log("View passport at: https://builder-passport-xi.vercel.app/passport/");
    }
}
