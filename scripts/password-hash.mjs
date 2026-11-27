// Salinan hashPassword dari src/lib/password.ts untuk skrip Node biasa
// (tests/password.test.ts memastikan keduanya saling cocok).
import { randomBytes, scryptSync } from "node:crypto";

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
