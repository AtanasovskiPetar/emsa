import { type ZodSchema } from "zod";

import { type Role } from "@/constants/enums";
import { type JwtUser, verifyJwt } from "@/lib/jwt";
import { hasAccess } from "@/lib/utils";

type BunRequest<P extends Record<string, string> = Record<string, string>> = Request & { params: P };

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

async function getAuthUser(req: Request): Promise<JwtUser | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return await verifyJwt(auth.slice(7));
  } catch {
    return null;
  }
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const result = schema.safeParse(await req.json());
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message ?? "Invalid request body");
  }
  return result.data;
}

export function withRole<P extends Record<string, string> = Record<string, string>>(
  role: Role,
  handler: (req: BunRequest<P>, user: JwtUser) => Promise<Response>
): (req: BunRequest<P>) => Promise<Response> {
  return async (req: BunRequest<P>): Promise<Response> => {
    const user = await getAuthUser(req);
    if (!user || !hasAccess(user.role, role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
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
