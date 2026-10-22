import React, { useEffect, useId, useRef } from "react";
import { FileText, Layers2, MessageSquare, CornerDownRight } from "./icons";
import { alwaysOn } from "./content/always-on";
import styles from "./always-on.module.css";

const itemIcons = [MessageSquare, Layers2, FileText];
const arrivalClasses = [styles.first, styles.second, styles.third];

export function AlwaysOnSection() {
  const titleId = useId();
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;

    const sync = () => {
      scene.dataset.running = String(inView && !document.hidden && !reducedMotion.matches);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.35;
        sync();
      },
      { threshold: [0, 0.35] },
    );

    observer.observe(scene);
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
    };
  }, []);

  return (
    <section id="always-on" className="site-container py-24 sm:py-32" aria-labelledby={titleId}>
      <div className="max-w-2xl">
        <h2 id={titleId} className="section-title">{alwaysOn.title}</h2>
        <p className="mt-5 text-base text-muted-foreground sm:text-lg">{alwaysOn.description}</p>
      </div>

      <figure className="mt-10 sm:mt-14">
        <div
          ref={sceneRef}
          aria-hidden="true"
          className={`${styles.scene} relative isolate h-[23rem] overflow-hidden rounded-2xl border bg-mist shadow-[0_40px_80px_-40px_rgba(0,39,36,0.35)] sm:h-[27rem]`}
        >
          <div className="absolute inset-x-0 top-0 flex h-11 items-center gap-1.5 border-b bg-background/75 px-5">
            <span className="size-1.5 rounded-full bg-primary/15" />
            <span className="size-1.5 rounded-full bg-primary/15" />
            <span className="size-1.5 rounded-full bg-primary/15" />
            <span className="ml-6 h-1.5 w-24 rounded-full bg-primary/10" />
          </div>

          <div className="absolute top-11 bottom-0 left-0 hidden w-36 border-r bg-background/40 px-5 pt-8 sm:block">
            {["w-16", "w-20", "w-12", "w-16"].map((width, index) => (
              <div key={index} className={`mb-5 h-1.5 rounded-full bg-primary/[0.07] ${width}`} />
            ))}
          </div>

          <div className="absolute inset-x-6 top-20 h-64 border border-primary/[0.06] bg-background/70 p-5 sm:right-[26%] sm:left-[20%] sm:h-72 sm:p-7">
            <div className="h-1.5 w-24 rounded-full bg-primary/10" />
            <div className="mt-3 h-1 w-16 rounded-full bg-primary/[0.06]" />
            <svg viewBox="0 0 400 210" className="mt-5 h-40 w-full text-primary/[0.12]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M34 22H366V188H34Z M40 28H360V182H40Z M154 28V95 M154 130V182 M40 112H101 M133 112H260 M260 28V112 M292 112H360 M260 112V182" />
              <path d="M101 112V80A32 32 0 0 1 133 112 M154 95H189A35 35 0 0 1 154 130 M260 112V80A32 32 0 0 1 292 112" strokeWidth="1" />
              <path d="M16 22V188 M10 22H22 M10 188H22 M34 202H366 M34 196V208 M366 196V208" strokeWidth="0.75" />
            </svg>
          </div>

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_20%,var(--mist)_95%)]" />

          <div className="absolute right-3 bottom-6 w-[calc(100%-1.5rem)] max-w-80 sm:right-6 sm:bottom-7">
            <div className="flex min-h-12 items-center gap-2.5 rounded-full border bg-background px-3.5 shadow-[0_8px_28px_-12px_rgba(0,39,36,0.2)] sm:px-4">
              <span className={`${styles.dot} size-1.5 shrink-0 rounded-full bg-signal`} />
              <span className="min-w-0 flex-1 text-[13px] leading-5 font-medium text-primary">{alwaysOn.following}</span>
              <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-secondary text-center text-xs leading-6 text-primary tabular-nums">
                <span className={`${styles.count} block`}>
                  {alwaysOn.counts.map((count) => <span key={count} className="block h-6">{count}</span>)}
                </span>
              </span>
            </div>

            <div className="ml-[1.05rem] border-l border-primary/10 pt-3 pl-5">
              <ul className="space-y-3">
                {alwaysOn.items.map((item, index) => {
                  const Icon = itemIcons[index];
                  return (
                    <li key={item} className={`${styles.arrival} ${arrivalClasses[index]} flex items-center gap-2.5 text-xs leading-5 text-muted-foreground sm:text-[13px]`}>
                      <Icon className="size-3.5 shrink-0" strokeWidth={1.5} />
                      <span>{item}</span>
                    </li>
                  );
                })}
              </ul>
              <div className={`${styles.arrival} ${styles.review} mt-4 flex items-center gap-2.5 border-t pt-3 text-[13px] leading-5 text-primary`}>
                <CornerDownRight className="size-3.5 shrink-0" strokeWidth={1.5} />
                <span>{alwaysOn.reviewNote}</span>
              </div>
            </div>
          </div>
        </div>

        <figcaption className="mt-4 text-xs text-muted-foreground">
          {alwaysOn.exampleLabel}
          <span className="sr-only"> {alwaysOn.accessibleDescription}</span>
        </figcaption>
      </figure>
    </section>
  );
}
