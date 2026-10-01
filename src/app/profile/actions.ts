"use server";

import { revalidatePath } from "next/cache";
import { updateCurrentProfile } from "@/lib/services/profile";

export type ProfileEditorState = {
  status: "idle" | "success" | "error";
  message: string | null;
  field?: "username" | "display_name" | "bio" | "avatar_url";
};

export const initialProfileEditorState: ProfileEditorState = {
  status: "idle",
  message: null,
};

function nullableFormValue(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value : "";
  return text.trim() || null;
}

export async function saveProfileAction(
  _previousState: ProfileEditorState,
  formData: FormData,
): Promise<ProfileEditorState> {
  const result = await updateCurrentProfile({
    username: typeof formData.get("username") === "string" ? String(formData.get("username")) : "",
    display_name: nullableFormValue(formData.get("display_name")),
    bio: nullableFormValue(formData.get("bio")),
    avatar_url: nullableFormValue(formData.get("avatar_url")),
  });

  if (result.status === "success") {
    revalidatePath("/profile");
    revalidatePath("/home");
    return { status: "success", message: "Profile saved." };
  }

  if (result.status === "validation_error") {
    return { status: "error", message: result.message, field: result.field };
  }

  if (result.status === "username_conflict") {
    return { status: "error", message: result.message, field: "username" };
  }

  if (result.status === "unauthenticated") {
    return { status: "error", message: "Your session has expired. Please sign in again." };
  }

  if (result.status === "not_found") {
    return { status: "error", message: "Your profile could not be found." };
  }

  return { status: "error", message: result.message };
}
