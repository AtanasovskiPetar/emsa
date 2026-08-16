import { and, eq, gt, isNull } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  setupPasswordSchema,
} from "@/constants/schemas";
import {
  accountSetupTokens,
  memberFieldDefinitions,
  passwordResetTokens,
  users,
} from "@/db/schema";
import { db } from "@/lib/db";
import { sendAccountSetupEmail, sendPasswordResetEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { createUserToken } from "@/lib/jwt";
import {
  buildCustomFieldsSchema,
  cleanCustomFieldValues,
  computeProfileCompleted,
  firstIssueMessage,
} from "@/lib/member-fields";

const OAUTH_STATE_COOKIE = "oauth_state";

function parseCookies(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k?.trim() ?? "", v.join("=")];
    })
  );
}

// The first account on a fresh install becomes SUPER_ADMIN
async function roleForNewUser(): Promise<Role> {
  const [existing] = await db.select({ id: users.id }).from(users).limit(1);
  return existing ? Role.USER : Role.SUPER_ADMIN;
}

// POST /api/auth/register
async function register(req: Request): Promise<Response> {
  const body = registerSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: body.error.issues[0]?.message }, { status: 400 });
  }
  const { name, email, password } = body.data;

  const defs = await db.select().from(memberFieldDefinitions);
  const fieldsResult = buildCustomFieldsSchema(defs, { enforceRequired: true }).safeParse(
    body.data.customFields
  );
  if (!fieldsResult.success) {
    return Response.json({ error: firstIssueMessage(fieldsResult.error) }, { status: 400 });
  }
  const customFields = cleanCustomFieldValues(defs, fieldsResult.data);

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return Response.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await Bun.password.hash(password);

  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      customFields,
      profileCompleted: computeProfileCompleted(defs, customFields),
      role: await roleForNewUser(),
    })
    .returning();

  if (!user) {
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }

  const token = await createUserToken(user);
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

  if (!user) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!user.passwordHash && !user.googleId) {
    const rawBytes = crypto.getRandomValues(new Uint8Array(32));
    const rawToken = Buffer.from(rawBytes).toString("hex");
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawToken));
    const tokenHash = Buffer.from(hashBuffer).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db
      .update(accountSetupTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(accountSetupTokens.userId, user.id), isNull(accountSetupTokens.usedAt)));

    await db.insert(accountSetupTokens).values({ userId: user.id, tokenHash, expiresAt });

    const setupUrl = `${env.APP_URL}${PageRoutes.SETUP_PASSWORD}?token=${rawToken}`;
    await sendAccountSetupEmail(user.email, user.name, setupUrl);

    return Response.json(
      { error: "Account not yet set up. We've sent you an email to set your password." },
      { status: 422 }
    );
  }

  if (!user.passwordHash) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await Bun.password.verify(password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createUserToken(user);
  return Response.json({ token });
}

// POST /api/auth/logout
function logout(_req: Request): Response {
  return Response.json({ success: true });
}

const SECURE_COOKIE_FLAG = env.ENV === "production" ? "; Secure" : "";

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
      "Set-Cookie": `${OAUTH_STATE_COOKIE}=${state}; HttpOnly${SECURE_COOKIE_FLAG}; SameSite=Lax; Path=/; Max-Age=600`,
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
    return new Response(null, {
      status: 302,
      headers: { Location: `${PageRoutes.LOGIN}?error=oauth_failed` },
    });
  }

  if (!code) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${PageRoutes.LOGIN}?error=oauth_failed` },
    });
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
    return new Response(null, {
      status: 302,
      headers: { Location: `${PageRoutes.LOGIN}?error=oauth_failed` },
    });
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!profileRes.ok) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${PageRoutes.LOGIN}?error=oauth_failed` },
    });
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
    const [requiredDef] = await db
      .select({ id: memberFieldDefinitions.id })
      .from(memberFieldDefinitions)
      .where(eq(memberFieldDefinitions.required, true))
      .limit(1);

    const [created] = await db
      .insert(users)
      .values({
        name: profile.name,
        email: profile.email,
        googleId: profile.sub,
        imageUrl: profile.picture ?? null,
        profileCompleted: !requiredDef,
        role: await roleForNewUser(),
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
    return new Response(null, {
      status: 302,
      headers: { Location: `${PageRoutes.LOGIN}?error=oauth_failed` },
    });
  }

  const token = await createUserToken(user);
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${PageRoutes.AUTH_CALLBACK}#token=${token}`,
      "Set-Cookie": `${OAUTH_STATE_COOKIE}=; HttpOnly${SECURE_COOKIE_FLAG}; SameSite=Lax; Path=/; Max-Age=0`,
    },
  });
}

