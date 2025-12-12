import { useState } from 'react';

const galleryImages = [
  { id: 1, src: '/images/Gallery-1.jpg', alt: 'Classic haircut' },
  { id: 2, src: '/images/Gallery-4.jpg', alt: 'Beard trim' },
  { id: 3, src: '/images/Gallery-3.jpg', alt: 'Fade haircut' },
  { id: 4, src: '/images/Gallery-2.jpg', alt: 'Barbershop interior' },
  { id: 5, src: '/images/Gallery-5.jpg', alt: 'Styling' },
  { id: 6, src: '/images/Gallery-7.jpg', alt: 'Premium cut' },
];

const GallerySection = () => {
  return (
    <section id="gallery" className="section-padding bg-primary">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-primary-foreground/70 font-body text-sm tracking-[0.2em] uppercase mb-4">
            Gallery
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Galerie
          </h2>
          <div className="w-20 h-1 bg-primary-foreground mx-auto" />
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className={`aspect-square rounded-lg overflow-hidden group cursor-pointer ${
                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 md:group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* Instagram link */}
        <p className="text-center text-primary-foreground/60 mt-8 text-sm">
          Folgt uns auf{' '}
          <a
            href="https://www.instagram.com/rodelheimerbarbershop/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary-foreground hover:opacity-80 transition"
          >
            Instagram
          </a>
          , um mehr von unserer Arbeit zu sehen
        </p>
      </div>
    </section>
  );
};

export default GallerySection;