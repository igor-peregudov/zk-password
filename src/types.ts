import type { ProofData } from "@aztec/bb.js";

export interface ZkProofResult {
  proof: ProofData;
  publicSignals: {
    password_hash: string;
    session_nonce: string;
    nullifier_out: string;
  };
}
