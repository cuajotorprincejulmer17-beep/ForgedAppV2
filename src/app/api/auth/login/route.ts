import { signInWithIdentifier } from "@/lib/services/auth";

const INVALID_CREDENTIALS = { error: "Invalid username or password." };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Enter your email or username and password." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Enter your email or username and password." }, { status: 400 });
  }

  const { identifier, password } = body as Record<string, unknown>;
  if (typeof identifier !== "string" || typeof password !== "string" || !identifier.trim() || !password) {
    return Response.json({ error: "Enter your email or username and password." }, { status: 400 });
  }

  try {
    const error = await signInWithIdentifier(identifier, password);
    if (error) return Response.json(INVALID_CREDENTIALS, { status: 401 });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Unable to log in right now. Please try again." }, { status: 503 });
  }
}