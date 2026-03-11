import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../db/schema";
import { signJwt } from "../lib/jwt";
import { env } from "../lib/env";

// POST /api/auth/login
async function login(req: Request): Promise<Response> {
  const { email, password } = await req.json();

  if (!email || !password) {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || user.provider !== "CREDENTIALS" || !user.passwordHash) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await Bun.password.verify(password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signJwt({ sub: user.id, email: user.email, role: user.role });
  return Response.json({ token });
}

// POST /api/auth/logout
function logout(_req: Request): Response {
  // JWT is stateless — instruct the client to discard the token
  return Response.json({ success: true });
}

// GET /api/auth/google
function googleRedirect(_req: Request): Response {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

// GET /api/auth/google/callback
async function googleCallback(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return Response.json({ error: "Missing authorization code" }, { status: 400 });
  }

  // Exchange code for tokens
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

  // Fetch user profile from Google
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
  };

  // Upsert user
  const [existing] = await db.select().from(users).where(eq(users.email, profile.email)).limit(1);

  let user = existing;

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({
        name: profile.name,
        email: profile.email,
        googleId: profile.sub,
        provider: "GOOGLE",
        role: "USER",
      })
      .returning();
    user = created;
  } else if (!user.googleId) {
    // Link Google to an existing account
    const [updated] = await db
      .update(users)
      .set({ googleId: profile.sub, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();
    user = updated;
  }

  if (!user) {
    return Response.json({ error: "Failed to resolve user" }, { status: 500 });
  }

  const token = await signJwt({ sub: user.id, email: user.email, role: user.role });
  return Response.json({ token });
}

export const authRoutes = {
  "/api/auth/login": { POST: login },
  "/api/auth/logout": { POST: logout },
  "/api/auth/google": { GET: googleRedirect },
  "/api/auth/google/callback": { GET: googleCallback },
};
