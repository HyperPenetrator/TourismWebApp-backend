import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingBag, Clock, CheckCheck } from 'lucide-react';
import { usePersonalNotificationsSSE } from '@/hooks/usePersonalNotificationsSSE';
import { useAuth } from '@/context/AuthContext';

import { SkeletonList } from '@/components/ui/skeletons';

export const NotificationsHUD = () => {
  const { notifications, markRead, isLoading } = usePersonalNotificationsSSE();
  const { isAuthenticated } = useAuth();
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Bell size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">Please login to view notifications</p>
      </div>
    );
  }

  return (
    <div className="w-full relative px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-tactical-emerald text-white text-[10px] font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SkeletonList count={5} />
            </motion.div>
          ) : notifications.length > 0 ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-3"
            >
              <AnimatePresence mode="popLayout">
                {notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => !notif.read && markRead(notif.id)}
                    className={`p-4 rounded-2xl flex items-start gap-4 transition-all cursor-pointer ${
                      notif.read
                        ? 'bg-slate-50/50 dark:bg-white/5 border border-transparent opacity-60'
                        : 'bg-white dark:bg-white/10 border border-slate-100 dark:border-white/10 shadow-sm'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notif.read ? 'text-slate-400' : 'text-tactical-emerald bg-tactical-emerald/10'
                    }`}>
                      <ShoppingBag size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className={`text-sm font-semibold ${notif.read ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                          Order Update
                        </h4>
                        {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-tactical-emerald" />}
                      </div>
                      <p className={`text-sm mb-2 ${notif.read ? 'text-slate-400' : 'text-slate-600 dark:text-white/70'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock size={10} />
                        <span>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 flex flex-col items-center justify-center text-slate-300 dark:text-white/20"
            >
              <Bell size={32} className="mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

