"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

export type Scene = "chama-meeting" | "treasurer-desk" | "member-morning";

const ALT: Record<Scene, string> = {
  "chama-meeting": "Chama members reviewing their records around a wooden table",
  "treasurer-desk": "A treasurer comparing a handwritten register with a laptop",
  "member-morning": "A member reading a message on a phone beside a window",
};

const ALL: Scene[] = ["chama-meeting", "treasurer-desk", "member-morning"];

/** How long one photograph stays before the next one fades in. */
const HOLD_MS = 8_000;

/**
 * Real footage of people together, chosen to suit the screen. Both loops show
 * a formal meeting of men and women from a high angle, with faces softened so
 * nobody is identifiable. They are silent and stay under 1 MB.
 */
const FILMS: Record<Scene, string> = {
  "chama-meeting": "/videos/meeting.mp4",
  "treasurer-desk": "/videos/meeting.mp4",
  "member-morning": "/videos/gathering.mp4",
};

export function MovingScenes({
  scenes = ALL,
  start,
  variant = "strip",
  priority = false,
  contentClassName,
  children,
}: {
  scenes?: Scene[];
  start?: Scene;
  variant?: "strip" | "hero" | "page";
  priority?: boolean;
  contentClassName?: string;
  children?: React.ReactNode;
}) {
  const order = useMemo(
    () => (start ? [start, ...scenes.filter((scene) => scene !== start)] : scenes),
    [scenes, start],
  );
  const [index, setIndex] = useState(0);
  const [moving, setMoving] = useState(false);
  const [film, setFilm] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    setFilm(true);
    if (order.length < 2) return;
    setMoving(true);
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % order.length);
    }, HOLD_MS);
    return () => window.clearInterval(timer);
  }, [order.length]);

  const height =
    variant === "page"
      ? "min-h-screen"
      : variant === "hero"
        ? "min-h-[46vh] sm:min-h-[52vh]"
        : "h-40 sm:h-[220px]";
  const copyPosition = variant === "page" ? "items-center justify-center p-5 sm:p-8" : "items-end p-5 sm:p-8";
  const shade =
    variant === "page"
      ? "bg-gradient-to-b from-[#0F2A3D]/85 via-[#0F2A3D]/70 to-[#0F2A3D]/90"
      : "bg-[#0F2A3D]/70";
  // The film follows the door, not the still that is currently fading in.
  const door = start ?? scenes[0] ?? "chama-meeting";
  const filmSrc = FILMS[door];

  useEffect(() => {
    if (!film) return;
    void video.current?.play().catch(() => setFilm(false));
  }, [film, filmSrc]);

  return (
    <div className={`relative w-full overflow-hidden ${height}`} data-variant={variant}>
      {order.map((scene, sceneIndex) => {
        const active = sceneIndex === index;
        return (
          <div
            key={scene}
            className="scene-layer absolute inset-0"
            data-active={active}
            data-fade={moving}
            style={{ opacity: active ? 1 : 0 }}
            aria-hidden={active ? undefined : true}
          >
            <Image
              src={`/images/${scene}-phone.webp`}
              alt={active && !film ? ALT[scene] : ""}
              fill
              priority={priority && sceneIndex === 0}
              sizes="100vw"
              className="object-cover sm:hidden"
            />
            <Image
              src={`/images/${scene}-desktop.webp`}
              alt=""
              fill
              priority={priority && sceneIndex === 0}
              sizes="100vw"
              className="hidden object-cover sm:block"
            />
          </div>
        );
      })}
      {film ? (
        <video
          key={filmSrc}
          ref={video}
          className="absolute inset-0 h-full w-full object-cover"
          src={filmSrc}
          data-film={filmSrc}
          poster={`/images/${door}-desktop.webp`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onError={() => setFilm(false)}
        />
      ) : null}
      <div className={`absolute inset-0 ${shade}`} />
      {children ? (
        <div className={`scene-copy absolute inset-0 flex ${contentClassName ?? copyPosition}`}>{children}</div>
      ) : null}
    </div>
  );
}
