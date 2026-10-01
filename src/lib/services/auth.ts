import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const INVALID_CREDENTIALS = { error: "Invalid username or password." };

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveUsernameEmail(identifier: string): Promise<string | null> {
  const username = identifier.replace(/^@/, "").toLowerCase();
  const adminClient = createAdminClient();
  if (!username || !adminClient) return null;

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (profileError || !profile) return null;
  const userId = (profile as { id: string } | null)?.id;
  if (!userId) return null;

  const { data, error } = await adminClient.auth.admin.getUserById(userId);
  return error ? null : data.user.email ?? null;
}

export async function signInWithIdentifier(identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim();
  const isUsername = normalizedIdentifier.startsWith("@") || !normalizedIdentifier.includes("@");
  const email = isUsername
    ? await resolveUsernameEmail(normalizedIdentifier)
    : normalizedIdentifier;

  console.log("LOGIN IDENTIFIER RESOLUTION:", {
    identifier: normalizedIdentifier,
    isUsername,
    resolvedEmail: email,
  });

  if (!email) return INVALID_CREDENTIALS;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  console.error("LOGIN RESULT:", {
    identifier: normalizedIdentifier,
    resolvedEmail: email,
    error: error
      ? {
          message: error.message,
          status: error.status,
          code: error.code,
        }
      : null,
  });

  if (error) {
    return {
      error: `Supabase login failed: ${error.message}`,
    };
  }

  return null;
}

type RegistrationResult =
  | { ok: true; requiresEmailConfirmation: boolean }
  | { ok: false; status: 400 | 409 | 503; message: string };

function invalidRegistration(message: string): RegistrationResult {
  return { ok: false, status: 400, message };
}

function logRegistrationOperationError(operation: string, error: unknown) {
  const errorFields = error && typeof error === "object"
    ? error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown }
    : null;

  console.error(`[registerAccount] ${operation} failed`, {
    code: errorFields?.code,
    message: errorFields?.message ?? (error instanceof Error ? error.message : String(error)),
    details: errorFields?.details,
    hint: errorFields?.hint,
  });
}

