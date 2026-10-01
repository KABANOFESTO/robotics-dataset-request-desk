"use server";

// Implement JWT exchange and secure cookie lifecycle in the authentication step.
export async function loginAction(formData: FormData): Promise<void> {
  void formData;
  throw new Error("Login is not implemented yet.");
}

export async function logoutAction(): Promise<void> {
  throw new Error("Logout is not implemented yet.");
}
