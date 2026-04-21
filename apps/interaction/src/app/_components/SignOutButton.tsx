import { signOutAction } from "./sign-out-action";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full rounded-lg border border-parchment/30 px-4 py-3 text-parchment transition hover:bg-white/5"
      >
        Sign out
      </button>
    </form>
  );
}
