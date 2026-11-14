import { useState, useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { Check, Package } from "lucide-react";
import { MembershipForm } from "./MembershipForm";


export function MembershipPlans() {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.1 });

  const handleChoosePlan = (plan: any) => {
    setSelectedPlan(plan);
    setShowForm(true);
    setTimeout(() => {
      const el = document.getElementById('membership-form-container') || document.getElementById('membership');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleBack = () => {
    setShowForm(false);
    setSelectedPlan(null);
    setTimeout(() => {
      const el = document.getElementById('membership');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };
  const plans = [
    {
      title: "Single Pickup Plan",
      regions: [
        { name: "U.P & Delhi NCR", price: "₹1,500" },
        { name: "Other States of India", price: "₹2,100" }
      ],
      features: [
        "One carton for storing used pooja materials at home shall be sent to you",
        "Weight of packed carton which you can give us should be upto 5kg",
        "Validity: 3 months",
        "You can even customise your gift box and select products worth Rs.600 from our catalogue"
      ],
      popular: false
    },
    {
      title: "Double Pickup Plan",
      regions: [
        { name: "U.P & Delhi NCR", price: "₹2,100" },
        { name: "Other States of India", price: "₹2,500" }
      ],
      features: [
        "Everything same as Single Pickup Plan",
        "Two cartons for storing used pooja materials at home shall be sent to you",
        "Weight of packed carton which you can give us should be upto 5kg",
        "Validity: 6 months"
      ],
      popular: true
    },
    {
      title: "Four Pickup Plan",
      regions: [
        { name: "U.P & Delhi NCR", price: "₹3,500" },
        { name: "Other States of India", price: "₹4,000" }
      ],
      features: [
        "Everything same as Single Pickup Plan",
        "Four cartons for storing used pooja materials",
        "Weight of packed carton which you can give us should be upto 5kg",
        "Validity: 12 months",
        "Priority pickup scheduling"
      ],
      popular: false
    }
  ];

  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 25,
      scale: 0.98,
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        delay: index * 0.12,
      },
    }),
  };

  if (showForm && selectedPlan) {
    return (
      <div id="membership-form-container">
        <MembershipForm plan={selectedPlan} onBack={handleBack} />
      </div>
    );
  }

  return (
    <section ref={sectionRef} className="py-16 relative overflow-hidden" style={{ backgroundColor: '#F7F4ED' }}>
      {/* Background Gradient Blobs */}
      <motion.div
        className="absolute top-1/4 -left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none bg-shape-1"
        style={{
          background: 'linear-gradient(135deg, #4A3F35 0%, #F3D55B 100%)',
          opacity: 0.07,
        }}
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none bg-shape-2"
        style={{
          background: 'linear-gradient(135deg, #F3D55B 0%, #4A3F35 100%)',
          opacity: 0.07,
        }}
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <style>{`
        .header-accent {
            width: 64px;
            height: 2px;
            background: linear-gradient(90deg, #4A3F35, #F3D55B, #4A3F35);
            margin: 0 auto 1.5rem;
        }
      `}</style>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={inView ? { width: "64px", opacity: 1 } : {}}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="header-accent"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="inline-block px-4 py-2 rounded-full mb-4" style={{ backgroundColor: '#F3D55B', color: '#4A3F35' }}>
              <span className="text-sm font-medium">Join Our Mission</span>
            </div>
            <h2 className="text-4xl mb-4 font-bold" style={{ color: '#4A3F35' }}>
              Annual Membership Plans - Pan India
            </h2>
            <p className="text-lg max-w-3xl mx-auto" style={{ color: '#333333' }}>
              Adopt our Membership plans, so that we can keep doing this work and establish a Circular Economy.
              Let's STOP the disrespect of POOJA NIRMALYA and see the Magic of Upcycling.
            </p>
            <p className="text-sm mt-4 italic" style={{ color: '#4A3F35' }}>
              Just give us a call whenever your carton is full & we'll schedule a pickup within a year
            </p>
          </motion.div>
        </div>

        {/* Membership Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              whileHover={{
                y: -5,
                boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 0 30px rgba(243, 213, 91, 0.3), 0 0 50px rgba(74, 63, 53, 0.15)'
              }}
              className="relative rounded-[20px] shadow-lg overflow-hidden flex flex-col"
              style={{
                backgroundColor: '#FFFFFF',
                border: plan.popular ? '4px solid #4A3F35' : '2px solid transparent',
                transition: 'box-shadow 0.3s ease-out',
              }}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 px-6 py-2 rounded-bl-[20px] z-10" style={{ backgroundColor: '#F3D55B', color: '#4A3F35' }}>
                  <span className="text-sm font-semibold">Most Popular</span>
                </div>
              )}

              <div className="p-8 flex flex-col flex-grow">
                {/* Plan Icon */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#F3D55B' }}>
                  <Package className="w-8 h-8" style={{ color: '#4A3F35' }} />
                </div>

                {/* Plan Title */}
                <h3 className="text-2xl mb-6 font-bold" style={{ color: '#4A3F35' }}>
                  {plan.title}
                </h3>

                {/* Pricing for Both Regions */}
                <div className="mb-6 space-y-3">
                  {plan.regions.map((region, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg p-4"
                      style={{ backgroundColor: '#C9C5BD' }}
                    >
                      <p className="text-sm mb-1 font-medium" style={{ color: '#333333' }}>{region.name}</p>
                      <p className="text-3xl font-bold" style={{ color: '#4A3F35' }}>{region.price}</p>
                      <p className="text-xs mt-1" style={{ color: '#666666' }}>(Inclusive of GST)</p>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: '#F3D55B' }}>
                        <Check className="w-3 h-3" style={{ color: '#4A3F35' }} />
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: '#333333' }}>{feature}</p>
                    </div>
                  ))}
                </div>

                {/* CTA Button - All cards have the same button */}
                <button
                  onClick={() => handleChoosePlan(plan)}
                  className="w-full py-3 rounded-[10px] font-semibold transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg mt-auto relative z-50 pointer-events-auto"
                  style={{
                    backgroundColor: '#F3D55B',
                    color: '#4A3F35',
                    boxShadow: '0 2px 8px rgba(74, 63, 53, 0.15)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E6C84A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3D55B';
                  }}
                >
                  Choose Plan
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="inline-block rounded-[20px] shadow-lg p-8 max-w-2xl" style={{ backgroundColor: '#FFFFFF' }}>
            <h4 className="text-xl mb-4 font-bold" style={{ color: '#4A3F35' }}>
              Nivaran is committed to promote Sustainability
            </h4>
            <p className="mb-4" style={{ color: '#333333' }}>
              We encourage women from less privileged background to acquire new skills and giving them opportunity to earn by this.
            </p>
            <p className="text-sm" style={{ color: '#4A3F35' }}>
              Need help choosing? Contact us for personalized assistance
            </p>
            <button
              onClick={() => {
                const section = document.getElementById('contact');
                section?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-6 px-8 py-3 rounded-[10px] transition-all duration-300 font-semibold shadow-md hover:shadow-lg hover:scale-[1.02]"
              style={{
                backgroundColor: '#F3D55B',
                color: '#4A3F35',
                boxShadow: '0 2px 8px rgba(74, 63, 53, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E6C84A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F3D55B';
              }}
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </section>
  );
}