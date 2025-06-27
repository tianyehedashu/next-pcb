'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

const slides = [
  {
    id: 1,
    image: "/home/SpeedxPCB-bg1.png",
    title: "Fast PCB Flow, Flexible to Grow，Reliable as Pro",
     link: "/quote2",
    buttonText: "Get Instant Quote"
  },
  {
    id: 2,
    image: "/home/SpeedxPCB-bg2.png",
    title: "Professional SMT Assembly",
    description: "Complete turnkey solutions with component sourcing, assembly and testing services.",
    link: "/services",
    buttonText: "Explore Services"
  },
  {
    id: 3,
    image: "/home/SpeedxPCB-bg3.png",

    link: "/about",
    buttonText: "Why Choose Us"
  }
];

export function Carousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] xl:h-[80vh] overflow-hidden z-0">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container flex">
          {slides.map((slide) => (
            <div 
              key={slide.id} 
              className="embla__slide flex-[0_0_100%] min-w-0 relative h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] xl:h-[80vh]"
              style={{
                backgroundImage: `url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div className="absolute inset-0 bg-black/30 sm:bg-black/25 flex items-center">
                <div className="container mx-auto px-12 sm:px-16 lg:px-20 pt-16 sm:pt-20 lg:pt-24">
                  <div className="max-w-xl sm:max-w-2xl text-white">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 animate-in slide-in-from-left-6 duration-700 leading-tight">{slide.title}</h2>
                    {slide.description && (
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 animate-in slide-in-from-left-8 duration-700 delay-200 leading-relaxed opacity-90">{slide.description}</p>
                    )}
                    <div className="animate-in slide-in-from-left-8 duration-700 delay-500">
                      <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4" asChild>
                        <Link href={slide.link}>
                          {slide.buttonText}
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={scrollPrev}
        className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-1.5 sm:p-2 md:p-3 rounded-full transition-all duration-200 backdrop-blur-sm border border-white/20 z-10"
        aria-label="Previous slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-1.5 sm:p-2 md:p-3 rounded-full transition-all duration-200 backdrop-blur-sm border border-white/20 z-10"
        aria-label="Next slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* 轮播图指示器 */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
              index === selectedIndex 
                ? 'bg-white scale-110 shadow-lg' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 