import { BarretenbergSync, Fr } from "@aztec/bb.js";

let bb: BarretenbergSync | null = null;

async function getBB(): Promise<BarretenbergSync> {
  if (!bb) {
    bb = await BarretenbergSync.initSingleton();
  }
  return bb;
}

export async function poseidon(inputs: bigint[]): Promise<bigint> {
  const bb = await getBB();
  const frs = inputs.map((x) => new Fr(x));
  const result = bb.poseidon2Hash(frs);
  return BigInt(result.toString());
}

export function stringToField(input: string): bigint {
  const bytes = new TextEncoder().encode(input);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return BigInt("0x" + hex);
}

export async function hashUtf8String(input: string): Promise<bigint> {
  return poseidon([stringToField(input)]);
}
