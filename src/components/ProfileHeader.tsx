import React from 'react';
import { Phone, ShieldCheck } from 'lucide-react';
import { AdvisorProfile } from '../types';
import { AdvisorAvatar } from './AdvisorAvatar';

interface ProfileHeaderProps {
  profile: AdvisorProfile;
  onPhoneClick?: () => void;
  onEditProfile?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onPhoneClick,
  onEditProfile,
}) => {
  return (
    <div className="relative w-full px-5 pt-1 pb-3 select-none overflow-hidden">
      {/* Background Car Silhouette Overlay - Light elegant car curves */}
      <div className="absolute top-0 right-0 w-72 h-36 opacity-30 pointer-events-none translate-x-8 -translate-y-2">
        <svg viewBox="0 0 300 150" fill="none" className="w-full h-full text-blue-400">
          <path
            d="M 20 110 C 60 110 90 100 120 75 C 150 50 190 40 250 45 C 275 47 285 55 290 70 C 295 85 280 110 250 110 Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="4 2"
          />
          <path
            d="M 60 75 C 110 55 160 42 220 50"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle cx="75" cy="110" r="14" stroke="currentColor" strokeWidth="2" />
          <circle cx="235" cy="110" r="14" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <div className="relative z-10 flex items-center gap-4">
        {/* Avatar badge */}
        <button
          onClick={onEditProfile}
          className="focus:outline-none transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          <AdvisorAvatar size={74} />
        </button>

        {/* Info Column */}
        <div className="flex flex-col justify-center items-start text-left flex-1 min-w-0">
          {/* Advisor Name */}
          <h1 className="text-[19px] font-bold text-slate-900 tracking-tight leading-snug truncate w-full">
            {profile.name}
          </h1>

          {/* Phone number */}
          <button
            onClick={onPhoneClick}
            className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors my-0.5 text-[14px] font-medium font-mono cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-slate-400 fill-slate-400 stroke-none" />
            <span>{profile.phone}</span>
          </button>

          {/* Verified Account Badge */}
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 my-0.5 bg-[#e2eeff] text-[#2563eb] rounded-full text-[11px] font-semibold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 fill-[#2563eb] text-white" />
            <span>已认证账号</span>
          </div>

          {/* Role & Store */}
          <p className="text-[12px] text-slate-400 font-normal mt-0.5 truncate w-full">
            {profile.role} · {profile.store}
          </p>
        </div>
      </div>
    </div>
  );
};

