import React, { useEffect, useRef } from "react";
import { who } from "./content/who";

const positions = [
  { x: 100 / 6, y: 16 },
  { x: 50, y: 16 },
  { x: 500 / 6, y: 16 },
  { x: 100 / 6, y: 84 },
  { x: 50, y: 84 },
  { x: 500 / 6, y: 84 },
];

export function WhoSection() {
  const diagramRef = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const diagram = diagramRef.current;
    const spark = sparkRef.current;
    if (!diagram || !spark) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const center = { left: "50%", top: "50%" };
    const animation = spark.animate(
      [
        center,
        ...positions.flatMap(({ x, y }) => [
          { left: `${x}%`, top: `${y}%` },
          center,
        ]),
      ],
      { duration: 24000, iterations: Infinity, easing: "linear" },
    );
    animation.pause();

    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !reduce.matches) {
        animation.play();
      } else {
        animation.pause();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(diagram);
    reduce.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      observer.disconnect();
      reduce.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      animation.cancel();
    };
  }, []);

  return (
    <section
      id="who"
      className="site-container py-24 sm:py-32"
      aria-labelledby="who-title"
    >
      <h2 id="who-title" className="section-title mx-auto max-w-3xl text-center">
        {who.title}
      </h2>

      <div ref={diagramRef} className="relative mx-auto mt-10 h-56 max-w-3xl">
        <svg
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute inset-0 h-full w-full text-border"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          fill="none"
        >
          {positions.map(({ x, y }) => (
            <line
              key={`${x}-${y}`}
              x1={x}
              y1={y}
              x2="50"
              y2="50"
              stroke="currentColor"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <span
          ref={sparkRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal"
        />

        <p className="absolute left-1/2 top-1/2 flex h-11 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
          {who.project}
        </p>

        <ul aria-label={who.rolesLabel}>
          {who.roles.map((role, index) => (
            <li
              key={role}
              className="absolute flex min-h-9 w-[31%] max-w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background px-1 py-2 text-center text-xs text-muted-foreground sm:text-sm"
              style={{
                left: `${positions[index].x}%`,
                top: `${positions[index].y}%`,
              }}
            >
              {role}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
