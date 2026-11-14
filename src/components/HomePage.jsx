import React from 'react';
import { Header } from './Header.tsx';
import { HeroSlideshow } from "./HeroSlideshow.jsx";
import { FeatureIcons } from "./FeatureIcons";
import { CategoryShowcase } from "./CategoryShowcase";
import { InfoBlocks } from "./InfoBlocks";
import { WorkshopSection } from "./WorkshopSection.tsx";
import { MembershipPlans } from "./MembershipPlans";
import { SplitContentSection } from "./SplitContentSection";
import { FeaturedBanner } from "./FeaturedBanner";
import { Testimonials } from "./Testimonials";
import { BlogSection } from "./BlogSection";
import { ContactSection } from "./ContactSection";
import { Footer } from "./Footer";
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../utils/Router';
import { usePageSeo } from '../utils/usePageSeo';

const HomePage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { navigateTo } = useRouter();

  usePageSeo('/', {
    title: 'Nivaran Upcyclers | Handcrafted Sustainable & Eco-Friendly Products',
    description: 'Discover handcrafted, sustainable, and eco-friendly upcycled products, bags, stationery, home decor, and gifts from Nivaran Upcyclers.',
    canonical: 'https://www.nivaranupcyclers.com/'
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F8D548] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page for all users - authenticated users can still access it
  return (
    <div className="min-h-screen bg-white">
      {/* Header with Navigation */}
      <Header showCategories={true} />

      {/* Hero Slideshow */}
      <section id="hero">
        <HeroSlideshow />
      </section>

      {/* Feature Icons */}
      <FeatureIcons />

      {/* Category Showcase */}
      <CategoryShowcase />

      {/* Info Blocks */}
      <section id="about">
        <InfoBlocks />
      </section>

      {/* Workshop Section */}
      <section id="workshops">
        <WorkshopSection />
      </section>

      {/* Membership Plans */}
      <section id="membership">
        <MembershipPlans />
      </section>

      {/* Split Content Section */}
      <SplitContentSection />

      {/* Featured Banner */}
      <FeaturedBanner />

      {/* Testimonials */}
      <section id="testimonials">
        <Testimonials />
      </section>



      {/* Contact Section - Get In Touch & Pricing */}
      <section id="contact-info">
        <ContactSection />
      </section>

      {/* Blog Section - Latest Posts */}
      <section id="blog">
        <BlogSection />
      </section>

      {/* Footer */}
      <section id="contact">
        <Footer />
      </section>
    </div>
  );
};

export default HomePage;