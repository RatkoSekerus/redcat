import React from 'react';
import { Product } from '../types';
import { ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100 flex flex-col h-full">
      <div className="h-48 bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <ShoppingBag className="w-16 h-16 text-red-400 opacity-50" />
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800 leading-tight">{product.name}</h3>
          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded ml-2 whitespace-nowrap">
            {product.size}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4 flex-grow">{product.description}</p>
        <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-100">
          <span className="text-xl font-bold text-red-600">{product.price.toLocaleString('sr-RS')} RSD</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
