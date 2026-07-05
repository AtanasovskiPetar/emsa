import { eq } from "drizzle-orm";
import { type ZodType } from "zod";

import { type Role } from "@/constants/enums";
import { users } from "@/db/schema";
import { db } from "@/lib/db";
import { type JwtUser, verifyJwt } from "@/lib/jwt";
import { hasAccess } from "@/lib/utils";

export type BunRequest<P extends Record<string, string> = Record<string, string>> = Request & {
  params: P;
};

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function getAuthUser(req: Request): Promise<JwtUser | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const jwtUser = await verifyJwt(auth.slice(7));
    const [dbUser] = await db
      .select({ role: users.role, profileCompleted: users.profileCompleted })
      .from(users)
      .where(eq(users.id, jwtUser.sub))
      .limit(1);
    if (!dbUser) return null;
    return { ...jwtUser, role: dbUser.role, profileCompleted: dbUser.profileCompleted };
  } catch {
    return null;
  }
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const result = schema.safeParse(await req.json());
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message ?? "Invalid request body");
  }
  return result.data;
}

interface WithRoleOptions {
  allowIncomplete?: boolean;
}

export function withRole<P extends Record<string, string> = Record<string, string>>(
  role: Role,
  handler: (req: BunRequest<P>, user: JwtUser) => Promise<Response>,
  options?: WithRoleOptions
): (req: BunRequest<P>) => Promise<Response> {
  return async (req: BunRequest<P>): Promise<Response> => {
    const user = await getAuthUser(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasAccess(user.role, role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!options?.allowIncomplete && !user.profileCompleted) {
      return Response.json({ error: "Profile incomplete" }, { status: 403 });
    }

    try {
      return await handler(req, user);
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }
  };
}
