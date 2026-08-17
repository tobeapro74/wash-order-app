"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadUser } from "@/lib/auth";

export function useAuth() {
  const router = useRouter();

  useEffect(() => {
    const user = loadUser();
    if (!user) {
      router.replace("/login");
    }
  }, [router]);

  return loadUser();
}
