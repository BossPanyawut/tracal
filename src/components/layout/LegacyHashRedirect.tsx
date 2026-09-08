"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LegacyHashRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (window.location.hash === "#calculator") router.replace("/calculator");
    if (window.location.hash === "#journal") router.replace("/journal");
  }, [router]);
  return null;
}
