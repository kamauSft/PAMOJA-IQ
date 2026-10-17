import { useEffect, useRef } from "react";

function makeBubble() {
  return {
    x: Math.random(),
    y: Math.random(),
    r: 70 + Math.random() * 220,
    vx: (Math.random() - 0.5) * 0.00012,
    vy: -0.00005 - Math.random() * 0.00016,
    tone: Math.random() > 0.62 ? "212, 176, 122" : "126, 186, 170",
    alpha: 0.045 + Math.random() * 0.07,
  };
}

export function Bubbles() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const bubbles = Array.from({ length: 16 }, makeBubble);
    let frame = 0;

    function fit() {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function draw() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);
      for (const bubble of bubbles) {
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        if (bubble.y < -0.25) bubble.y = 1.15;
        if (bubble.x < -0.2) bubble.x = 1.15;
        if (bubble.x > 1.2) bubble.x = -0.15;
        const x = bubble.x * width;
        const y = bubble.y * height;
        const glow = ctx.createRadialGradient(x, y, bubble.r * 0.1, x, y, bubble.r);
        glow.addColorStop(0, `rgba(${bubble.tone}, ${bubble.alpha})`);
        glow.addColorStop(1, `rgba(${bubble.tone}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, bubble.r, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    }

    fit();
    window.addEventListener("resize", fit);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
    };
  }, []);

  return <canvas ref={ref} className="bubbles" aria-hidden="true" />;
}
