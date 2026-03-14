import { eq } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import { loginSchema, registerSchema } from "@/constants/schemas";
import { users } from "@/db/schema";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { signJwt } from "@/lib/jwt";

const OAUTH_STATE_COOKIE = "oauth_state";

function parseCookies(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k?.trim() ?? "", v.join("=")];
    })
  );
}

// POST /api/auth/register
async function register(req: Request): Promise<Response> {
  const body = registerSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: body.error.issues[0]?.message }, { status: 400 });
  }
  const { name, email, password } = body.data;

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return Response.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await Bun.password.hash(password);

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role: Role.USER })
    .returning();

  if (!user) {
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }

  const token = await signJwt({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  return Response.json({ token }, { status: 201 });
}

// POST /api/auth/login
async function login(req: Request): Promise<Response> {
  const body = loginSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: body.error.issues[0]?.message }, { status: 400 });
  }
  const { email, password } = body.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !user.passwordHash) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await Bun.password.verify(password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signJwt({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  return Response.json({ token });
}

// POST /api/auth/logout
function logout(_req: Request): Response {
  return Response.json({ success: true });
}

// GET /api/auth/google
function googleRedirect(_req: Request): Response {
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      "Set-Cookie": `${OAUTH_STATE_COOKIE}=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
    },
  });
}

// GET /api/auth/google/callback
async function googleCallback(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookies = parseCookies(req.headers.get("Cookie") ?? "");
  const storedState = cookies[OAUTH_STATE_COOKIE];

  if (!state || !storedState || state !== storedState) {
    return Response.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  if (!code) {
    return Response.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return Response.json({ error: "Failed to exchange authorization code" }, { status: 502 });
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!profileRes.ok) {
    return Response.json({ error: "Failed to fetch Google profile" }, { status: 502 });
  }

  const profile = (await profileRes.json()) as {
    sub: string;
    email: string;
    name: string;
    picture?: string;
  };

  const [existing] = await db.select().from(users).where(eq(users.email, profile.email)).limit(1);

  let user = existing;

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({
        name: profile.name,
        email: profile.email,
        googleId: profile.sub,
        imageUrl: profile.picture ?? null,
        role: Role.USER,
      })
      .returning();
    user = created;
  } else if (!user.googleId) {
    const [updated] = await db
      .update(users)
      .set({
        googleId: profile.sub,
        imageUrl: user.imageUrl ?? profile.picture ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
    user = updated;
  }

  if (!user) {
    return Response.json({ error: "Failed to resolve user" }, { status: 500 });
  }

  const token = await signJwt({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${PageRoutes.AUTH_CALLBACK}#token=${token}`,
      "Set-Cookie": `${OAUTH_STATE_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
    },
  });
}

export const authRoutes = {
  [ApiRoutes.AUTH_REGISTER]: { POST: register },
  [ApiRoutes.AUTH_LOGIN]: { POST: login },
  [ApiRoutes.AUTH_LOGOUT]: { POST: logout },
  [ApiRoutes.AUTH_GOOGLE]: { GET: googleRedirect },
  [ApiRoutes.AUTH_GOOGLE_CALLBACK]: { GET: googleCallback },
};
