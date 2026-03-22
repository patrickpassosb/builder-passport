// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/BuilderPassport.sol";
import "../src/BuilderClaims.sol";

/// @notice Seeds demo data for the Builder Passport presentation.
///         Requires 4 private keys as env vars: PATRICK_KEY, ORGANIZER_KEY, ANA_KEY, LUCAS_KEY.
///         Run: forge script script/SeedDemo.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast
contract SeedDemo is Script {
    BuilderPassport constant passport = BuilderPassport(0x0dEE19015b1AFE07301a229C38Bba789B9aDaEC4);
    BuilderClaims constant claims = BuilderClaims(0xF880E020BD3ae1fBC1eD0ECf1E8afe508DA1ea55);

    function run() external {
        uint256 patrickKey = vm.envUint("PATRICK_KEY");
        uint256 organizerKey = vm.envUint("ORGANIZER_KEY");
        uint256 anaKey = vm.envUint("ANA_KEY");
        uint256 lucasKey = vm.envUint("LUCAS_KEY");

        address patrick = vm.addr(patrickKey);
        address ana = vm.addr(anaKey);
        address lucas = vm.addr(lucasKey);

        // ── 1. Create Profiles ───────────────────────────────────────────

        vm.startBroadcast(patrickKey);
        passport.createProfile("patrick", "Patrick Passos", "Full-stack builder. Shipping onchain.", "https://github.com/ppassos", "https://linkedin.com/in/patrickpassos");
        vm.stopBroadcast();

        vm.startBroadcast(organizerKey);
        passport.createProfile("monadblitz", "Monad Blitz Official", "Official organizer account for Monad Blitz hackathons.", "", "");
        vm.stopBroadcast();

        vm.startBroadcast(anaKey);
        passport.createProfile("ana", "Ana Silva", "Web3 engineer, Sao Paulo.", "https://github.com/anasilva", "");
        vm.stopBroadcast();

        vm.startBroadcast(lucasKey);
        passport.createProfile("lucas", "Lucas Ferreira", "Smart contract dev building on Monad.", "https://github.com/lucasf", "");
        vm.stopBroadcast();

        console.log("Profiles created");

        // ── 2. Create 3 Hackathons (Organizer) ──────────────────────────

        vm.startBroadcast(organizerKey);
        passport.createHackathon("ETHGlobal Istanbul 2024", "Istanbul");    // ID 0
        passport.createHackathon("Monad Blitz Berlin 2025", "Berlin");      // ID 1
        passport.createHackathon("Monad Blitz Sao Paulo 2026", "Sao Paulo"); // ID 2
        vm.stopBroadcast();

        console.log("3 hackathons created");

        // ── 3. Join Hackathons ───────────────────────────────────────────

        // Patrick joins all 3
        vm.startBroadcast(patrickKey);
        passport.joinHackathon(0);
        passport.joinHackathon(1);
        passport.joinHackathon(2);
        vm.stopBroadcast();

        // Ana joins all 3
        vm.startBroadcast(anaKey);
        passport.joinHackathon(0);
        passport.joinHackathon(1);
        passport.joinHackathon(2);
        vm.stopBroadcast();

        // Lucas joins 1 and 2
        vm.startBroadcast(lucasKey);
        passport.joinHackathon(1);
        passport.joinHackathon(2);
        vm.stopBroadcast();

        console.log("Hackathons joined");

        // ── 4. Attestations ──────────────────────────────────────────────
        // Categories: 0=Technical, 1=Product, 2=Pitch, 3=Helpful, 4=Teamwork

        // Hackathon 0 (Istanbul): Ana attests Patrick
        vm.startBroadcast(anaKey);
        passport.attestContribution(0, patrick, 0); // Technical
        passport.attestContribution(0, patrick, 3); // Helpful
        passport.attestContribution(0, patrick, 4); // Teamwork
        vm.stopBroadcast();

        // Hackathon 1 (Berlin): Ana attests Patrick
        vm.startBroadcast(anaKey);
        passport.attestContribution(1, patrick, 0); // Technical
        passport.attestContribution(1, patrick, 1); // Product
        passport.attestContribution(1, patrick, 2); // Pitch
        vm.stopBroadcast();

        // Hackathon 1 (Berlin): Lucas attests Patrick
        vm.startBroadcast(lucasKey);
        passport.attestContribution(1, patrick, 0); // Technical
        passport.attestContribution(1, patrick, 4); // Teamwork
        passport.attestContribution(1, patrick, 3); // Helpful
        vm.stopBroadcast();

        // Hackathon 2 (Sao Paulo): Ana attests Patrick
        vm.startBroadcast(anaKey);
        passport.attestContribution(2, patrick, 0); // Technical
        passport.attestContribution(2, patrick, 1); // Product
        vm.stopBroadcast();

        // Hackathon 2 (Sao Paulo): Lucas attests Patrick
        vm.startBroadcast(lucasKey);
        passport.attestContribution(2, patrick, 0); // Technical
        passport.attestContribution(2, patrick, 2); // Pitch
        passport.attestContribution(2, patrick, 4); // Teamwork
        vm.stopBroadcast();

        console.log("14 attestations issued");

        // ── 5. Awards (Organizer → Patrick) ──────────────────────────────
        // AwardType: 1=Finalist, 2=Winner, 3=HonorableMention, 4=BestTechnicalSolution

        vm.startBroadcast(organizerKey);
        passport.assignAward(0, patrick, 1); // Istanbul: Finalist
        passport.assignAward(1, patrick, 2); // Berlin: Winner
        passport.assignAward(2, patrick, 4); // Sao Paulo: Best Technical Solution
        vm.stopBroadcast();

        console.log("3 awards assigned");

        // ── 6. External Claims (Patrick creates, Ana + Lucas verify) ─────

        vm.startBroadcast(patrickKey);
        claims.createClaim("Ethereum Sao Paulo 2023", "2nd Place", "https://devpost.com/software/example-eth-sp");
        claims.createClaim("Solana Hacker House 2024", "Best DeFi App", "https://devpost.com/software/example-solana");
        vm.stopBroadcast();

        // Ana verifies both claims
        vm.startBroadcast(anaKey);
        claims.verifyClaim(0);
        claims.verifyClaim(1);
        vm.stopBroadcast();

        // Lucas verifies both claims
        vm.startBroadcast(lucasKey);
        claims.verifyClaim(0);
        claims.verifyClaim(1);
        vm.stopBroadcast();

        console.log("2 claims created, each with 2 verifications");
        console.log("Demo seeding complete!");
        console.log("Patrick address:", patrick);
        console.log("Navigate to /passport/", patrick);
    }
}
