"use client";

import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';

export default function NotificationIcon() {
  const { unreadCount } = useNotifications();
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/notifications')}
      className="relative p-2 text-zinc-400 hover:text-[#FF7101] transition-colors"
      title="Notifications"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#FF7101] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
