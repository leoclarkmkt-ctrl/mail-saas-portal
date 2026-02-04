import { randomInt } from "crypto";

const DEFAULT_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789";

export function randomString(length: number, alphabet: string = DEFAULT_ALPHABET): string {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("randomString length must be a positive integer");
  }
  if (!alphabet || alphabet.length < 2) {
    throw new Error("randomString alphabet must contain at least 2 characters");
  }

  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += alphabet[randomInt(0, alphabet.length)];
  }
  return result;
}
