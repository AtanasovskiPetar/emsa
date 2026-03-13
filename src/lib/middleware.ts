import { type Role } from "../constants/enums";
import { type JwtUser, verifyJwt } from "./jwt";
import { hasAccess } from "./utils";

type BunRequest<P extends Record<string, string> = Record<string, string>> = Request & { params: P };

async function getAuthUser(req: Request): Promise<JwtUser | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return await verifyJwt(auth.slice(7));
  } catch {
    return null;
  }
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
    return handler(req, user);
  };
}
