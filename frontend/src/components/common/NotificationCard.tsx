import { useRef } from 'react';
import { useClickOutside } from '../../utils/useClickOutside';
import { IconChevronRight } from '@tabler/icons-react';
import { useRouter } from "next/navigation";
import { User } from '@/@types';
import { useGetNotifications, useMarkNotificationAsRead } from '@/hooks/school-admin';
import NotificationIcon from './NotificationIcon';
import NoAvailableEmptyState from './NoAvailableEmptyState';

interface NotificationCardProps {
  onClose: () => void;
  user: User
}

export default function NotificationCard({ onClose, user }: NotificationCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    useClickOutside(ref, onClose);
    const router = useRouter();
    const schoolId = user.school.id;

    const { notifications } = useGetNotifications(schoolId);
    const { mutate: markAsRead } = useMarkNotificationAsRead();

    const onHandleNotificationItemClick = (id: string) => {
        markAsRead(id, {
            onError: (err) => {
                console.error("Error marking notification as read:", err);
            }
        });

        router.push(`/admin/notifications/${id}`);
        
        onClose();
    }

  return (
    <div
      ref={ref}
      className="absolute right-8 top-16 mt-2 w-90 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
    >
      <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
        Notifications
      </div>
      <ul className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? notifications.map((n) => (
          <li
            onClick={() => onHandleNotificationItemClick(n?.id as string)}
            key={n.id}
            className="px-4 py-2 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
          >
            <NotificationIcon type={n.type} />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{n.title}</p>
              <p className="text-sm text-gray-600">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{n.type}</p>
            </div>
            {!n.read && <span className="w-2 h-2 bg-purple-500 rounded-full" />}
            <IconChevronRight color="#5A6474" className="w-4 h-4" />
          </li>
        )) : (
          <NoAvailableEmptyState message="No notifications available." />
        )}
      </ul>
    </div>
  );
}
