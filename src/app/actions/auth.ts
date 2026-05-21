"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/validators/auth";
import { signInWithPassword, signOutCurrentUser } from "@/lib/services/auth-service";
import type { ActionState } from "@/lib/types/erp";

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const credentials = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    await signInWithPassword(credentials.email, credentials.password);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo iniciar sesión.",
    };
  }

  redirect("/");
}

export async function logoutAction() {
  await signOutCurrentUser();
  redirect("/login");
}
