/**
 * SummarizedInfoCard
 * Atomic Level: Organism
 *
 * Displays the wishlist summary totals (items, time, budget) and CTAs.
 */

import React from 'react';
import { Calendar, ShoppingCart } from 'lucide-react';

export interface SummarizedInfoCardProps {
  totalItems: number;
  totalTimeDays: number;
  totalBudget: number;
  onViewPlanner?: () => void;
  onYourCart?: () => void;
}

export const SummarizedInfoCard: React.FC<SummarizedInfoCardProps> = ({
  totalItems,
  totalTimeDays,
  totalBudget,
  onViewPlanner,
  onYourCart,
}) => {
  return (
    <div className="w-full">
      <h3 className="text-center text-primary-800 font-medium mb-4">Summarized info</h3>
      
      <div className="bg-[#DCE3E6] rounded-xl p-6 shadow-sm">
        
        {/* Info Rows */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between border-b border-white/50 pb-2">
            <span className="text-sm text-primary-800 font-medium">Total items</span>
            <span className="text-sm text-primary-800 font-medium">{totalItems}</span>
          </div>
          
          <div className="flex items-center justify-between border-b border-white/50 pb-2">
            <span className="text-sm text-primary-800 font-medium">Total time required</span>
            <span className="text-sm text-primary-800 font-medium">{totalTimeDays} days</span>
          </div>
          
          <div className="flex items-center justify-between border-b border-white/50 pb-2">
            <span className="text-sm text-primary-800 font-medium">Total budget required</span>
            <span className="text-sm text-primary-800 font-medium">{totalBudget} Br</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-8">
          <button 
            onClick={onViewPlanner}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-800 hover:bg-primary-900 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
          >
            <Calendar className="w-4 h-4" />
            View planner
          </button>
          
          <button 
            onClick={onYourCart}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-800 hover:bg-primary-900 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Your cart
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default SummarizedInfoCard;
