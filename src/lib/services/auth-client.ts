"use client";

import { createClient } from "@/lib/supabase/client";

export async function getCurrentAuthSession() {
  return createClient().auth.getSession();
}

export async function updateCurrentPassword(password: string) {
  return createClient().auth.updateUser({ password });
}