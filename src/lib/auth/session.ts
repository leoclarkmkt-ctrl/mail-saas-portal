import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const getSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required");
  }
  return new TextEncoder().encode(secret);
};

export async function signSession(payload: Record<string, unknown>, ttlSeconds: number) {
  const secret = getSecret();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secret);
}

export async function verifySession(token: string) {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export function setCookie(name: string, value: string, maxAgeSeconds: number) {
  cookies().set({
    name,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds
  });
}

export function clearCookie(name: string) {
  cookies().set({
    name,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}
