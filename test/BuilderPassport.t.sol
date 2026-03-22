// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../src/BuilderPassport.sol";

contract BuilderPassportTest is Test {
    BuilderPassport public bp;

    address builder = address(0x1);
    address peer = address(0x2);
    address organizer = address(0x3);

    function setUp() public {
        bp = new BuilderPassport();
    }

    // ── Profile ────────────────────────────────────────────────────

    function test_createProfile() public {
        vm.prank(builder);
        bp.createProfile("patrick", "Patrick Passos", "builder", "https://github.com/p", "");

        BuilderPassport.Profile memory p = bp.getProfile(builder);
        assertEq(p.handle, "patrick");
        assertTrue(p.exists);
    }

    function test_createProfile_revert_emptyHandle() public {
        vm.prank(builder);
        vm.expectRevert("Handle required");
        bp.createProfile("", "Name", "", "", "");
    }

    function test_createProfile_revert_duplicate() public {
        vm.prank(builder);
        bp.createProfile("patrick", "Patrick", "", "", "");
        vm.prank(builder);
        vm.expectRevert("Profile already exists");
        bp.createProfile("patrick2", "Patrick2", "", "", "");
    }

    function test_updateProfile() public {
        vm.prank(builder);
        bp.createProfile("old", "Old Name", "", "", "");
        vm.prank(builder);
        bp.updateProfile("new", "New Name", "new bio", "", "");

        BuilderPassport.Profile memory p = bp.getProfile(builder);
        assertEq(p.handle, "new");
        assertEq(p.displayName, "New Name");
    }

    function test_updateProfile_revert_noProfile() public {
        vm.prank(builder);
        vm.expectRevert("Profile does not exist");
        bp.updateProfile("handle", "Name", "", "", "");
    }

    // ── Hackathon ──────────────────────────────────────────────────

    function test_createHackathon() public {
        vm.prank(organizer);
        uint256 id = bp.createHackathon("Monad Blitz", "Sao Paulo");

        assertEq(id, 0);
        BuilderPassport.Hackathon memory h = bp.getHackathon(0);
        assertEq(h.name, "Monad Blitz");
        assertEq(h.organizer, organizer);
        assertTrue(h.active);
    }

    function test_createHackathon_revert_emptyName() public {
        vm.expectRevert("Name required");
        bp.createHackathon("", "City");
    }

    // ── Join ───────────────────────────────────────────────────────

    function test_joinHackathon() public {
        vm.prank(organizer);
        bp.createHackathon("Monad Blitz", "Sao Paulo");

        vm.prank(builder);
        bp.createProfile("patrick", "Patrick", "", "", "");
        vm.prank(builder);
        bp.joinHackathon(0);

        assertTrue(bp.hasUserJoined(0, builder));
    }

    function test_joinHackathon_revert_noProfile() public {
        vm.prank(organizer);
        bp.createHackathon("Monad Blitz", "Sao Paulo");

        vm.prank(builder);
        vm.expectRevert("Create a profile first");
        bp.joinHackathon(0);
    }

    function test_joinHackathon_revert_alreadyJoined() public {
        vm.prank(organizer);
        bp.createHackathon("Monad Blitz", "Sao Paulo");

        vm.prank(builder);
        bp.createProfile("patrick", "Patrick", "", "", "");
        vm.prank(builder);
        bp.joinHackathon(0);
        vm.prank(builder);
        vm.expectRevert("Already joined");
        bp.joinHackathon(0);
    }

    // ── Attestation ────────────────────────────────────────────────

    function test_attestContribution() public {
        _setupHackathonWithTwoParticipants();

        vm.prank(peer);
        bp.attestContribution(0, builder, 0); // Technical

        assertEq(bp.getAttestationCount(0, builder, 0), 1);
    }

    function test_attestContribution_revert_selfAttest() public {
        _setupHackathonWithTwoParticipants();

        vm.prank(builder);
        vm.expectRevert("Cannot attest yourself");
        bp.attestContribution(0, builder, 0);
    }

    function test_attestContribution_revert_duplicate() public {
        _setupHackathonWithTwoParticipants();

        vm.prank(peer);
        bp.attestContribution(0, builder, 0);
        vm.prank(peer);
        vm.expectRevert("Already attested this category for this participant");
        bp.attestContribution(0, builder, 0);
    }

    function test_attestContribution_revert_notJoined() public {
        vm.prank(organizer);
        bp.createHackathon("Monad Blitz", "Sao Paulo");

        vm.prank(builder);
        bp.createProfile("patrick", "Patrick", "", "", "");
        vm.prank(builder);
        bp.joinHackathon(0);

        vm.prank(peer);
        vm.expectRevert("You must join the hackathon first");
        bp.attestContribution(0, builder, 0);
    }

    function test_attestContribution_revert_invalidCategory() public {
        _setupHackathonWithTwoParticipants();

        vm.prank(peer);
        vm.expectRevert("Invalid category");
        bp.attestContribution(0, builder, 99);
    }

    // ── Award ──────────────────────────────────────────────────────

    function test_assignAward() public {
        _setupHackathonWithTwoParticipants();

        vm.prank(organizer);
        bp.assignAward(0, builder, 2); // Winner

        assertEq(uint8(bp.getAward(0, builder)), 2);
    }

    function test_assignAward_revert_notOrganizer() public {
        _setupHackathonWithTwoParticipants();

        vm.prank(peer);
        vm.expectRevert("Only organizer can assign awards");
        bp.assignAward(0, builder, 2);
    }

    function test_assignAward_revert_invalidType() public {
        _setupHackathonWithTwoParticipants();

        vm.prank(organizer);
        vm.expectRevert("Invalid award type");
        bp.assignAward(0, builder, 0); // None is not a valid assignment
    }

    function test_assignAward_revert_notJoined() public {
        vm.prank(organizer);
        bp.createHackathon("Monad Blitz", "Sao Paulo");

        vm.prank(organizer);
        vm.expectRevert("Participant has not joined");
        bp.assignAward(0, builder, 2);
    }

    // ── Full demo flow ─────────────────────────────────────────────

    function test_fullDemoFlow() public {
        // Organizer creates hackathon
        vm.prank(organizer);
        uint256 hackathonId = bp.createHackathon("Monad Blitz", "Sao Paulo");

        // Builder creates profile and joins
        vm.prank(builder);
        bp.createProfile("patrick", "Patrick Passos", "builder vibes", "https://github.com/p", "");
        vm.prank(builder);
        bp.joinHackathon(hackathonId);

        // Peer creates profile and joins
        vm.prank(peer);
        bp.createProfile("alice", "Alice", "peer", "", "");
        vm.prank(peer);
        bp.joinHackathon(hackathonId);

        // Peer attests builder
        vm.prank(peer);
        bp.attestContribution(hackathonId, builder, 0); // Technical
        vm.prank(peer);
        bp.attestContribution(hackathonId, builder, 3); // Helpful

        // Organizer awards builder
        vm.prank(organizer);
        bp.assignAward(hackathonId, builder, 2); // Winner

        // Verify final state
        assertEq(bp.getAttestationCount(hackathonId, builder, 0), 1);
        assertEq(bp.getAttestationCount(hackathonId, builder, 3), 1);
        assertEq(uint8(bp.getAward(hackathonId, builder)), 2);
        assertTrue(bp.hasUserJoined(hackathonId, builder));
    }

    // ── Helpers ────────────────────────────────────────────────────

    function _setupHackathonWithTwoParticipants() internal {
        vm.prank(organizer);
        bp.createHackathon("Monad Blitz", "Sao Paulo");

        vm.prank(builder);
        bp.createProfile("patrick", "Patrick", "", "", "");
        vm.prank(builder);
        bp.joinHackathon(0);

        vm.prank(peer);
        bp.createProfile("alice", "Alice", "", "", "");
        vm.prank(peer);
        bp.joinHackathon(0);
    }
}