// POST /api/auth/forgot-password
async function forgotPassword(req: Request): Promise<Response> {
  const body = forgotPasswordSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: body.error.issues[0]?.message }, { status: 400 });
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, body.data.email))
    .limit(1);

  // Always respond with 200 to prevent email enumeration
  if (!user || !user.passwordHash) {
    return Response.json({ success: true });
  }

  // Generate a cryptographically secure token, store only its hash
  const rawBytes = crypto.getRandomValues(new Uint8Array(32));
  const rawToken = Buffer.from(rawBytes).toString("hex");
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawToken));
  const tokenHash = Buffer.from(hashBuffer).toString("hex");

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Invalidate any previous unused tokens for this user before issuing a new one
  await db
    .delete(passwordResetTokens)
    .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));

  await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt });

  const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);

  return Response.json({ success: true });
}

// POST /api/auth/reset-password
async function resetPassword(req: Request): Promise<Response> {
  const body = resetPasswordSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: body.error.issues[0]?.message }, { status: 400 });
  }

  const { token, password } = body.data;

  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const tokenHash = Buffer.from(hashBuffer).toString("hex");

  const [record] = await db
    .select({ id: passwordResetTokens.id, userId: passwordResetTokens.userId })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt)
      )
    )
    .limit(1);

  if (!record) {
    return Response.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  const passwordHash = await Bun.password.hash(password);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, record.userId));
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, record.id));
  });

  return Response.json({ success: true });
}

// GET /api/auth/setup-password?token=xxx
async function getSetupPassword(req: Request): Promise<Response> {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const tokenHash = Buffer.from(hashBuffer).toString("hex");

  const [record] = await db
    .select({ name: users.name, email: users.email })
    .from(accountSetupTokens)
    .innerJoin(users, eq(accountSetupTokens.userId, users.id))
    .where(
      and(
        eq(accountSetupTokens.tokenHash, tokenHash),
        isNull(accountSetupTokens.usedAt),
        gt(accountSetupTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!record) {
    return Response.json({ error: "Invalid or expired link" }, { status: 400 });
  }

  return Response.json({ name: record.name, email: record.email });
}

// POST /api/auth/setup-password
async function setupPassword(req: Request): Promise<Response> {
  const body = setupPasswordSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: body.error.issues[0]?.message }, { status: 400 });
  }

  const { token, password } = body.data;

  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const tokenHash = Buffer.from(hashBuffer).toString("hex");

  const [record] = await db
    .select({ id: accountSetupTokens.id, userId: accountSetupTokens.userId })
    .from(accountSetupTokens)
    .where(
      and(
        eq(accountSetupTokens.tokenHash, tokenHash),
        isNull(accountSetupTokens.usedAt),
        gt(accountSetupTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!record) {
    return Response.json({ error: "Invalid or expired link" }, { status: 400 });
  }

  const passwordHash = await Bun.password.hash(password);

  const [user] = await db.transaction(async (tx) => {
    await tx
      .update(accountSetupTokens)
      .set({ usedAt: new Date() })
      .where(eq(accountSetupTokens.id, record.id));
    return tx
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, record.userId))
      .returning();
  });

  if (!user) {
    return Response.json({ error: "Failed to set up account" }, { status: 500 });
  }

  const jwtToken = await createUserToken(user);
  return Response.json({ token: jwtToken });
}

export const authRoutes = {
  [ApiRoutes.AUTH_REGISTER]: { POST: register },
  [ApiRoutes.AUTH_LOGIN]: { POST: login },
  [ApiRoutes.AUTH_LOGOUT]: { POST: logout },
  [ApiRoutes.AUTH_GOOGLE]: { GET: googleRedirect },
  [ApiRoutes.AUTH_GOOGLE_CALLBACK]: { GET: googleCallback },
  [ApiRoutes.AUTH_FORGOT_PASSWORD]: { POST: forgotPassword },
  [ApiRoutes.AUTH_RESET_PASSWORD]: { POST: resetPassword },
  [ApiRoutes.AUTH_SETUP_PASSWORD]: { GET: getSetupPassword, POST: setupPassword },
};
