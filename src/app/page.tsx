"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadMyOrder } from "@/lib/wash";
import { loadUser } from "@/lib/auth";
import { Kaechi } from "@/components/Kaechi";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = loadUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    const my = loadMyOrder();
    router.replace(my ? "/today" : "/setup");
  }, [router]);

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 45%,#C7ECD9 100%)",
      gap: 20,
    }}>
      <Kaechi mood="normal" size={100} animate />
      <p style={{ fontSize: 18, fontWeight: 800, color: "#1E2A22" }}>
        오늘은 어디부터 씻지?
      </p>
    </div>
  );
}
