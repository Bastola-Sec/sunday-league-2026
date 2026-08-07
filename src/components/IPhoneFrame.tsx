import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface IPhoneFrameProps {
  children: React.ReactNode;
  enabled: boolean;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({ children, enabled }) => {
  const [timeString, setTimeString] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTimeString(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  if (!enabled) {
    return <div className="w-full min-h-screen bg-[#070d14] text-white">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#05080c] flex items-center justify-center p-2 sm:p-6 overflow-hidden select-none">
      {/* iPhone Outer Chassis */}
      <div className="relative w-full max-w-[420px] h-[860px] bg-[#1a222a] rounded-[52px] p-3 shadow-[0_0_60px_rgba(76,120,126,0.3)] border-[4px] border-[#2c3d4e] flex flex-col overflow-hidden">
        
        {/* Dynamic Island / Notch Notch Top */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-28 h-7 bg-black rounded-full flex items-center justify-between px-2.5 shadow-md pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
          <div className="w-3 h-3 rounded-full bg-[#0a1520] border border-[#1a2b3c] flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
          </div>
        </div>

        {/* iOS Status Bar */}
        <div className="absolute top-4 inset-x-0 z-40 px-7 flex items-center justify-between text-[12px] font-bold text-white pointer-events-none">
          <span>{timeString}</span>
          <div className="flex items-center gap-1.5 text-white">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-emerald-400 fill-current" />
          </div>
        </div>

        {/* Screen Content Window */}
        <div className="w-full h-full bg-[#0A1118] rounded-[42px] overflow-y-auto relative text-white pt-8 pb-6 custom-scrollbar">
          {children}
        </div>

        {/* Home Bar Indicator Bottom */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 w-32 h-1 bg-white/40 rounded-full pointer-events-none" />
      </div>
    </div>
  );
};
