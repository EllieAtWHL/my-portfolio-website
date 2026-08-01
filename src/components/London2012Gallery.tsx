'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SlideData {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

const slides: SlideData[] = [
  {
    src: '/london-2012/ocDressingRoom.jpg',
    alt: 'In the dressing room for the Opening Ceremony',
    caption: 'In the dressing room for the Opening Ceremony',
    width: 2048,
    height: 1536
  },
  {
    src: '/london-2012/ocPreShow.jpg',
    alt: 'Outside the stadium prior to the Opening Ceremony',
    caption: 'Outside the stadium prior to the Opening Ceremony',
    width: 960,
    height: 720
  },
  {
    src: '/london-2012/torDrummer.jpg',
    alt: 'Drumming on the Tor during the 2nd Technical Rehearsal',
    caption: 'Drumming on the Tor during the 2nd Technical Rehearsal',
    width: 960,
    height: 540
  },
  {
    src: '/london-2012/underRings.jpg',
    alt: 'We "made" the Olympic Rings!',
    caption: 'We "made" the Olympic Rings!',
    width: 1436,
    height: 902
  },
  {
    src: '/london-2012/torDrummers.jpg',
    alt: 'The Tor Drummers',
    caption: 'The Tor Drummers',
    width: 594,
    height: 395
  },
  {
    src: '/london-2012/sideRings.jpg',
    alt: 'The rings forming during the 2nd Technical Rehearsal',
    caption: 'The rings forming during the 2nd Technical Rehearsal',
    width: 960,
    height: 540
  },
  {
    src: '/london-2012/parade1.jpg',
    alt: 'The "sheepdog" drummers in their pen',
    caption: 'The "sheepdog" drummers in their pen',
    width: 2048,
    height: 1362
  },
  {
    src: '/london-2012/parade2.jpg',
    alt: 'Following Team GB',
    caption: 'Following Team GB',
    width: 960,
    height: 639
  },
  {
    src: '/london-2012/ccDressingRoom.jpg',
    alt: 'In the dressing room for the Closing Ceremony',
    caption: 'In the dressing room for the Closing Ceremony',
    width: 720,
    height: 960
  },
  {
    src: '/london-2012/ccDressSign.jpg',
    alt: 'Waiting backstage at the rehearsal the morning of the Closing Ceremony',
    caption: 'Waiting backstage at the rehearsal the morning of the Closing Ceremony',
    width: 720,
    height: 960
  },
  {
    src: '/london-2012/DannyKristian.jpg',
    alt: 'With Olympic bronze medalists Danny Purvis and Kristian Thomas',
    caption: 'With Olympic bronze medalists Danny Purvis and Kristian Thomas',
    width: 960,
    height: 720
  },
  {
    src: '/london-2012/Louis.jpg',
    alt: 'With Olympic bronze medalist Louis Smith',
    caption: 'With Olympic bronze medalist Louis Smith',
    width: 720,
    height: 960
  },
  {
    src: '/london-2012/ccShowOver.jpg',
    alt: 'The End of the Closing Ceremony',
    caption: 'The End of the Closing Ceremony',
    width: 960,
    height: 720
  }
];

export default function London2012Gallery() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="london-2012-gallery">
      <h2 className="heading-2">Image Gallery</h2>
      
      <div className="relative slideshow-container">
        <div className="relative h-[50vh] w-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div
                className="relative h-full w-auto max-w-full overflow-hidden rounded-lg"
                style={{ aspectRatio: `${slide.width} / ${slide.height}` }}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
                  <div className="text-sm mb-1">{index + 1} / {slides.length}</div>
                  <div className="text-base">{slide.caption}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 dark:bg-dark-text dark:text-dark-text-darker dark:hover:bg-dark-text transition-all"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 dark:bg-dark-text dark:text-dark-text-darker dark:hover:bg-dark-text transition-all"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dot navigation */}
      <div className="flex justify-center mt-4 space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-brand-dark dark:bg-dark-accent'
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
