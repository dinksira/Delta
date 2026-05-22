import React from 'react';
import OrderCard, { OrderCardProps } from '@/components/molecules/OrderCard';

export interface OrderGridProps {
  orders: OrderCardProps[];
  onShowOnMap?: (id: string) => void;
  onCancelOrder?: (id: string) => void;
  onOrderReceived?: (id: string) => void;
}

export const OrderGrid: React.FC<OrderGridProps> = ({
  orders,
  onShowOnMap,
  onCancelOrder,
  onOrderReceived,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 py-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          {...order}
          onShowOnMap={() => onShowOnMap?.(order.id)}
          onCancelOrder={() => onCancelOrder?.(order.id)}
          onOrderReceived={() => onOrderReceived?.(order.id)}
        />
      ))}
    </div>
  );
};

export default OrderGrid;
