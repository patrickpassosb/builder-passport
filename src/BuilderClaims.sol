// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract BuilderClaims {
    struct Claim {
        uint256 id;
        address builder;
        string hackathonName;
        string result;
        string proofUrl;
        uint256 verifications;
        bool exists;
    }

    mapping(uint256 => Claim) private _claims;
    mapping(address => uint256[]) private _builderClaims;
    mapping(uint256 => mapping(address => bool)) private _hasVerified;

    uint256 public nextClaimId;

    event ClaimCreated(uint256 indexed claimId, address indexed builder, string hackathonName);
    event ClaimVerified(uint256 indexed claimId, address indexed verifier);

    function createClaim(
        string calldata hackathonName,
        string calldata result,
        string calldata proofUrl
    ) external returns (uint256) {
        require(bytes(hackathonName).length > 0, "Hackathon name required");
        require(bytes(result).length > 0, "Result required");

        uint256 id = nextClaimId++;
        _claims[id] = Claim({
            id: id,
            builder: msg.sender,
            hackathonName: hackathonName,
            result: result,
            proofUrl: proofUrl,
            verifications: 0,
            exists: true
        });
        _builderClaims[msg.sender].push(id);

        emit ClaimCreated(id, msg.sender, hackathonName);
        return id;
    }

    function verifyClaim(uint256 claimId) external {
        require(_claims[claimId].exists, "Claim does not exist");
        require(_claims[claimId].builder != msg.sender, "Cannot verify own claim");
        require(!_hasVerified[claimId][msg.sender], "Already verified");

        _hasVerified[claimId][msg.sender] = true;
        _claims[claimId].verifications++;

        emit ClaimVerified(claimId, msg.sender);
    }

    function getClaim(uint256 claimId) external view returns (Claim memory) {
        return _claims[claimId];
    }

    function getBuilderClaimIds(address builder) external view returns (uint256[] memory) {
        return _builderClaims[builder];
    }

    function getClaimCount(address builder) external view returns (uint256) {
        return _builderClaims[builder].length;
    }

    function hasVerified(uint256 claimId, address verifier) external view returns (bool) {
        return _hasVerified[claimId][verifier];
    }
}
