"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CarouselSlide } from "@/types/carousel";

type Props = {
  slides: CarouselSlide[];
  loading: boolean;
};

export function HeroCarousel({ slides, loading }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay || slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, slides.length]);

  if (loading) {
    return (
      <div className="w-full rounded-2xl bg-base-100 p-2 shadow-2xl border border-base-300">
        <div className="aspect-video rounded-xl overflow-hidden flex items-center justify-center bg-base-200">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="w-full rounded-2xl bg-base-100 p-2 shadow-2xl border border-base-300">
        <div className="aspect-video rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="text-center">
            <p className="text-base-content/60">Belum ada carousel slide</p>
          </div>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className="w-full rounded-2xl bg-base-100 p-2 shadow-2xl border border-base-300">
      <div
        className="aspect-video rounded-xl overflow-hidden relative bg-base-200 group"
        onMouseEnter={() => setAutoPlay(false)}
        onMouseLeave={() => setAutoPlay(true)}
      >
        {/* Slide Image */}
        {currentSlide.imageUrl ? (
          <Image
            src={currentSlide.imageUrl}
            alt={currentSlide.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <p className="text-base-content/60">No image</p>
          </div>
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <h2 className="text-2xl font-bold text-white mb-2">{currentSlide.title}</h2>
          <p className="text-sm text-white/90 line-clamp-2">{currentSlide.description}</p>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-sm btn-circle btn-ghost text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ❮
        </button>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-sm btn-circle btn-ghost text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ❯
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? "w-8 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
