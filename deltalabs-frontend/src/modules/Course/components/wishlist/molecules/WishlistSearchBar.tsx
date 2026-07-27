/**
 * WishlistSearchBar
 * Atomic Level: Molecule
 *
 * Search bar with top-right floating edit action button.
 */

import React from 'react';
import { SearchInput } from '@/components/theme/SearchInput';
import { Pencil } from 'lucide-react';

export interface WishlistSearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditClick?: () => void;
}

export const WishlistSearchBar: React.FC<WishlistSearchBarProps> = ({
  value,
  onChange,
  onEditClick
}) => {
  return (
    <div className="relative w-full flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <SearchInput 
          placeholder="Search" 
          value={value}
          onChange={onChange}
          className="w-full bg-white rounded-xl shadow-sm border-0 py-3"
        />
      </div>
      
      {/* Floating Action Button (Top Right aligned) */}
      <button 
        onClick={onEditClick}
        className="absolute right-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary-800 text-white shadow-sm hover:bg-primary-900 transition-colors"
        aria-label="Edit Wishlist"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );
};

export default WishlistSearchBar;
