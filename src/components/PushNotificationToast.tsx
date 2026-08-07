import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, ShieldAlert } from 'lucide-react';
import { PushNotification } from '../types';
import { TeamLogo } from './TeamLogos';

interface PushNotificationToastProps {
  notifications: PushNotification[];
  onDismiss: (id: string) => void;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.slice(0, 3).map((notif, idx) => (
          <motion.div
            key={`notif-${notif.id}-${idx}`}
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.85 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="pointer-events-auto p-3.5 rounded-2xl bg-[#0d1b2a]/95 backdrop-blur-2xl border border-[#B7CEEC]/40 text-white shadow-2xl flex items-start justify-between gap-3 relative overflow-hidden"
          >
            {/* iOS Style Accent Glow */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#B7CEEC] to-[#4C787E]" />

            <div className="flex items-start gap-3 pl-1">
              <div className="p-2 rounded-xl bg-[#162a3d] border border-[#4C787E]/30 shrink-0">
                {notif.teamId ? (
                  <TeamLogo teamId={notif.teamId} size={24} />
                ) : (
                  <Bell className="w-5 h-5 text-[#B7CEEC]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-[#B7CEEC] uppercase">
                    SUNDAY LEAGUE ALERT
                  </span>
                  <span className="text-[9px] text-gray-400">• {notif.timestamp}</span>
                </div>
                <h4 className="font-bold text-xs text-white leading-tight mt-0.5">{notif.title}</h4>
                <p className="text-[11px] text-gray-300 mt-1 leading-snug">{notif.message}</p>
              </div>
            </div>

            <button
              onClick={() => onDismiss(notif.id)}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
