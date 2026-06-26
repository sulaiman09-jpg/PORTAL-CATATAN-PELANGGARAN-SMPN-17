import React from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  iconName: keyof typeof Icons;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorTheme: 'blue' | 'red' | 'amber' | 'emerald';
}

export default function StatCard({ label, value, iconName, description, trend, colorTheme }: StatCardProps) {
  const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;

  const themeClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-slate-200 border-l-4 border-l-blue-600',
      iconBg: 'bg-blue-500',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-slate-200 border-l-4 border-l-red-500',
      iconBg: 'bg-red-500',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-slate-200 border-l-4 border-l-amber-500',
      iconBg: 'bg-amber-500',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-slate-200 border-l-4 border-l-blue-900',
      iconBg: 'bg-emerald-500',
    }
  }[colorTheme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white border ${themeClasses.border} rounded-2xl p-6 shadow-sm flex justify-between items-start hover:shadow-md transition-shadow`}
    >
      <div className="space-y-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{label}</span>
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight font-display">{value}</h3>
        {description && (
          <p className="text-xs text-slate-500">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend.isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {trend.value}
            </span>
            <span className="text-xs text-slate-400">vs bulan lalu</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${themeClasses.bg}`}>
        {IconComponent && <IconComponent className={`w-6 h-6 ${themeClasses.text}`} />}
      </div>
    </motion.div>
  );
}
