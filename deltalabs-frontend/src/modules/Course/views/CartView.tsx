import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Typography } from '@/components/theme';
import { ResourceSidebar, ResourceSidebarTabId } from '@/components/organisms/ResourceSidebar';
import { CartItem, CartItemProps } from '@/components/molecules/CartItem';
import { CartSummary } from '@/components/organisms/CartSummary';
import { ResourceManagementLayout } from '@/components/templates/ResourceManagementLayout';
import { cx } from '@/components/theme/utils';

export interface CartViewProps {
  activeSidebarTab: ResourceSidebarTabId;
  onSidebarTabChange: (tabId: ResourceSidebarTabId) => void;
}

export const CartView: React.FC<CartViewProps> = ({
  activeSidebarTab,
  onSidebarTabChange,
}) => {
  const [cartItems, setCartItems] = useState<CartItemProps[]>([
    {
      id: '1',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      batteryLife: '75% battery life',
      itemsLeft: 2,
      rating: 4.8,
      reviewCount: 65,
      price: '680br',
      quantity: 0,
      onUpdateQuantity: () => {},
      onRemove: () => {},
    },
    {
      id: '2',
      title: 'IPS LCD Gaming Monitor',
      image: '/safety_goggles.png',
      batteryLife: '75% battery life',
      itemsLeft: 2,
      rating: 4.8,
      reviewCount: 65,
      price: '1250br',
      quantity: 0,
      onUpdateQuantity: () => {},
      onRemove: () => {},
    },
    {
      id: '3',
      title: 'IPS LCD Gaming Monitor',
      image: '/laboratory_glass.png',
      batteryLife: '75% battery life',
      itemsLeft: 2,
      rating: 4.8,
      reviewCount: 65,
      price: '450br',
      quantity: 0,
      onUpdateQuantity: () => {},
      onRemove: () => {},
    },
    {
      id: '4',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_2.png',
      batteryLife: '75% battery life',
      itemsLeft: 2,
      rating: 4.8,
      reviewCount: 65,
      price: '680br',
      quantity: 0,
      onUpdateQuantity: () => {},
      onRemove: () => {},
    }
  ]);

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleRemove = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = "91,102 ETB"; // Mock total as in image

  return (
    <ResourceManagementLayout
      sidebar={
        <ResourceSidebar 
          activeTab={activeSidebarTab} 
          onTabChange={onSidebarTabChange} 
        />
      }
      header={
        <div className="flex items-center justify-between">
          <Typography variant="h1" className="text-[32px] font-bold text-[#174A5F]">
            Cart
          </Typography>
        </div>
      }
      rightSidebar={
        <CartSummary 
          totalQuantity={totalQuantity}
          totalPrice={totalPrice}
          onContinueToPayment={() => console.log('Continue to payment')}
          onFindSponsor={() => console.log('Find sponsor')}
          onGroupPurchase={() => console.log('Group purchase')}
        />
      }
    >
      <div className="space-y-8">
        {/* Search */}
        <div className="flex justify-center pt-2">
          <div className="w-full max-w-[520px] h-12 bg-[#F8FAFC] border border-[#174A5F]/10 rounded-xl flex items-center overflow-hidden focus-within:border-[#174A5F]/30 transition-all">
            <div className="px-4">
              <Search className="h-5 w-5 text-[#174A5F]/40" />
            </div>
            <input 
              type="text" 
              placeholder="Search" 
              className="flex-1 h-full bg-transparent outline-none text-[15px] text-[#174A5F] placeholder:text-[#174A5F]/30"
            />
            <div className="h-full w-px bg-[#174A5F]/10" />
            <button className="px-4 h-full hover:bg-[#174A5F]/5 transition-colors">
              <SlidersHorizontal className="h-5 w-5 text-[#174A5F]" />
            </button>
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-6">
          <Typography className="text-sm font-bold text-[#174A5F]">
            My Cart
          </Typography>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <CartItem 
                key={item.id}
                {...item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </div>
      </div>
    </ResourceManagementLayout>
  );
};

export default CartView;
