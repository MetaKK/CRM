import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#e7eff9] text-slate-900 flex justify-center items-start overflow-x-hidden font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      <div className="crm-shell w-full max-w-[430px] min-h-screen min-h-[100dvh] relative flex flex-col sm:border-x sm:border-[#bfd1e6]">
        {children}
      </div>
    </div>
  );
};
