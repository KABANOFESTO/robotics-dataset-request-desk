import "server-only";

import { cookies } from "next/headers";

/** Reads the planned HTTP-only session cookie; token verification is added with auth actions. */
export async function readSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("dataset_session")?.value ?? null;
}
