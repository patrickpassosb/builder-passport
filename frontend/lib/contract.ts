import { type Address, parseAbiItem, type PublicClient } from "viem";
import abi from "./abi.json";
import claimsAbi from "./claims-abi.json";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as Address;

export const CONTRACT_ABI = abi;

export const CLAIMS_ADDRESS = (process.env.NEXT_PUBLIC_CLAIMS_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as Address;

export const CLAIMS_ABI = claimsAbi;

export const CONTRIBUTION_CATEGORIES = [
  "Technical",
  "Product",
  "Pitch",
  "Helpful",
  "Teamwork",
] as const;

export const AWARD_TYPES = [
  "None",
  "Finalist",
  "Winner",
  "Honorable Mention",
  "Best Technical Solution",
] as const;

export const AWARD_WEIGHTS: Record<number, number> = {
  0: 0,
  1: 50,
  2: 100,
  3: 25,
  4: 75,
};

export const EVENT_SIGNATURES = {
  ProfileCreated: "event ProfileCreated(address indexed user, string handle)",
  JoinedHackathon:
    "event JoinedHackathon(uint256 indexed hackathonId, address indexed participant)",
  ContributionAttested:
    "event ContributionAttested(uint256 indexed hackathonId, address indexed from, address indexed to, uint8 category)",
  AwardAssigned:
    "event AwardAssigned(uint256 indexed hackathonId, address indexed participant, uint8 awardType)",
  ClaimCreated:
    "event ClaimCreated(uint256 indexed claimId, address indexed builder, string hackathonName)",
  ClaimVerified:
    "event ClaimVerified(uint256 indexed claimId, address indexed verifier)",
} as const;

// Monad Testnet RPC limits eth_getLogs to 100 blocks per query.
// We paginate from the contract deployment block in parallel batches.
const DEPLOYMENT_BLOCK = BigInt(20495519);
const LOG_CHUNK_SIZE = BigInt(100);
const PARALLEL_BATCH = 10;

export async function getEventLogs(
  publicClient: PublicClient,
  contractAddress: Address,
  eventSignature: string,
  args?: Record<string, unknown>
) {
  const latestBlock = await publicClient.getBlockNumber();
  const event = parseAbiItem(eventSignature) as any;

  // Build all chunk ranges
  const chunks: { from: bigint; to: bigint }[] = [];
  for (let from = DEPLOYMENT_BLOCK; from <= latestBlock; from += LOG_CHUNK_SIZE) {
    const to = from + LOG_CHUNK_SIZE - BigInt(1) > latestBlock
      ? latestBlock
      : from + LOG_CHUNK_SIZE - BigInt(1);
    chunks.push({ from, to });
  }

  // Fetch in parallel batches of PARALLEL_BATCH
  const allLogs: any[] = [];
  for (let i = 0; i < chunks.length; i += PARALLEL_BATCH) {
    const batch = chunks.slice(i, i + PARALLEL_BATCH);
    const results = await Promise.allSettled(
      batch.map((c) =>
        publicClient.getLogs({
          address: contractAddress,
          event,
          args,
          fromBlock: c.from,
          toBlock: c.to,
        })
      )
    );
    for (const r of results) {
      if (r.status === "fulfilled") allLogs.push(...r.value);
    }
  }

  return allLogs;
}
