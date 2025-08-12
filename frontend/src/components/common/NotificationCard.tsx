import { useRef } from 'react';
import { useClickOutside } from '../../utils/useClickOutside';
import { IconChevronRight } from '@tabler/icons-react';
import Image from "next/image";
import { useRouter } from "next/navigation";

interface NotificationCardProps {
  onClose: () => void;
}

export default function NotificationCard({ onClose }: NotificationCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    useClickOutside(ref, onClose);
    const router = useRouter();

    const notifications = [
        {
            id: 1,
            user: 'stewiedewie',
            action: 'Added a new attendance entry',
            time: '0 min',
            avatar: 'https://cdn.builder.io/api/v1/image/assets/TEMP/5cdc8e15cdd19351c9962680fff3b3636cd00e80?placeholderIfAbsent=true',
            unread: true,
        },
        {
            id: 2,
            user: 'casianvelaris',
            action: 'Paid Feeding Fee',
            time: '0 min',
            avatar: 'https://cdn.builder.io/api/v1/image/assets/TEMP/5cdc8e15cdd19351c9962680fff3b3636cd00e80?placeholderIfAbsent=true',
            unread: true,
        },
        {
            id: 3,
            user: 'ohheyitsherbert',
            action: 'Added new results entry',
            time: '15 min',
            avatar: 'https://cdn.builder.io/api/v1/image/assets/TEMP/5cdc8e15cdd19351c9962680fff3b3636cd00e80?placeholderIfAbsent=true',
            unread: false,
        },
        {
            id: 4,
            user: 'magnolialysl',
            action: 'Deleted attendance entry for class 3',
            time: '28 min',
            avatar: 'https://cdn.builder.io/api/v1/image/assets/TEMP/5cdc8e15cdd19351c9962680fff3b3636cd00e80?placeholderIfAbsent=true',
            unread: false,
        },
    ];

    const onHandleNotificationItemClick = (id: number) => {
        router.push(`/admin/notifications/${id}`);
        onClose();
    }

  return (
    <div ref={ref} className="absolute right-8 top-16 mt-2 w-90 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
        <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
            Notifications
        </div>
        <ul className="max-h-96 overflow-y-auto">
            {notifications.map((n) => (
                <li onClick={() => onHandleNotificationItemClick(n.id)} key={n.id} className="px-4 py-2 hover:bg-gray-50 flex items-center gap-3 cursor-pointer">
                    <Image
                        width={40}
                        height={40}
                        alt="User Avatar"
                        src={n.avatar}
                        className="mr-2.5 w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{n.user}</p>
                        <p className="text-sm text-gray-600">{n.action}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                    {n.unread && <span className="w-2 h-2 bg-purple-500 rounded-full" />}
                    <IconChevronRight color='#5A6474' className='w-4 h-4' />
                </li>
            ))}
        </ul>
    </div>
  );
}
