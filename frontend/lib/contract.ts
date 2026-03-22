import { type Address } from "viem";
import abi from "./abi.json";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as Address;

export const CONTRACT_ABI = abi;

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
