import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  color: string;
  bgColor: string; // New prop for softer background integration
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, icon: Icon, color, bgColor }) => {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col items-start justify-between shadow-soft border border-slate-100 transition-transform active:scale-[0.98]">
      <div className="flex w-full justify-between items-start mb-2">
         <div className={`p-2 rounded-xl`} style={{ backgroundColor: bgColor }}>
            <Icon size={20} style={{ color: color }} />
         </div>
      </div>
      
      <div>
        <div className="text-2xl font-bold text-nature-text tracking-tight">
            {value}<span className="text-sm text-nature-muted font-medium ml-1">{unit}</span>
        </div>
        <div className="text-xs text-nature-muted font-medium mt-1">{label}</div>
      </div>
    </div>
  );
};