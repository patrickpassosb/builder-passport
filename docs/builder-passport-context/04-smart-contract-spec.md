# Smart Contract Spec

## Contract name
BuilderPassport

## Main idea
A minimal contract for:
- profiles
- one or more hackathons
- participation
- peer recognition
- organizer-issued results

## Enums
### ContributionCategory
- Technical
- Product
- Pitch
- Helpful
- Teamwork

### AwardType
- None
- Finalist
- Winner
- HonorableMention
- BestTechnicalSolution

## Structs
### Profile
- string handle
- string displayName
- string bio
- string githubUrl
- string linkedinUrl
- bool exists

### Hackathon
- uint256 id
- string name
- string city
- address organizer
- bool active

## State
- mapping(address => Profile) profiles
- mapping(uint256 => Hackathon) hackathons
- mapping(uint256 => mapping(address => bool)) hasJoined
- mapping(uint256 => mapping(address => mapping(uint8 => uint256))) attestationCounts
- mapping(uint256 => mapping(address => AwardType)) awards
- mapping(uint256 => mapping(address => mapping(address => mapping(uint8 => bool)))) hasAttested
- uint256 nextHackathonId

## Events
- ProfileCreated(address indexed user, string handle)
- ProfileUpdated(address indexed user)
- HackathonCreated(uint256 indexed hackathonId, string name, address indexed organizer)
- JoinedHackathon(uint256 indexed hackathonId, address indexed participant)
- ContributionAttested(uint256 indexed hackathonId, address indexed from, address indexed to, uint8 category)
- AwardAssigned(uint256 indexed hackathonId, address indexed participant, uint8 awardType)

## Functions
### createProfile
Inputs:
- handle
- displayName
- bio
- githubUrl
- linkedinUrl

Behavior:
- creates the sender profile
- requires handle to be non-empty

### updateProfile
Same fields as createProfile.

### createHackathon
Inputs:
- name
- city

Behavior:
- creates a hackathon owned by msg.sender
- returns hackathon id

### joinHackathon
Inputs:
- hackathonId

Behavior:
- marks sender as a participant
- requires existing profile

### attestContribution
Inputs:
- hackathonId
- participant address
- category

Behavior:
- sender must have joined hackathon
- target must have joined hackathon
- sender cannot attest self
- sender can only attest target once per category per event

### assignAward
Inputs:
- hackathonId
- participant address
- awardType

Behavior:
- only organizer of that hackathon can call
- target must have joined hackathon

## Read helpers
Expose simple read functions if useful for frontend:
- getProfile(address)
- getHackathon(uint256)
- getAttestationCount(uint256,address,uint8)
- getAward(uint256,address)
- hasUserJoined(uint256,address)

## Contract design rules
- Keep it small
- No token logic
- No NFT logic
- No payments
- No upgrade logic
