import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EditableProfileFields, Profile, UserStatus } from "@/types/database";

export type CurrentProfileResult =
  | { status: "success"; profile: Profile }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error"; message: string };

export type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  identity_glow_id: string | null;
  status: UserStatus;
};

export type PublicProfileResult =
  | { status: "success"; profile: PublicProfile }
  | { status: "not_found" }
  | { status: "error"; message: string };

export type UpdateCurrentProfileResult =
  | { status: "success" }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "username_conflict"; message: string }
  | { status: "validation_error"; field: keyof EditableProfileFields; message: string }
  | { status: "error"; message: string };

type DatabaseError = {
  code?: string;
  message?: string;
  details?: string;
};

function normalizeUsername(username: string) {
  return username.trim().replace(/^@/, "").toLowerCase();
}

function isUsernameConflict(error: DatabaseError) {
  if (error.code !== "23505") return false;

  return [error.message, error.details]
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.includes("profiles_username_key"));
}

export async function getCurrentProfile(): Promise<CurrentProfileResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("[getCurrentProfile] Supabase auth lookup failed", {
      code: authError.code,
      status: authError.status,
    });
    return { status: "error", message: "Unable to retrieve your profile." };
  }

  if (!user) return { status: "unauthenticated" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_url, avatar_seed, identity_glow_id, tutorial_completed, status, created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[getCurrentProfile] Profile query failed", {
      code: profileError.code,
    });
    return { status: "error", message: "Unable to retrieve your profile." };
  }

  if (!profile) return { status: "not_found" };

  return { status: "success", profile };
}

export async function getPublicProfile(username: string): Promise<PublicProfileResult> {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return { status: "not_found" };

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, identity_glow_id, status")
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (error) {
    console.error("[getPublicProfile] Profile query failed", { code: error.code });
    return { status: "error", message: "Unable to retrieve this profile." };
  }

  if (!profile) return { status: "not_found" };

  return {
    status: "success",
    profile: {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      identity_glow_id: profile.identity_glow_id,
      status: profile.status,
    },
  };
}

export async function updateCurrentProfile(
  input: EditableProfileFields,
): Promise<UpdateCurrentProfileResult> {
  const updates: EditableProfileFields = {};

  if (input.username !== undefined) {
    if (typeof input.username !== "string") {
      return { status: "validation_error", field: "username", message: "Enter a valid username." };
    }

    const username = normalizeUsername(input.username);
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return {
        status: "validation_error",
        field: "username",
        message: "Username must be 3-20 characters using letters, numbers, or underscores.",
      };
    }
    updates.username = username;
  }

  if (input.display_name !== undefined) {
    if (input.display_name !== null && typeof input.display_name !== "string") {
      return { status: "validation_error", field: "display_name", message: "Enter a valid display name." };
    }

    const displayName = input.display_name?.trim() ?? null;
    if (displayName && displayName.length > 40) {
      return { status: "validation_error", field: "display_name", message: "Display name must be 40 characters or fewer." };
    }
    updates.display_name = displayName || null;
  }

  if (input.bio !== undefined) {
    if (input.bio !== null && typeof input.bio !== "string") {
      return { status: "validation_error", field: "bio", message: "Enter a valid bio." };
    }

    const bio = input.bio?.trim() ?? null;
    if (bio && bio.length > 280) {
      return { status: "validation_error", field: "bio", message: "Bio must be 280 characters or fewer." };
    }
    updates.bio = bio || null;
  }

  if (input.avatar_url !== undefined) {
    if (input.avatar_url !== null && typeof input.avatar_url !== "string") {
      return { status: "validation_error", field: "avatar_url", message: "Enter a valid avatar URL." };
    }

    // No URL format is currently established in the application; preserve the stored value as text.
    updates.avatar_url = input.avatar_url?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return { status: "validation_error", field: "display_name", message: "Make a profile change before saving." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("[updateCurrentProfile] Supabase auth lookup failed", {
      code: authError.code,
      status: authError.status,
    });
    return { status: "error", message: "Unable to update your profile." };
  }

  if (!user) return { status: "unauthenticated" };

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (isUsernameConflict(error)) {
      return { status: "username_conflict", message: "That username is already taken." };
    }

    console.error("[updateCurrentProfile] Profile update failed", { code: error.code });
    return { status: "error", message: "Unable to update your profile." };
  }

  if (!data) return { status: "not_found" };

  return { status: "success" };
}
