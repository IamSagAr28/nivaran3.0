import { useState, useEffect } from 'react';
import { useRouter } from '../utils/Router';
import { fetchHeroSlides } from '../utils/shopApi';

export function HeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const defaultSlides = [
    {
      image: "/images/hero/hero1.jpg",
      tag: "Sustainable Living Made Beautiful",
      title: "Transforming Waste into",
      highlight: "Wonderful Products",
      description: "Discover our collection of handcrafted, eco-friendly products made from upcycled materials.",
      primaryCTA: "Shop Now",
      secondaryCTA: "Learn More"
    },
    {
      image: "/images/hero/hero2.jpg",
      tag: "Handcrafted Excellence",
      title: "Every Product Tells",
      highlight: "A Story",
      description: "Supporting local artisans while promoting environmental consciousness.",
      primaryCTA: "Explore Collection",
      secondaryCTA: "Our Story"
    },
    {
      image: "/images/hero/hero3.jpg",
      tag: "Join the Movement",
      title: "Building a",
      highlight: "Circular Economy",
      description: "Each purchase contributes to a sustainable future and empowers local communities.",
      primaryCTA: "Get Started",
      secondaryCTA: "Join Workshop"
    },
    {
      image: "/images/hero/hero4.jpg",
      tag: "New Arrivals",
      title: "Freshly Crafted",
      highlight: "Just For You",
      description: "Check out the latest additions to our sustainable collection.",
      primaryCTA: "Shop New",
      secondaryCTA: "See What's New"
    },
    {
      image: "/images/hero/hero5.jpg",
      tag: "Gifts That Give Back",
      title: "Meaningful Presents",
      highlight: "For Every Occasion",
      description: "Find the perfect eco-friendly gift that makes a difference.",
      primaryCTA: "Browse Gifts",
      secondaryCTA: "Gifting Guide"
    },
    {
      image: "/images/hero/hero6.jpg",
      tag: "Our Commitment",
      title: "Sustainability in",
      highlight: "Every Stitch",
      description: "Learn about our process and our dedication to a greener planet.",
      primaryCTA: "Our Process",
      secondaryCTA: "Learn More"
    }
  ];

  const [slides, setSlides] = useState(defaultSlides);

  useEffect(() => {
    fetchHeroSlides()
      .then((data) => {
        if (Array.isArray(data.slides) && data.slides.length > 0) {
          setSlides(data.slides.map((s) => ({
            image: s.image,
            tag: s.tag || '',
            title: s.title || '',
            highlight: s.highlight || '',
            description: s.description || '',
            primaryCTA: s.primary_cta || 'Shop Now',
            secondaryCTA: s.secondary_cta || 'Learn More'
          })));
        }
      })
      .catch(() => {});
  }, []);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  const { navigateTo, currentPath } = useRouter();

  const navigateToSection = (sectionId) => {
    if (currentPath !== '/') {
      navigateTo('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrimaryCTA = (slideIndex) => {
    const title = slides[slideIndex]?.primaryCTA?.toLowerCase() || '';
    if (title.includes('shop') || title.includes('explore') || title.includes('get started')) {
      navigateTo('/products');
      return;
    }
    navigateTo('/products');
  };

  const handleSecondaryCTA = (slideIndex) => {
    const cta = slides[slideIndex]?.secondaryCTA?.toLowerCase() || '';
    if (cta.includes('learn') || cta.includes('mission') || cta.includes('about')) {
      navigateToSection('about');
      return;
    }
    if (cta.includes('our story') || cta.includes('our-story')) {
      navigateToSection('our-story');
      return;
    }
    if (cta.includes('join workshop') || cta.includes('workshop')) {
      navigateToSection('workshops');
      return;
    }
    navigateTo('/');
  };

  const currentSlideData = slides[currentSlide];

  return (
    <section style={{
      width: '100%',
      height: '1010px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Images */}
      {slides.map((slide, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#2A2A2A', // Fallback color
            backgroundImage: `url(${slide.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: index === currentSlide ? 1 : 0,
            transition: 'opacity 0.7s ease-in-out',
            transform: index === currentSlide ? 'scale(1)' : 'scale(1.05)'
          }}
        />
      ))}

      {/* Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to right, rgba(42, 42, 42, 0.4), rgba(42, 42, 42, 0.5))',
        zIndex: 1
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        zIndex: 2
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px',
          width: '100%'
        }}>
          <div style={{ maxWidth: '672px' }}>
            {/* Tag */}
            <div
              key={`tag-${currentSlide}`}
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#F8D548',
                color: '#2A2A2A',
                borderRadius: '9999px',
                fontSize: '14px',
                marginBottom: '24px',
                opacity: 0,
                transform: 'translateY(20px)',
                animation: 'fadeInUp 0.6s ease-out 0s forwards'
              }}
            >
              {currentSlideData.tag}
            </div>

            {/* Title */}
            <h1
              key={`title-${currentSlide}`}
              style={{
                fontSize: '48px',
                lineHeight: '1.2',
                fontWeight: '600',
                margin: '0 0 24px 0',
                color: 'white',
                opacity: 0,
                transform: 'translateY(20px)',
                animation: 'fadeInUp 0.6s ease-out 0.1s forwards'
              }}
            >
              {currentSlideData.title}{' '}
              <span style={{ color: '#F8D548' }}>{currentSlideData.highlight}</span>
            </h1>

            {/* Description */}
            <p
              key={`desc-${currentSlide}`}
              style={{
                fontSize: '18px',
                color: '#FFF6D1',
                marginBottom: '32px',
                lineHeight: '1.6',
                opacity: 0,
                transform: 'translateY(20px)',
                animation: 'fadeInUp 0.6s ease-out 0.2s forwards'
              }}
            >
              {currentSlideData.description}
            </p>

            {/* Buttons */}
            <div
              key={`cta-${currentSlide}`}
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                opacity: 0,
                transform: 'translateY(20px)',
                animation: 'fadeInUp 0.6s ease-out 0.3s forwards'
              }}
            >
              <button style={{
                padding: '12px 32px',
                backgroundColor: '#F8D548',
                color: '#2A2A2A',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
                onClick={() => handlePrimaryCTA(currentSlide)}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#DBB520';
                  e.target.style.color = '#2A2A2A';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#F8D548';
                  e.target.style.color = '#2A2A2A';
                  e.target.style.transform = 'scale(1)';
                }}>
                {currentSlideData.primaryCTA}
              </button>
              <button style={{
                padding: '12px 32px',
                backgroundColor: 'transparent',
                color: 'white',
                border: '2px solid white',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
                onClick={() => handleSecondaryCTA(currentSlide)}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = '#DBB520';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = 'white';
                }}>
                {currentSlideData.secondaryCTA}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '48px',
          height: '48px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          color: '#DBB520',
          zIndex: 3,
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.transform = 'translateY(-50%) scale(1.1)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          e.target.style.transform = 'translateY(-50%) scale(1)';
        }}
      >
        &#8249;
      </button>

      <button
        onClick={nextSlide}
        style={{
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '48px',
          height: '48px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          color: '#DBB520',
          zIndex: 3,
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.transform = 'translateY(-50%) scale(1.1)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          e.target.style.transform = 'translateY(-50%) scale(1)';
        }}
      >
        &#8250;
      </button>

      {/* Dot Indicators */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        zIndex: 3
      }}>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            style={{
              width: index === currentSlide ? '32px' : '12px',
              height: '12px',
              backgroundColor: index === currentSlide ? '#F8D548' : 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              if (index !== currentSlide) {
                e.target.style.backgroundColor = 'white';
              }
            }}
            onMouseOut={(e) => {
              if (index !== currentSlide) {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          />
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}