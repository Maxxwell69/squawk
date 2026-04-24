import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Public shortcut: admins go straight to /crew/admin after session check;
 * everyone else is sent to crew sign-in with return URL.
 */
export default async function AdminLoginShortcutPage() {
  const session = await auth();
  if (session?.user?.role === "ADMIN") {
    redirect("/crew/admin");
  }
  redirect("/crew/login?callbackUrl=%2Fcrew%2Fadmin");
}
