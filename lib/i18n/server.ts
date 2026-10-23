import { cookies } from "next/headers";
import { dictionaries, type Locale } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get("locale")?.value === "ar" ? "ar" : "en";
}

export async function getT() {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  function t(path: string): string {
    const parts = path.split(".");
    let cur: unknown = dict;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in cur) cur = (cur as Record<string, unknown>)[p];
      else return path;
    }
    return typeof cur === "string" ? cur : path;
  }
  return { locale, t };
}
