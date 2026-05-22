import React from 'react';
import { Typography } from '@/components/theme';
import { ResourceSidebar, ResourceSidebarTabId } from '@/components/organisms/ResourceSidebar';
import { NotificationItem, NotificationItemProps } from '@/components/molecules/NotificationItem';
import { ResourceManagementLayout } from '@/components/templates/ResourceManagementLayout';

export interface NotificationViewProps {
  activeSidebarTab: ResourceSidebarTabId;
  onSidebarTabChange: (tabId: ResourceSidebarTabId) => void;
}

export const NotificationView: React.FC<NotificationViewProps> = ({
  activeSidebarTab,
  onSidebarTabChange,
}) => {
  const notifications: NotificationItemProps[] = [
    {
      id: '1',
      title: 'Sponsor request Accepted',
      subtitle: 'resource purchased',
      isRead: false,
    },
    {
      id: '2',
      title: 'Requested Resource Denied',
      subtitle: 'resource denied',
      isRead: true,
    },
    {
      id: '3',
      title: 'Your Rent Request is accepted',
      subtitle: 'you are requested',
      isRead: true,
    },
    {
      id: '4',
      title: 'Requested on Resource',
      subtitle: 'resource rent request',
      isRead: true,
    },
    {
      id: '5',
      title: 'Requested on Resource Purchase',
      subtitle: 'resource group purchase request',
      buttonLabel: 'Accept',
      isRead: true,
    }
  ];

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
            Notification
          </Typography>
        </div>
      }
    >
      <div className="max-w-[1000px] space-y-4 pt-4">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            {...notification}
            onAction={() => console.log('Notification action', notification.id)}
          />
        ))}
      </div>
    </ResourceManagementLayout>
  );
};

export default NotificationView;
