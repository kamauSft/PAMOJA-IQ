import { cookies } from "next/headers";
import type { Locale } from "@/content/ui";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("locale")?.value;
  return value === "sw" ? "sw" : "en";
}
