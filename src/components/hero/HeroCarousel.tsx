"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HeroSlide } from "@/types";

const AUTOPLAY_MS = 6000;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInView, setIsInView] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Suspend the autoplay loop when the carousel scrolls out of the viewport
  // to preserve battery/CPU on mobile (FRD 4.1).
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0.2,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || slides.length < 2) return;
    const timer = setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isInView, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      ref={containerRef}
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      className="relative h-[70vh] min-h-[460px] w-full overflow-hidden rounded-b-[2.5rem] bg-brand-deep-dark"
    >
      <div
        className="flex h-full w-full transition-transform duration-[900ms] ease-[var(--ease-brand)]"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide._id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
            aria-hidden={index !== activeIndex}
            className="relative h-full w-full shrink-0 overflow-hidden"
          >
            <Image
              src={slide.imageUrl}
              alt={slide.imageAlt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-deep-dark/85 via-brand-deep-dark/25 to-transparent" />
            <div className="relative flex h-full max-w-6xl flex-col justify-end gap-5 px-6 pb-20 mx-auto text-brand-cream">
              <span className="section-eyebrow text-brand-gold">Today&apos;s highlight</span>
              <h1 className="max-w-xl text-4xl font-bold leading-tight md:text-5xl">{slide.headline}</h1>
              {slide.subheadline ? <p className="max-w-lg text-lg text-brand-cream/90">{slide.subheadline}</p> : null}
              {slide.ctaLabel && slide.ctaHref ? (
                <Link
                  href={slide.ctaHref}
                  className="group mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-brand-gold px-7 py-3.5 font-semibold text-brand-deep-dark shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-gold-dark hover:shadow-xl"
                >
                  {slide.ctaLabel}
                  <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-7 right-7 flex gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide._id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === activeIndex}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === activeIndex ? "w-8 bg-brand-gold" : "w-2.5 bg-brand-cream/50 hover:bg-brand-cream/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
