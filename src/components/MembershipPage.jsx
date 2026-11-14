import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MembershipPlans } from './MembershipPlans';
import { usePageSeo } from '../utils/usePageSeo';

const MembershipPage = () => {
  usePageSeo('/membership', {
    title: 'Annual Membership Plans | Nivaran Upcyclers',
    description: 'Join the Nivaran Upcyclers membership community for exclusive eco-friendly gifts, quarterly green rewards, and workshop discounts.',
    canonical: 'https://www.nivaranupcyclers.com/membership'
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#3a5a40] mb-4">Become a Member</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join the Nivaran community to unlock exclusive benefits, early access to products, and special discounts.
            </p>
          </div>
          <MembershipPlans />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MembershipPage;