export async function registerAccount(
  input: unknown,
  requestOrigin: string,
): Promise<RegistrationResult> {
  if (!input || typeof input !== "object") {
    return invalidRegistration("Enter all required account details.");
  }

  const values = input as Record<string, unknown>;
  if (typeof values.username !== "string" || !values.username.trim()) {
    return invalidRegistration("Username is required.");
  }
  if (typeof values.displayName !== "string" || !values.displayName.trim()) {
    return invalidRegistration("Display name is required.");
  }
  if (typeof values.email !== "string" || !values.email.trim()) {
    return invalidRegistration("Email is required.");
  }
  if (typeof values.password !== "string" || !values.password) {
    return invalidRegistration("Password is required.");
  }

  const username = values.username.trim().replace(/^@/, "").toLowerCase();
  const displayName = values.displayName.trim();
  const email = values.email.trim();
  const password = values.password;

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return invalidRegistration("Username must be 3-20 characters using letters, numbers, or underscores.");
  }
  if (displayName.length > 40) {
    return invalidRegistration("Display name must be 40 characters or fewer.");
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return invalidRegistration("Enter a valid email address.");
  }
  if (password.length < 8) {
    return invalidRegistration("Password must be at least 8 characters.");
  }
  if (!/[A-Z]/.test(password)) {
    return invalidRegistration("Password must include an uppercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    return invalidRegistration("Password must include a number.");
  }
  if (!/[^A-Za-z0-9\s]/.test(password)) {
    return invalidRegistration("Password must include a special character.");
  }

  console.info("[registerAccount] createAdminClient:start");
  let adminClient: ReturnType<typeof createAdminClient>;
  try {
    adminClient = createAdminClient();
  } catch (error) {
    logRegistrationOperationError("createAdminClient", error);
    throw error;
  }
  console.info("[registerAccount] createAdminClient:complete", { available: Boolean(adminClient) });
  if (!adminClient) {
    return { ok: false, status: 503, message: "Registration is temporarily unavailable." };
  }

  console.info("[registerAccount] usernameLookup:start");
  let existingUsername;
  let usernameLookupError;
  try {
    const result = await adminClient
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    existingUsername = result.data;
    usernameLookupError = result.error;
  } catch (error) {
    logRegistrationOperationError("usernameLookup", error);
    throw error;
  }
  console.info("[registerAccount] usernameLookup:complete", {
    found: Boolean(existingUsername),
    error: usernameLookupError
      ? {
          code: usernameLookupError.code,
          message: usernameLookupError.message,
          details: usernameLookupError.details,
          hint: usernameLookupError.hint,
        }
      : null,
  });

  if (usernameLookupError) {
    return { ok: false, status: 503, message: "Registration is temporarily unavailable." };
  }
  if (existingUsername) {
    return { ok: false, status: 409, message: "Username already exist." };
  }

  console.info("[registerAccount] createServerClient:start");
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (error) {
    logRegistrationOperationError("createServerClient", error);
    throw error;
  }
  console.info("[registerAccount] createServerClient:complete");

  console.info("[registerAccount] auth.signUp:start");
  let authData;
  let authError;
  try {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${requestOrigin}/auth/callback?next=%2Fhome`,
        data: { username, display_name: displayName },
      },
    });
    authData = result.data;
    authError = result.error;
  } catch (error) {
    logRegistrationOperationError("auth.signUp", error);
    throw error;
  }

  console.error("AUTH SIGNUP RESULT:", {
    authError: authError
      ? {
          message: authError.message,
          status: authError.status,
          code: authError.code,
        }
      : null,
    userId: authData.user?.id ?? null,
    identitiesCount: authData.user?.identities?.length ?? null,
    hasSession: !!authData.session,
  });

  if (process.env.NODE_ENV === "development") {
    console.info("[registerAccount] Supabase signUp diagnostics", {
      authErrorMessage: authError?.message,
      authErrorCode: authError?.code,
      authErrorStatus: authError?.status,
      hasUser: Boolean(authData.user),
      hasSession: Boolean(authData.session),
      identityCount: authData.user?.identities?.length,
    });
  }

  if (authError) {
    logRegistrationOperationError("auth.signUp response", authError);
    return invalidRegistration(`Auth signup failed: ${authError.message}`);
  }

  if (!authData.user) {
    return invalidRegistration("Auth signup failed: no user was returned.");
  }

  if (authData.user.identities?.length === 0) {
    return invalidRegistration("Auth signup returned no identities.");
  }

  console.info("[registerAccount] profileVerification:start");
  let profile;
  let profileVerificationError;
  try {
    const result = await adminClient
      .from("profiles")
      .select("id, username, display_name, identity_glow_id, tutorial_completed")
      .eq("id", authData.user.id)
      .maybeSingle();
    profile = result.data;
    profileVerificationError = result.error;
  } catch (error) {
    logRegistrationOperationError("profileVerification", error);
    throw error;
  }
  const profileRow = profile as unknown as Database["public"]["Tables"]["profiles"]["Row"] | null;
  console.info("[registerAccount] profileVerification:complete", {
    found: Boolean(profileRow),
    error: profileVerificationError
      ? {
          code: profileVerificationError.code,
          message: profileVerificationError.message,
          details: profileVerificationError.details,
          hint: profileVerificationError.hint,
        }
      : null,
  });

  if (
    profileVerificationError ||
    !profileRow ||
    profileRow.id !== authData.user.id ||
    profileRow.username !== username ||
    profileRow.display_name !== displayName ||
    !profileRow.identity_glow_id ||
    profileRow.tutorial_completed !== false
  ) {
    if (profileVerificationError) {
      logRegistrationOperationError("profileVerification response", profileVerificationError);
    }
    console.error("[registerAccount] profileVerification failed", {
      profileFound: Boolean(profileRow),
      authUserIdMatches: profileRow?.id === authData.user.id,
      usernameMatches: profileRow?.username === username,
      displayNameMatches: profileRow?.display_name === displayName,
      hasIdentityGlowId: Boolean(profileRow?.identity_glow_id),
      tutorialCompletedIsFalse: profileRow?.tutorial_completed === false,
    });
    console.info("[registerAccount] auth.admin.deleteUser:start");
    try {
      const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(authData.user.id);
      if (deleteUserError) {
        logRegistrationOperationError("auth.admin.deleteUser response", deleteUserError);
      } else {
        console.info("[registerAccount] auth.admin.deleteUser:complete");
      }
    } catch (error) {
      logRegistrationOperationError("auth.admin.deleteUser", error);
      throw error;
    }
    return { ok: false, status: 503, message: "We couldn't finish setting up your profile. Please try again later." };
  }

  return { ok: true, requiresEmailConfirmation: !authData.session };
}

type PasswordResetRequestResult =
  | { ok: true }
  | { ok: false; status: 400 | 429 | 503; message: string };

export async function requestPasswordReset(
  email: string,
  requestOrigin: string,
): Promise<PasswordResetRequestResult> {
  const normalizedEmail = email.trim();
  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    return { ok: false, status: 400, message: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: new URL("/auth/callback?next=%2Freset-password", requestOrigin).toString(),
  });

  if (!error) return { ok: true };
  if (error.status === 429) {
    return {
      ok: false,
      status: 429,
      message: "Please wait a moment before requesting another reset link.",
    };
  }

  const errorCode = error.code?.toLowerCase();
  const errorMessage = error.message.toLowerCase();
  if (
    error.status === 404 ||
    errorCode === "user_not_found" ||
    errorMessage.includes("user not found")
  ) {
    return { ok: true };
  }

  console.error("PASSWORD RESET REQUEST FAILED:", {
    status: error.status,
    code: error.code,
  });
  return {
    ok: false,
    status: 503,
    message: "We couldn't send a reset link right now. Please try again.",
  };
}
