/**
 * AppliedAidsCard
 * Atomic Level: Organism
 *
 * Displays a list of courses and their financial aid application status.
 */

import React from 'react';

export type AidStatus = 'Approved' | 'Waiting' | 'Rejected';

export interface AppliedAidItem {
  id: string;
  courseName: string;
  status: AidStatus;
}

export interface AppliedAidsCardProps {
  items: AppliedAidItem[];
}

export const AppliedAidsCard: React.FC<AppliedAidsCardProps> = ({ items }) => {
  
  const getStatusColor = (status: AidStatus) => {
    switch (status) {
      case 'Approved': return 'text-emerald-600';
      case 'Waiting': return 'text-yellow-600';
      case 'Rejected': return 'text-red-600';
      default: return 'text-primary-800';
    }
  };

  return (
    <div className="w-full mt-8">
      <h3 className="text-center text-primary-800 font-medium mb-4">Tracking applied aids</h3>
      
      <div className="bg-[#DCE3E6] rounded-xl p-6 shadow-sm min-h-[200px]">
        
        <div className="flex flex-col gap-4">
          {items.map((item, index) => (
            <div 
              key={item.id} 
              className={`flex items-center justify-between pb-2 ${index < items.length - 1 ? 'border-b border-white/50' : ''}`}
            >
              <span className="text-sm text-primary-900 font-bold">{item.courseName}</span>
              <span className={`text-[11px] font-bold ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-sm text-primary-600 text-center py-4">No applied aids to track.</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AppliedAidsCard;
