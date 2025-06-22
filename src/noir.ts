import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend, ProofData } from "@aztec/bb.js";
import compiled from "../circuits/target/zk_password.json";
import { poseidon } from "./poseidon.js";
import type { ZkProofResult } from "./types.js";

let noir: Noir | undefined;
let backend: UltraHonkBackend | undefined;

export interface GenerateProofInput {
  password: bigint;
  userTagHash: bigint;
  sessionNonce: bigint;
}

async function initNoir() {
  if (!noir) {
    noir = new Noir(compiled as any);
    await noir.init();
  }
}

async function initBackend() {
  if (!backend) {
    backend = new UltraHonkBackend(compiled.bytecode, {
      threads: 8,
    });
  }
}

export async function generateProof(
  inputs: GenerateProofInput,
): Promise<ZkProofResult> {
  await initNoir();
  await initBackend();

  const password_hash = await poseidon([inputs.password, inputs.userTagHash]);
  const nullifier_out = await poseidon([
    inputs.password,
    inputs.sessionNonce,
    inputs.userTagHash,
  ]);

  const { witness } = await noir!.execute({
    password: inputs.password.toString(),
    user_tag_hash: inputs.userTagHash.toString(),
    session_nonce: inputs.sessionNonce.toString(),
    password_hash: password_hash.toString(),
    nullifier_out: nullifier_out.toString(),
  });

  const proof = await backend!.generateProof(witness);
  const isValid = await backend!.verifyProof(proof);
  if (!isValid) {
    throw new Error("Invalid proof");
  }

  return {
    proof,
    publicSignals: {
      password_hash: password_hash.toString(),
      session_nonce: inputs.sessionNonce.toString(),
      nullifier_out: nullifier_out.toString(),
    },
  };
}

export async function verifyProof(proof: ProofData): Promise<boolean> {
  await initBackend();
  return backend!.verifyProof(proof);
}
