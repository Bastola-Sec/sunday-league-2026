import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, X, Trophy, Shield, Activity, Eye, ShieldAlert, Bell, Smartphone, Volume2, VolumeX, Sparkles, ChevronRight } from 'lucide-react';
import { AppScrollState, Team } from '../types';
import { TeamLogo } from './TeamLogos';

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
  return (
    <>
      {/* 3-Dot Floating Trigger Button (Top Right Corner) */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onToggle}
        className="fixed top-5 right-5 z-50 flex items-center justify-center w-12 h-12 rounded-full border border-[#B7CEEC]/40 bg-[#05080c]/85 backdrop-blur-xl text-[#B7CEEC] shadow-xl shadow-[#4C787E]/20 hover:border-[#4C787E] hover:text-white transition-all cursor-pointer"
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
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md cursor-pointer"
            />

            {/* Custom 3D Slide-Out Menu */}
            <motion.div
              key="slide-out-drawer"
              initial={{ x: '100%', rotateY: 15, opacity: 0 }}
              animate={{ x: 0, rotateY: 0, opacity: 1 }}
              exit={{ x: '100%', rotateY: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-[#05080c]/95 backdrop-blur-2xl border-l border-[#B7CEEC]/30 text-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d',
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
                      { state: 2 as AppScrollState, label: 'Live Action & Fixtures', icon: Activity, desc: 'Real-Time Match Center' },
                      { state: 3 as AppScrollState, label: 'Match Venue', icon: Sparkles, desc: 'DeAnza Stadium Specs' },
                      { state: 4 as AppScrollState, label: 'League Standings', icon: Trophy, desc: 'Official Rankings' },
                      { state: 5 as AppScrollState, label: 'Participating Clubs', icon: Shield, desc: 'Contenders & Rosters' },
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

                {/* Admin Console Section */}
                <div className="mb-6 p-3 rounded-2xl bg-[#080d14] border border-[#B7CEEC]/30 shadow-inner">
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
                        <p className="font-bold text-xs text-white leading-none f1-header tracking-wider">ADMIN CONSOLE</p>
                        <p className="text-[10px] text-[#B7CEEC]/80 mt-1 font-mono">League & Team Management</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#B7CEEC] group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* System Toggles */}
                <div className="space-y-2 border-t border-[#B7CEEC]/20 pt-4">
                  <button
                    onClick={onToggleSound}
                    className="w-full p-2.5 rounded-xl bg-[#080d14] border border-[#B7CEEC]/30 text-xs font-medium text-gray-300 hover:text-white flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {isSoundEnabled ? <Volume2 className="w-4 h-4 text-[#4C787E]" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                      <span>Match Audio FX</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${isSoundEnabled ? 'bg-[#4C787E]/30 text-[#B7CEEC]' : 'bg-gray-800 text-gray-400'}`}>
                      {isSoundEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
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
