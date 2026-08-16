"use client";

import Image from "next/image";

type KaechiMood = "normal" | "happy" | "question" | "wave" | "mini";

interface KaechiProps {
  mood?: KaechiMood;
  size?: number;
  animate?: boolean;
}

// mood → 이미지 파일 매핑
// normal/wave/happy/question → 메인 캐릭터
// mini → 메인 캐릭터 (작게)
const MOOD_IMAGE: Record<KaechiMood, string> = {
  normal:   "/char-main.png",
  happy:    "/char-main.png",
  question: "/char-main.png",
  wave:     "/char-main.png",
  mini:     "/char-main.png",
};

export function Kaechi({ mood = "normal", size = 80, animate = true }: KaechiProps) {
  const cls = animate ? "kaechi-float" : "";
  const src = MOOD_IMAGE[mood];

  return (
    <div className={cls} style={{ width: size, height: size, flexShrink: 0 }}>
      <Image
        src={src}
        alt="캐치"
        width={size}
        height={size}
        style={{ objectFit: "contain", width: "100%", height: "100%" }}
        priority
      />
    </div>
  );
}

// 씻기 요소별 캐릭터 이미지
export const WASH_CHAR: Record<string, string> = {
  teeth: "/char-teeth.png",
  face:  "/char-face.png",
  hair:  "/char-hair.png",
  body:  "/char-body.png",
};
