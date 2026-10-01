import { registerAccount } from "@/lib/services/auth";

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Enter all required account details." }, { status: 400 });
  }

  try {
    const result = await registerAccount(input, new URL(request.url).origin);
    if (!result.ok) {
      return Response.json({ error: result.message }, { status: result.status });
    }
    return Response.json({ requiresEmailConfirmation: result.requiresEmailConfirmation });
  } catch (error) {
    console.error("SIGNUP ROUTE UNHANDLED ERROR:", error);

    return Response.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : "Unable to create your account right now. Please try again.",
      },
      { status: 503 },
    );
  }
}