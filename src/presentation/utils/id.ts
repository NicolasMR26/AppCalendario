import { randomUUID } from "expo-crypto";

/** Cryptographically-random v4 UUID (RFC4122), backed by the platform's CSPRNG on every target. */
export function generateId(): string {
  return randomUUID();
}
