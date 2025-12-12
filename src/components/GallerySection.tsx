import { useState } from 'react';

const galleryImages = [
  { id: 1, alt: 'Classic haircut' },
  { id: 2, alt: 'Beard trim' },
  { id: 3, alt: 'Fade haircut' },
  { id: 4, alt: 'Barbershop interior' },
  { id: 5, alt: 'Styling' },
  { id: 6, alt: 'Premium cut' },
];

const GallerySection = () => {
  return (
    <section id="galeria" className="section-padding bg-primary">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-primary-foreground/70 font-body text-sm tracking-[0.2em] uppercase mb-4">
            Unsere Arbeit
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Galeria
          </h2>
          <div className="w-20 h-1 bg-primary-foreground mx-auto" />
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className={`aspect-square bg-primary-foreground/10 rounded-lg overflow-hidden group cursor-pointer ${
                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <div className="w-full h-full bg-gradient-to-br from-primary-foreground/20 to-primary-foreground/5 flex items-center justify-center group-hover:from-primary-foreground/30 group-hover:to-primary-foreground/10 transition-all duration-300">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-primary-foreground/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-primary-foreground/50 text-xs font-medium">{image.alt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-primary-foreground/60 mt-8 text-sm">
          Siga-nos no Instagram para ver mais trabalhos
        </p>
      </div>
    </section>
  );
};

export default GallerySection;
