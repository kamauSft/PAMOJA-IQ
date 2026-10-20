"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SCENES = [
  { name: "chama-meeting", alt: "Six chama members reviewing papers around a wooden table" },
  { name: "treasurer-desk", alt: "A treasurer comparing a handwritten register with a laptop" },
  { name: "member-morning", alt: "A member reading a message on a phone beside a window" },
] as const;

export function MovingScenes({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SCENES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-[70vh] w-full overflow-hidden">
      {SCENES.map((scene, sceneIndex) => (
        <div
          key={scene.name}
          className={`absolute inset-0 transition-opacity duration-1000 ${sceneIndex === index ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={`/images/${scene.name}-phone.webp`}
            alt={sceneIndex === index ? scene.alt : ""}
            fill
            priority={sceneIndex === 0}
            sizes="100vw"
            className="object-cover sm:hidden"
          />
          <Image
            src={`/images/${scene.name}-desktop.webp`}
            alt=""
            fill
            priority={sceneIndex === 0}
            sizes="100vw"
            className="hidden object-cover sm:block"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-[#0F2A3D]/70" />
      <div className="scene-copy absolute inset-0 flex items-end p-5 sm:p-8">{children}</div>
    </div>
  );
}
