import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, X, Trophy, Shield, Activity, Eye, ShieldAlert, Bell, Smartphone, Sparkles, ChevronRight, Home, Settings, ChevronDown } from 'lucide-react';
import { AppScrollState, Team } from '../types';
import { TeamLogo } from './TeamLogos';
import { requestPushNotificationPermission, getNotificationPermissionStatus } from '../lib/pushNotificationService';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  scrollState: AppScrollState;
  onSelectState: (state: AppScrollState) => void;
  teams: Team[];
  activeAdminTeamId: string | null;
  onSelectAdminTeam: (teamId: string | null) => void;
  isIPhoneFrame: boolean;
  onToggleIPhoneFrame: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  notificationCount: number;
  onOpenNotifications: () => void;
  onOpenAdminPortal: () => void;
}

export const SlideOutMenu: React.FC<SlideOutMenuProps> = ({
  isOpen,
  onClose,
  onToggle,
  scrollState,
  onSelectState,
  teams,
  activeAdminTeamId,
  onSelectAdminTeam,
  isIPhoneFrame,
  onToggleIPhoneFrame,
  isSoundEnabled,
  onToggleSound,
  notificationCount,
  onOpenNotifications,
  onOpenAdminPortal,
}) => {
  const [pushPermission, setPushPermission] = useState<'granted' | 'denied' | 'default'>(getNotificationPermissionStatus());
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  return (
    <>
      {/* 3-Dot Floating Trigger Button (Top Right Corner - Safe Area Offset) */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onToggle}
        style={{ top: 'calc(1.25rem + env(safe-area-inset-top, 24px))' }}
        className="fixed right-4 sm:right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full border border-[#B7CEEC]/50 bg-[#05080c]/90 backdrop-blur-2xl text-[#B7CEEC] shadow-[0_0_20px_rgba(0,0,0,0.8)] hover:border-[#4C787E] hover:text-white transition-all cursor-pointer"
        aria-label="Open Navigation Menu"
      >
        {isOpen ? <X className="w-6 h-6 text-[#B7CEEC]" /> : <MoreVertical className="w-6 h-6 text-[#B7CEEC]" />}
      </motion.button>

      {/* 3D Slide-Out Glass Menu Backdrop & Drawer */}
      <AnimatePresence>
        {isOpen && (
          <React.Fragment key="slide-out-menu-fragment">
            {/* Backdrop */}
            <motion.div
              key="slide-out-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-md cursor-pointer"
            />

            {/* Custom 3D Slide-Out Menu */}
            <motion.div
              key="slide-out-drawer"
              initial={{ x: '100%', rotateY: 15, opacity: 0 }}
              animate={{ x: 0, rotateY: 0, opacity: 1 }}
              exit={{ x: '100%', rotateY: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 z-[100] h-full w-80 max-w-[85vw] bg-[#05080c]/95 backdrop-blur-2xl border-l border-[#B7CEEC]/30 text-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d',
                paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 24px))',
              }}
            >
              <div>
                {/* Header Branding */}
                <div className="flex items-center justify-between pb-6 border-b border-[#B7CEEC]/20 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#4C787E]" />
                      <h2 className="text-lg font-black f1-header tracking-[0.15em] text-[#B7CEEC]">
                        SUNDAY LEAGUE
                      </h2>
                    </div>
                    <p className="text-xs text-[#B7CEEC]/70 font-medium mt-0.5 tracking-wide">2026 Telemetry Suite</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-[#4C787E]/30 text-[#B7CEEC] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Features */}
                <div className="mb-6">
                  <p className="text-[11px] f1-header tracking-[0.2em] text-[#4C787E] mb-3">
                    FEATURES
                  </p>
                  <div className="space-y-2">
                    {[
                      { state: 1 as AppScrollState, label: 'Hero & Overview', icon: Home, desc: 'Welcome & Season Intro' },
                      { state: 2 as AppScrollState, label: 'Official Leaderboards', icon: Trophy, desc: 'Standings & Cup Brackets' },
                      { state: 3 as AppScrollState, label: 'Live Action & Fixtures', icon: Activity, desc: 'Real-Time Match Center' },
                      { state: 4 as AppScrollState, label: '3D Stadium View', icon: Sparkles, desc: 'DeAnza Stadium Specs' },
                      { state: 5 as AppScrollState, label: 'Top League Clubs', icon: Shield, desc: 'Contenders & Rosters' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = scrollState === item.state;
                      return (
                        <motion.button
                          key={item.state}
                          whileHover={{ x: 4, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onSelectState(item.state);
                            onClose();
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                            isActive
                              ? 'bg-[#080d14] border-[#4C787E] text-white shadow-lg shadow-[#4C787E]/20'
                              : 'bg-[#05080c] border-[#B7CEEC]/20 text-gray-300 hover:border-[#4C787E] hover:bg-[#080d14]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isActive ? 'bg-[#4C787E] text-white' : 'bg-[#080d14] text-[#B7CEEC]'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold leading-tight font-mono">{item.label}</p>
                              <p className="text-[10px] text-[#B7CEEC]/70">{item.desc}</p>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-[#4C787E] translate-x-1' : 'text-gray-500 group-hover:translate-x-1'}`} />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Settings & Admin Accordion */}
                <div className="mb-6">
                  <button
                    onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                      isSettingsExpanded
                        ? 'bg-[#080d14] border-[#4C787E] text-white shadow-lg shadow-[#4C787E]/20'
                        : 'bg-[#05080c] border-[#B7CEEC]/20 text-gray-300 hover:border-[#4C787E] hover:bg-[#080d14]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSettingsExpanded ? 'bg-[#4C787E] text-white' : 'bg-[#080d14] text-[#B7CEEC]'}`}>
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-tight font-mono">Settings & Admin</p>
                        <p className="text-[10px] text-[#B7CEEC]/70">Preferences & Consoles</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isSettingsExpanded ? 'text-[#4C787E] rotate-180' : 'text-gray-500'}`} />
                  </button>

                  <AnimatePresence>
                    {isSettingsExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 p-3 mt-2 rounded-2xl bg-[#080d14] border border-[#B7CEEC]/30 shadow-inner">
                          {/* 1. Sounds Toggle */}
                          <button
                            onClick={onToggleSound}
                            className="w-full py-3 px-3 rounded-xl border bg-[#0a141d] border-[#B7CEEC]/20 text-[#B7CEEC] hover:bg-[#B7CEEC]/10 font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm"
                          >
                            <div className="flex items-center gap-2.5">
                              <Activity className={`w-4 h-4 ${isSoundEnabled ? 'text-emerald-400' : 'text-gray-500'}`} />
                              <div className="text-left">
                                <p className="font-extrabold text-[11px] leading-tight text-white">
                                  Sounds
                                </p>
                                <p className="text-[9px] opacity-70 font-mono">
                                  {isSoundEnabled ? 'ON' : 'OFF'}
                                </p>
                              </div>
                            </div>
                            <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isSoundEnabled ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isSoundEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                            </div>
                          </button>

                          {/* 2. Notification Toggle */}
                          <button
                            onClick={async () => {
                              const res = await requestPushNotificationPermission();
                              if (res.granted) {
                                alert('🔔 MATCH ALERTS ENABLED!\n\nYou will now receive live background alerts on your phone for Goals, Kickoffs & Tournament events!');
                                setPushPermission('granted');
                              } else {
                                alert(res.error || 'Notification permission was not granted.');
                              }
                            }}
                            className={`w-full py-3 px-3 rounded-xl border font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-md ${
                              pushPermission === 'granted'
                                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                                : 'bg-[#0a141d] border-amber-400/40 text-amber-300 hover:bg-amber-500/10'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Bell className={`w-4 h-4 ${pushPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400 animate-bounce'}`} />
                              <div className="text-left">
                                <p className="font-extrabold text-[11px] leading-tight text-white">
                                  Notification
                                </p>
                                <p className="text-[9px] opacity-80 font-mono">
                                  {pushPermission === 'granted' ? 'ON' : 'OFF'}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                              pushPermission === 'granted' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'
                            }`}>
                              {pushPermission === 'granted' ? 'ON' : 'ENABLE'}
                            </span>
                          </button>

                          {/* 3. Admin Console */}
                          <button
                            onClick={() => {
                              onSelectState(5);
                              onOpenAdminPortal();
                              onClose();
                            }}
                            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#112230] via-[#1a3848] to-[#4C787E] hover:from-[#172e3f] hover:to-[#5a8c93] border border-[#4C787E]/60 text-white font-extrabold text-xs transition-all flex items-center justify-between shadow-lg shadow-[#4C787E]/20 cursor-pointer group hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-[#05080c]/80 text-[#B7CEEC] group-hover:text-white border border-[#4C787E]/40 transition-colors">
                                <ShieldAlert className="w-4 h-4 text-[#4C787E]" />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-xs text-white leading-none f1-header tracking-wider">Admin Console</p>
                                <p className="text-[10px] text-[#B7CEEC]/80 mt-1 font-mono">League Operations</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#B7CEEC] group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-[#B7CEEC]/20 text-center text-[10px] text-[#B7CEEC]/60 font-mono">
                <p>Sunday League 2026 • Official Telemetry</p>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>
    </>
  );
};
