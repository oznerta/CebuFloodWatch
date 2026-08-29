import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon: LucideIcon;
  colorVariant?: 'blue' | 'emerald' | 'rose' | 'amber';
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  colorVariant = 'blue',
}: StatCardProps) {
  const colorMap = {
    blue: {
      bg: 'bg-[#E5F1FF]',
      text: 'text-[#007AFF]',
      border: 'border-[#CCE3FF]',
    },
    emerald: {
      bg: 'bg-[#EBF9EE]',
      text: 'text-[#34C759]',
      border: 'border-[#C3F0CD]',
    },
    rose: {
      bg: 'bg-[#FFEBEA]',
      text: 'text-[#FF3B30]',
      border: 'border-[#FFD0CE]',
    },
    amber: {
      bg: 'bg-[#FFF4E5]',
      text: 'text-[#FF9500]',
      border: 'border-[#FFE4BE]',
    },
  };

  const colors = colorMap[colorVariant] || colorMap.blue;

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-3xl font-extrabold text-[#1C1C1E] tracking-tight mt-1">
            {value}
          </h3>
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center border ${colors.bg} ${colors.text} ${colors.border}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-[#F2F2F7]">
          {subtitle && <span className="text-[#8E8E93] font-medium">{subtitle}</span>}
          {trend && (
            <span className={`font-bold ${colors.text}`}>{trend}</span>
          )}
        </div>
      )}
    </div>
  );
}
