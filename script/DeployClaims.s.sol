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
