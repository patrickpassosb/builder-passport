// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../src/BuilderClaims.sol";

contract BuilderClaimsTest is Test {
    BuilderClaims public claims;
    address alice = address(0x1);
    address bob = address(0x2);
    address charlie = address(0x3);

    function setUp() public {
        claims = new BuilderClaims();
    }

    function testCreateClaim() public {
        vm.prank(alice);
        uint256 id = claims.createClaim("ETHGlobal Istanbul 2023", "Winner", "https://devpost.com/project123");

        assertEq(id, 0);

        BuilderClaims.Claim memory c = claims.getClaim(0);
        assertEq(c.builder, alice);
        assertEq(c.hackathonName, "ETHGlobal Istanbul 2023");
        assertEq(c.result, "Winner");
        assertEq(c.proofUrl, "https://devpost.com/project123");
        assertEq(c.verifications, 0);
        assertTrue(c.exists);
    }

    function testCannotCreateClaimWithoutName() public {
        vm.prank(alice);
        vm.expectRevert("Hackathon name required");
        claims.createClaim("", "Winner", "https://devpost.com/project123");
    }

    function testCannotCreateClaimWithoutResult() public {
        vm.prank(alice);
        vm.expectRevert("Result required");
        claims.createClaim("ETHGlobal 2023", "", "https://devpost.com/project123");
    }

    function testVerifyClaim() public {
        vm.prank(alice);
        claims.createClaim("ETHGlobal 2023", "Winner", "https://devpost.com/123");

        vm.prank(bob);
        claims.verifyClaim(0);

        BuilderClaims.Claim memory c = claims.getClaim(0);
        assertEq(c.verifications, 1);
        assertTrue(claims.hasVerified(0, bob));
    }

    function testCannotSelfVerify() public {
        vm.prank(alice);
        claims.createClaim("ETHGlobal 2023", "Winner", "https://devpost.com/123");

        vm.prank(alice);
        vm.expectRevert("Cannot verify own claim");
        claims.verifyClaim(0);
    }

    function testCannotDoubleVerify() public {
        vm.prank(alice);
        claims.createClaim("ETHGlobal 2023", "Winner", "https://devpost.com/123");

        vm.prank(bob);
        claims.verifyClaim(0);

        vm.prank(bob);
        vm.expectRevert("Already verified");
        claims.verifyClaim(0);
    }

    function testMultipleVerifiers() public {
        vm.prank(alice);
        claims.createClaim("ETHGlobal 2023", "Winner", "https://devpost.com/123");

        vm.prank(bob);
        claims.verifyClaim(0);

        vm.prank(charlie);
        claims.verifyClaim(0);

        BuilderClaims.Claim memory c = claims.getClaim(0);
        assertEq(c.verifications, 2);
    }

    function testGetBuilderClaimIds() public {
        vm.startPrank(alice);
        claims.createClaim("ETHGlobal 2023", "Winner", "https://devpost.com/1");
        claims.createClaim("Monad Blitz 2024", "Finalist", "https://devpost.com/2");
        claims.createClaim("ETHDenver 2024", "Participant", "https://devpost.com/3");
        vm.stopPrank();

        uint256[] memory ids = claims.getBuilderClaimIds(alice);
        assertEq(ids.length, 3);
        assertEq(ids[0], 0);
        assertEq(ids[1], 1);
        assertEq(ids[2], 2);
    }

    function testGetClaimCount() public {
        vm.startPrank(alice);
        claims.createClaim("ETHGlobal 2023", "Winner", "https://devpost.com/1");
        claims.createClaim("Monad Blitz 2024", "Finalist", "https://devpost.com/2");
        vm.stopPrank();

        assertEq(claims.getClaimCount(alice), 2);
        assertEq(claims.getClaimCount(bob), 0);
    }

    function testCannotVerifyNonexistentClaim() public {
        vm.prank(bob);
        vm.expectRevert("Claim does not exist");
        claims.verifyClaim(999);
    }

    function testNextClaimIdIncrements() public {
        vm.startPrank(alice);
        uint256 id0 = claims.createClaim("Hack 1", "Winner", "url1");
        uint256 id1 = claims.createClaim("Hack 2", "Finalist", "url2");
        vm.stopPrank();

        assertEq(id0, 0);
        assertEq(id1, 1);
        assertEq(claims.nextClaimId(), 2);
    }

    function testClaimCreatedEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit BuilderClaims.ClaimCreated(0, alice, "ETHGlobal 2023");
        claims.createClaim("ETHGlobal 2023", "Winner", "https://devpost.com/123");
    }

    function testClaimVerifiedEvent() public {
        vm.prank(alice);
        claims.createClaim("ETHGlobal 2023", "Winner", "https://devpost.com/123");

        vm.prank(bob);
        vm.expectEmit(true, true, false, true);
        emit BuilderClaims.ClaimVerified(0, bob);
        claims.verifyClaim(0);
    }
}
