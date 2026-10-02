import "server-only";

import { cookies } from "next/headers";

/** Reads the access-token cookie used by the route proxy's navigation guard. */
export async function readSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("dataset_session")?.value ?? null;
}
