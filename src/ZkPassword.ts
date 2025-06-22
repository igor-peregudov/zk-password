// @ts-ignore TODO: Temporarily, until a better solution for delivering the WASM file is found.
import argon2 from "argon2-browser/dist/argon2-bundled.min.js";
import { poseidon, stringToField } from "./poseidon.js";
import { generateProof } from "./noir.js";
import { ZkProofResult } from "./types.js";

function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function truncateToField(hex: string): bigint {
  const truncated = hex.slice(-62);
  return BigInt("0x" + truncated);
}

async function argonHash(password: string, salt: string): Promise<bigint> {
  const { hashHex } = await argon2.hash({
    pass: password,
    salt,
    type: 2,
    hashLen: 32,
    time: 3,
    mem: 64 * 1024,
    parallelism: 1,
  });

  return truncateToField(hashHex);
}

export class ZkPassword {
  static async init() {
    return new ZkPassword();
  }

  async register(
    password: string,
    userTag: string,
  ): Promise<{
    passwordHash: string;
    salt: string;
  }> {
    const salt = generateSalt();
    const preimage = await argonHash(password, salt);
    const tagHash = await poseidon([stringToField(userTag)]);
    const passwordHash = await poseidon([preimage, tagHash]);
    return {
      passwordHash: passwordHash.toString(),
      salt,
    };
  }

  async login(
    password: string,
    userTag: string,
    salt: string,
    nonce: string | bigint,
  ): Promise<ZkProofResult> {
    const preimage = await argonHash(password, salt);
    const tagHash = await poseidon([stringToField(userTag)]);
    const sessionNonce = typeof nonce === "string" ? BigInt(nonce) : nonce;

    return generateProof({
      password: preimage,
      userTagHash: tagHash,
      sessionNonce,
    });
  }
}
