// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/BuilderPassport.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();
        BuilderPassport bp = new BuilderPassport();
        console.log("BuilderPassport deployed at:", address(bp));
        vm.stopBroadcast();
    }
}
