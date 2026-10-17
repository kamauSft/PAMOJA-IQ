"use client";

import { useRouter } from "next/navigation";

export function SignOut({ signOutLabel = "Sign out", signOutAllLabel = "Sign out everywhere" }: { signOutLabel?: string; signOutAllLabel?: string }) {
  const router = useRouter();

  async function signOut(all: boolean) {
    await fetch(all ? "/api/auth/logout-all" : "/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex gap-3">
      <button className="tap rounded-full border border-ink/20 px-4 text-sm" onClick={() => signOut(false)} type="button">
        {signOutLabel}
      </button>
      <button className="tap rounded-full border border-ink/20 px-4 text-sm" onClick={() => signOut(true)} type="button">
        {signOutAllLabel}
      </button>
    </div>
  );
}
