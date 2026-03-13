import { type JWTPayload, jwtVerify, SignJWT } from "jose";

import { type Role } from "@/constants/enums";
import { env } from "./env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface JwtUser extends JWTPayload {
  sub: string;
  name: string;
  email: string;
  role: Role;
}

export async function signJwt(payload: Omit<JwtUser, keyof JWTPayload>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<JwtUser> {
  const { payload } = await jwtVerify(token, secret);
  return payload as JwtUser;
}
