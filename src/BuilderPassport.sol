// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract BuilderPassport {
    // ── Enums ──────────────────────────────────────────────────────────

    enum ContributionCategory {
        Technical,
        Product,
        Pitch,
        Helpful,
        Teamwork
    }

    enum AwardType {
        None,
        Finalist,
        Winner,
        HonorableMention,
        BestTechnicalSolution
    }

    // ── Structs ────────────────────────────────────────────────────────

    struct Profile {
        string handle;
        string displayName;
        string bio;
        string githubUrl;
        string linkedinUrl;
        bool exists;
    }

    struct Hackathon {
        uint256 id;
        string name;
        string city;
        address organizer;
        bool active;
    }

    // ── State ──────────────────────────────────────────────────────────

    mapping(address => Profile) private _profiles;
    mapping(uint256 => Hackathon) private _hackathons;
    mapping(uint256 => mapping(address => bool)) private _hasJoined;
    mapping(uint256 => mapping(address => mapping(uint8 => uint256))) private _attestationCounts;
    mapping(uint256 => mapping(address => AwardType)) private _awards;
    mapping(uint256 => mapping(address => mapping(address => mapping(uint8 => bool)))) private _hasAttested;

    uint256 public nextHackathonId;

    // ── Events ─────────────────────────────────────────────────────────

    event ProfileCreated(address indexed user, string handle);
    event ProfileUpdated(address indexed user);
    event HackathonCreated(uint256 indexed hackathonId, string name, address indexed organizer);
    event JoinedHackathon(uint256 indexed hackathonId, address indexed participant);
    event ContributionAttested(
        uint256 indexed hackathonId, address indexed from, address indexed to, uint8 category
    );
    event AwardAssigned(uint256 indexed hackathonId, address indexed participant, uint8 awardType);

    // ── Profile ────────────────────────────────────────────────────────

    function createProfile(
        string calldata handle,
        string calldata displayName,
        string calldata bio,
        string calldata githubUrl,
        string calldata linkedinUrl
    ) external {
        require(bytes(handle).length > 0, "Handle required");
        require(!_profiles[msg.sender].exists, "Profile already exists");

        _profiles[msg.sender] = Profile({
            handle: handle,
            displayName: displayName,
            bio: bio,
            githubUrl: githubUrl,
            linkedinUrl: linkedinUrl,
            exists: true
        });

        emit ProfileCreated(msg.sender, handle);
    }

    function updateProfile(
        string calldata handle,
        string calldata displayName,
        string calldata bio,
        string calldata githubUrl,
        string calldata linkedinUrl
    ) external {
        require(_profiles[msg.sender].exists, "Profile does not exist");
        require(bytes(handle).length > 0, "Handle required");

        Profile storage p = _profiles[msg.sender];
        p.handle = handle;
        p.displayName = displayName;
        p.bio = bio;
        p.githubUrl = githubUrl;
        p.linkedinUrl = linkedinUrl;

        emit ProfileUpdated(msg.sender);
    }

    // ── Hackathon ──────────────────────────────────────────────────────

    function createHackathon(string calldata name, string calldata city) external returns (uint256) {
        require(bytes(name).length > 0, "Name required");

        uint256 id = nextHackathonId++;
        _hackathons[id] = Hackathon({id: id, name: name, city: city, organizer: msg.sender, active: true});

        emit HackathonCreated(id, name, msg.sender);
        return id;
    }

    // ── Join ───────────────────────────────────────────────────────────

    function joinHackathon(uint256 hackathonId) external {
        require(_profiles[msg.sender].exists, "Create a profile first");
        require(_hackathons[hackathonId].active, "Hackathon does not exist or is inactive");
        require(!_hasJoined[hackathonId][msg.sender], "Already joined");

        _hasJoined[hackathonId][msg.sender] = true;

        emit JoinedHackathon(hackathonId, msg.sender);
    }

    // ── Attestation ────────────────────────────────────────────────────

    function attestContribution(uint256 hackathonId, address participant, uint8 category) external {
        require(category <= uint8(ContributionCategory.Teamwork), "Invalid category");
        require(msg.sender != participant, "Cannot attest yourself");
        require(_hasJoined[hackathonId][msg.sender], "You must join the hackathon first");
        require(_hasJoined[hackathonId][participant], "Participant has not joined");
        require(
            !_hasAttested[hackathonId][msg.sender][participant][category],
            "Already attested this category for this participant"
        );

        _hasAttested[hackathonId][msg.sender][participant][category] = true;
        _attestationCounts[hackathonId][participant][category]++;

        emit ContributionAttested(hackathonId, msg.sender, participant, category);
    }

    // ── Award ──────────────────────────────────────────────────────────

    function assignAward(uint256 hackathonId, address participant, uint8 awardType) external {
        require(awardType > uint8(AwardType.None) && awardType <= uint8(AwardType.BestTechnicalSolution), "Invalid award type");
        require(_hackathons[hackathonId].organizer == msg.sender, "Only organizer can assign awards");
        require(_hasJoined[hackathonId][participant], "Participant has not joined");

        _awards[hackathonId][participant] = AwardType(awardType);

        emit AwardAssigned(hackathonId, participant, awardType);
    }

    // ── Read helpers ───────────────────────────────────────────────────

    function getProfile(address user) external view returns (Profile memory) {
        return _profiles[user];
    }

    function getHackathon(uint256 hackathonId) external view returns (Hackathon memory) {
        return _hackathons[hackathonId];
    }

    function getAttestationCount(uint256 hackathonId, address participant, uint8 category)
        external
        view
        returns (uint256)
    {
        return _attestationCounts[hackathonId][participant][category];
    }

    function getAward(uint256 hackathonId, address participant) external view returns (AwardType) {
        return _awards[hackathonId][participant];
    }

    function hasUserJoined(uint256 hackathonId, address participant) external view returns (bool) {
        return _hasJoined[hackathonId][participant];
    }
}
