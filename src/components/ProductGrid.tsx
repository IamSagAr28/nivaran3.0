import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProductGridProps {
  title?: string;
  subtitle?: string;
  columns?: number;
  itemCount?: number;
}

const products = [
  { name: "Upcycled Paper Notebook", price: "₹299", image: "https://images.unsplash.com/photo-1668893973066-95b14ce86e71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMG5vdGVib29rc3xlbnwxfHx8fDE3NjMwMzEyNTh8MA&ixlib=rb-4.1.0&q=80&w=1080" },
  { name: "Recycled Fabric Tote Bag", price: "₹449", image: "https://images.unsplash.com/photo-1758487424832-a53ae6cdefdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGhhbmRtYWRlJTIwYmFnc3xlbnwxfHx8fDE3NjMwMzEyNTd8MA&ixlib=rb-4.1.0&q=80&w=1080" },
  { name: "Eco-Friendly Planner", price: "₹399", image: "https://images.unsplash.com/photo-1666804830091-56ba0e22becf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWN5Y2xlZCUyMHBhcGVyJTIwcHJvZHVjdHN8ZW58MXx8fHwxNzYzMDMxMjU3fDA&ixlib=rb-4.1.0&q=80&w=1080" },
  { name: "Handmade Paper Gift Box", price: "₹199", image: "https://images.unsplash.com/photo-1633878353628-5fc8b983325c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY28lMjBmcmllbmRseSUyMHByb2R1Y3RzfGVufDF8fHx8MTc2MzAxMDc4OHww&ixlib=rb-4.1.0&q=80&w=1080" },
  { name: "Upcycled Denim Wallet", price: "₹349", image: "https://images.unsplash.com/photo-1665702860632-4dfcd4b2d869?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGZhc2hpb24lMjBhY2Nlc3Nvcmllc3xlbnwxfHx8fDE3NjMwMzEyNTh8MA&ixlib=rb-4.1.0&q=80&w=1080" },
  { name: "Recycled Paper Journal", price: "₹329", image: "https://images.unsplash.com/photo-1668893973066-95b14ce86e71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMG5vdGVib29rc3xlbnwxfHx8fDE3NjMwMzEyNTh8MA&ixlib=rb-4.1.0&q=80&w=1080" },
  { name: "Sustainable Coin Pouch", price: "₹179", image: "https://images.unsplash.com/photo-1610177498701-4f00c0bd1694?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWN5Y2xpbmclMjBjcmFmdHN8ZW58MXx8fHwxNzYzMDMxMjU5fDA&ixlib=rb-4.1.0&q=80&w=1080" },
  { name: "Handcrafted Pen Holder", price: "₹249", image: "https://images.unsplash.com/photo-1633878353628-5fc8b983325c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY28lMjBmcmllbmRseSUyMHByb2R1Y3RzfGVufDF8fHx8MTc2MzAxMDc4OHww&ixlib=rb-4.1.0&q=80&w=1080" },
  { name: "Eco Laptop Sleeve", price: "₹599", image: "https://images.unsplash.com/photo-1758487424832-a53ae6cdefdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGhhbmRtYWRlJTIwYmFnc3xlbnwxfHx8fDE3NjMwMzEyNTd8MA&ixlib=rb-4.1.0&q=80&w=1080" },
  { name: "Recycled Paper Cards Set", price: "₹149", image: "https://images.unsplash.com/photo-1666804830091-56ba0e22becf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWN5Y2xlZCUyMHBhcGVyJTIwcHJvZHVjdHN8ZW58MXx8fHwxNzYzMDMxMjU3fDA&ixlib=rb-4.1.0&q=80&w=1080" },
];

export function ProductGrid({ title = "Featured Products", subtitle = "Handcrafted with love, sustainable by design", columns = 5, itemCount = 10 }: ProductGridProps) {
  const displayProducts = products.slice(0, itemCount);
  
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl mb-2 text-[#344e41]">{title}</h2>
          <p className="text-[#3a5a40]">{subtitle}</p>
        </div>

        {/* Product Grid */}
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${columns} gap-6`}>
          {displayProducts.map((product, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="aspect-square bg-[#dad7cd]/30 rounded-lg mb-3 overflow-hidden">
                {/* REPLACE WITH YOUR PRODUCT IMAGE */}
                {/* Example: import productImage from "figma:asset/YOUR_IMAGE_HASH.png"; */}
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm text-[#344e41]">{product.name}</h3>
                <p className="text-[#588157]">{product.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-8 text-center">
          <button className="px-8 py-3 border-2 border-[#588157] text-[#588157] hover:bg-[#588157] hover:text-white rounded-lg transition-colors">
            View All Products
          </button>
        </div>
      </div>
    </section>
  );
}
