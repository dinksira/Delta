import React from 'react';
import { CourseDashboardLayout } from '@/components/templates/CourseDashboardLayout';

export const OrderView: React.FC = () => {
  return (
    <CourseDashboardLayout header={<div className="px-8 py-4 border-b border-border-default"><h1 className="text-2xl font-semibold">My Orders</h1></div>}>
      <div className="p-8 text-center"><p>Order history coming soon.</p></div>
    </CourseDashboardLayout>
  );
};
