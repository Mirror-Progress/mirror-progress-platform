'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import gsap from 'gsap';

/* ──────────────────────────────────────────────────────────── */
/* ▸ Types & helpers                                           */
/* ──────────────────────────────────────────────────────────── */
export type WorkKind = 'project' | 'blog' | 'research' | 'news';

export interface WorkItem {
  id: string;
  title: string;
  kind: string;
  excerpt: string;
  body: string;
  images: string[];
}

const ALL = 'All' as const;
type Filter = WorkKind | typeof ALL;

const slug = (k: string): WorkKind =>
  k.trim().toLowerCase() as WorkKind;

/* ──────────────────────────────────────────────────────────── */
/* ▸ Header (filters)                                          */
/* ──────────────────────────────────────────────────────────── */
function WorksHeader({
  counts,
  active,
  onSelect,
}: {
  counts: Record<Filter, number>;
  active: Filter;
  onSelect: (f: Filter) => void;
}) {
  const kinds: Filter[] = [ALL, 'project', 'blog', 'research', 'news'];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const idx = kinds.indexOf(active);
      const next =
        e.key === 'ArrowRight'
          ? (idx + 1) % kinds.length
          : (idx - 1 + kinds.length) % kinds.length;
      onSelect(kinds[next]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active]);

  return (
    <header className="mb-12 flex flex-wrap gap-6">
      {kinds.map((k) => (
        <button
          key={k}
          role="tab"
          aria-selected={active === k}
          onClick={() => onSelect(k)}
          className={`
            group flex gap-1 text-sm font-medium transition-colors
            ${active === k ? 'text-white' : 'text-white/50 hover:text-white'}
          `}
        >
          <span className="uppercase">{k}</span>
          <span className="text-teal-300 group-hover:text-teal-200">
            {counts[k] ?? 0}
          </span>
        </button>
      ))}
    </header>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* ▸ Work Card (with tilt)                                     */
/* ──────────────────────────────────────────────────────────── */
function WorkCard({
  item,
  onClick,
}: {
  item: WorkItem;
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hero = item.images?.[0];

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(el, { rotateX: -y * 10, rotateY: x * 10, duration: 0.3 });
    };
    const leave = () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.3 });
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseleave', leave);
    };
  }, []);

  return (
    <article
      ref={cardRef}
      onClick={onClick}
      style={
        hero
          ? {
              backgroundImage: `url(${hero})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
      className="relative cursor-pointer rounded-2xl overflow-hidden border border-white/10 bg-white/10 p-6 backdrop-blur-sm shadow transition duration-300 hover:shadow-lg hover:-translate-y-1"
    >
      {hero && <span aria-hidden className="absolute inset-0 bg-black/50 backdrop-blur-sm" />}
      <div className="relative z-10">
        <p className="mb-1 text-xs uppercase tracking-wide text-teal-300">{slug(item.kind)}</p>
        <h3 className="text-xl font-semibold">{item.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-white/80">{item.excerpt}</p>
      </div>
    </article>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* ▸ Modal (full GSAP modal)                                   */
/* ──────────────────────────────────────────────────────────── */
function WorkModal({
  item,
  onClose,
}: {
  item: WorkItem;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.1 })
      .fromTo(panelRef.current, { y: 20, scale: 0.95, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' })
      .fromTo(contentRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 }, '-=0.3');
  }, []);

  const handleClose = () => {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(panelRef.current, { scale: 0.95, y: 20, opacity: 0, duration: 0.3, ease: 'power2.in' });
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.2 });
  };

  const nextImage = () => setCurrentImage((i) => (i + 1) % item.images.length);
  const prevImage = () => setCurrentImage((i) => (i - 1 + item.images.length) % item.images.length);

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center" role="dialog" aria-modal>
      <button
        ref={backdropRef}
        aria-label="Close modal"
        onClick={handleClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
      />
      <div
        ref={panelRef}
        className="relative m-4 h-[90svh] w-full max-w-5xl overflow-y-auto backdrop-blur-xl bg-white/70 text-black border border-white/30 shadow-lg rounded-2xl p-6"
      >
        <button
          aria-label="Close"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-black/10"
        >
          ✕
        </button>

        <div ref={contentRef}>
          {!!item.images.length && (
            <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg bg-black/5">
              <img
                src={item.images[currentImage]}
                alt={`${item.title} image ${currentImage + 1}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {item.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white">◀</button>
                  <button onClick={nextImage} className="absolute right-0 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white">▶</button>
                </>
              )}
            </div>
          )}
          {item.images.length > 1 && (
            <div className="flex justify-center gap-2 mb-6">
              {item.images.map((_, i) => (
                <span key={i} className={`h-2 w-2 rounded-full transition-all ${i === currentImage ? 'bg-black scale-110' : 'bg-black/30'}`} />
              ))}
            </div>
          )}
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-600">{slug(item.kind)}</p>
          <h2 className="mb-4 text-2xl font-bold">{item.title}</h2>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.body.replace(/\n/g, '<br />') }} />
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ──────────────────────────────────────────────────────────── */
/* ▸ Main Work section                                         */
/* ──────────────────────────────────────────────────────────── */
export default function Work() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [raw, setRaw] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>(ALL);

  useEffect(() => {
    fetch('/api/work')
      .then((r) => r.json())
      .then((data: WorkItem[]) => setRaw(data))
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(
    () => raw.map((i) => ({ ...i, kind: slug(i.kind) })),
    [raw]
  );

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      All: items.length,
      project: 0,
      blog: 0,
      research: 0,
      news: 0,
    };
    items.forEach((i) => {
      base[i.kind as WorkKind] += 1;
    });
    return base;
  }, [items]);

  const shown = useMemo(
    () => (filter === ALL ? items : items.filter((i) => i.kind === filter)),
    [items, filter]
  );

  const openId = searchParams.get('work');
  const current = useMemo(
    () => items.find((i) => i.id === openId) ?? null,
    [items, openId]
  );

  const open = useCallback(
    (id: string) => router.push(`${pathname}?work=${id}`, { scroll: false }),
    [router, pathname]
  );
  const close = useCallback(
    () => router.push(pathname, { scroll: false }),
    [router, pathname]
  );

  return (
    <section id="Work" className="min-h-screen bg-[#012727] text-white py-24 px-6 lg:px-12">
      <WorksHeader counts={counts} active={filter} onSelect={setFilter} />

      {loading ? (
        <p className="text-center">Loading work…</p>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((i) => (
            <WorkCard key={i.id} item={i} onClick={() => open(i.id)} />
          ))}
          {shown.length === 0 && (
            <p className="col-span-full text-center opacity-70">No items in this category …</p>
          )}
        </div>
      )}

      {current && <WorkModal key={current.id} item={current} onClose={close} />}
    </section>
  );
}
