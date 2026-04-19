import { useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { useShopCart } from "../contexts/ShopCartContext";
import { useRouter } from "../utils/Router";

export function MembershipForm({ plan, onBack }: { plan: any, onBack: () => void }) {
    const { addToCart } = useShopCart();
    const { navigateTo } = useRouter();
    
    const [selectedState, setSelectedState] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStateSelect = (state: string) => {
        setSelectedState(state);
    };

    const getSelectedPrice = () => {
        if (!plan || !selectedState) return '';
        const region = plan.regions.find((r: any) => r.name === selectedState);
        return region ? region.price : '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedState) {
            alert('Please select a region.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Price is formatted like "₹1,500". Extract the numeric value.
            const rawPrice = getSelectedPrice().replace(/[^\d]/g, '');
            const price = parseInt(rawPrice, 10);

            // Add Membership to our local shop cart
            addToCart({
                id: `membership_${btoa(plan.title).substring(0, 10)}_${btoa(selectedState).substring(0, 5)}`,
                title: `${plan.title}`,
                price: price,
                image: '', // Can be empty or a generic box icon URL
                category: 'Membership',
                material: `Region: ${selectedState}`,
                quantity: 1
            });

            // Redirect to Checkout immediately
            setTimeout(() => navigateTo('/shop-cart'), 100);

        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to proceed to cart. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-16 relative z-10">
            <div className="max-w-2xl mx-auto" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '2rem' }}>
                <button onClick={onBack} className="text-sm font-semibold mb-4" style={{ color: '#4A3F35' }}>
                    &larr; Back to Plans
                </button>
                <div className="p-6 border-b" style={{ borderColor: '#E5E5E5', backgroundColor: '#F7F4ED' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">📦</span>
                        <h4 className="text-lg font-bold" style={{ color: '#4A3F35' }}>
                            {plan.title}
                        </h4>
                    </div>
                    <p className="text-sm mb-3" style={{ color: '#333333' }}>
                        {plan.features[0]}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: '#4A3F35' }}>Price:</span>
                        <span className="text-xl font-bold" style={{ color: '#4A3F35' }}>
                            {selectedState ? getSelectedPrice() : 'Select region to see price'}
                            {selectedState && <span className="text-xs font-normal ml-1 text-gray-600">(Inclusive of GST)</span>}
                        </span>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <MapPin className="w-5 h-5" style={{ color: '#4A3F35' }} />
                            <h4 className="text-lg font-semibold" style={{ color: '#4A3F35' }}>
                                Which region do you belong to?
                            </h4>
                        </div>

                        <div className="space-y-4">
                            {plan?.regions.map((region: any, idx: number) => (
                                <button
                                    type="button"
                                    key={idx}
                                    onClick={() => handleStateSelect(region.name)}
                                    className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${selectedState === region.name
                                        ? 'border-[#4A3F35] shadow-md'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    style={{
                                        backgroundColor: selectedState === region.name ? '#F7F4ED' : '#FFFFFF',
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedState === region.name ? 'border-[#4A3F35]' : 'border-gray-300'
                                                }`}>
                                                {selectedState === region.name && (
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4A3F35' }} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold" style={{ color: '#4A3F35' }}>
                                                    {region.name}
                                                </p>
                                                <p className="text-sm" style={{ color: '#666666' }}>
                                                    {region.price}
                                                </p>
                                            </div>
                                        </div>
                                        <Navigation className="w-5 h-5" style={{ color: selectedState === region.name ? '#4A3F35' : '#999999' }} />
                                    </div>
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex gap-4 mt-8">
                            <button
                                type="submit"
                                disabled={isSubmitting || !selectedState}
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-[10px] font-bold text-lg transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: '#F3D55B',
                                    color: '#4A3F35',
                                    boxShadow: '0 2px 8px rgba(74, 63, 53, 0.15)'
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Adding to Cart...
                                    </>
                                ) : (
                                    'Proceed to Cart'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
