import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BellRing, X, Check } from 'lucide-react';
import { getNotificationPermissionStatus, requestPushNotificationPermission } from '../lib/pushNotificationService';

export const PushNotificationPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if we haven't asked yet
    const status = getNotificationPermissionStatus();
    if (status === 'default') {
      // Delay prompt by 3 seconds so it doesn't instantly jump at them
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    setIsVisible(false);
    // Request permission from the browser
    const res = await requestPushNotificationPermission();
    if (res.granted) {
      console.log('Push notifications enabled successfully');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // We can't actually change the browser permission to 'denied' programmatically, 
    // but the next time they open the app, it'll still be 'default'. 
    // If you want to stop prompting them forever if they click X, we'd need localStorage.
    // For now, they can just dismiss it.
    localStorage.setItem('has_dismissed_push_prompt', 'true');
  };

  useEffect(() => {
    if (getNotificationPermissionStatus() === 'default') {
      const hasDismissed = localStorage.getItem('has_dismissed_push_prompt');
      if (hasDismissed) {
        setIsVisible(false);
      }
    }
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          style={{ top: 'calc(1.5rem + env(safe-area-inset-top, 24px))' }}
          className="fixed left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[100] p-4 rounded-2xl bg-gradient-to-br from-[#08121e] to-[#05080c] border border-[#4C787E]/50 shadow-2xl shadow-[#000000]/80 backdrop-blur-xl flex flex-col gap-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-[#4C787E]/20 text-emerald-400 border border-[#4C787E]/30 shadow-inner">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black f1-header tracking-wider text-white">ENABLE MATCH ALERTS</h3>
                <p className="text-[10px] text-[#B7CEEC]/80 mt-0.5 leading-tight pr-4">
                  Get real-time push notifications for goals, kickoffs, and full-time results directly on your phone!
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={handleDismiss}
              className="py-2 rounded-xl border border-gray-600/50 text-gray-400 text-xs font-bold hover:bg-white/5 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleAllow}
              className="py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold border border-emerald-400/50 flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(52,211,153,0.3)]"
            >
              <Check className="w-3.5 h-3.5" />
              Allow Alerts
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
