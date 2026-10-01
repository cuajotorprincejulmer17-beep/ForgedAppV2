import { requestPasswordReset } from "@/lib/services/auth";

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!input || typeof input !== "object") {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = (input as Record<string, unknown>).email;
  if (typeof email !== "string") {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const result = await requestPasswordReset(email, new URL(request.url).origin);
    if (!result.ok) {
      return Response.json({ error: result.message }, { status: result.status });
    }
    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "We couldn't send a reset link right now. Please try again." },
      { status: 503 },
    );
  }
}