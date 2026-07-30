import React, {useState} from 'react'
import WishlistIcon from '../WishlistIcon'
import type { Product } from '../../data/products'

export default function ProductCard({product, onQuickView, onAddToCart}:{product:Product; onQuickView:(p:Product)=>void; onAddToCart:(p:Product)=>void}){
  const [hover, setHover] = useState(false)
  const [wish, setWish] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden group flex flex-col">
      <div 
        onMouseEnter={()=>setHover(true)}
        onMouseLeave={()=>setHover(false)}
        onClick={()=>onQuickView(product)}
        className="relative w-full h-64 bg-gray-50 cursor-pointer flex items-center justify-center p-2"
      >
        <img
          src={hover ? product.images[1] ?? product.images[0] : product.images[0]}
          alt={product.title}
          className="max-w-full max-h-full object-contain"
        />
        <div className="absolute top-3 right-3 z-10">
          <WishlistIcon filled={wish} onClick={() => setWish(!wish)} />
        </div>
        
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button 
            onClick={()=>onQuickView(product)} 
            className="bg-white/90 backdrop-blur-sm text-[#48634A] px-6 py-2 rounded-full text-sm font-semibold shadow-md hover:scale-105 hover:bg-white transition-all transform"
          >
            Quick View
          </button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-[#48634A] text-base truncate">{product.title}</h3>
        <p className="mt-2 text-[#48634A] font-bold text-2xl">₹{product.price.toFixed(2)}</p>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <button 
            onClick={()=>onAddToCart(product)} 
            className="bg-[#48634A] text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-opacity-90 transition-colors"
          >
            Add to cart
          </button>
          <select className="text-sm rounded-md border border-[#48634A] px-3 py-2 text-gray-700 bg-white focus:ring-1 focus:ring-[#48634A]">
            <option>Options</option>
          </select>
        </div>
      </div>
    </div>
  )
}
