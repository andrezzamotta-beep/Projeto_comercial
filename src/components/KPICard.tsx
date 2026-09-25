import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Utilitário para combinar classes do Tailwind
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KPICardProps {
  title: string;
  value: string;
  /** Valor formatado da variação percentual (ex: "12.5%"). Undefined = sem comparativo disponível. */
  variation?: string;
  /** true = crescimento, false = queda */
  isPositive?: boolean;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
  className?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, variation, isPositive, Icon, className }) => {
  return (
    <div className={cn('tv-card justify-between hover:shadow-md transition-shadow', className)}>
      <div className="flex justify-between items-start mb-2 2xl:mb-4">
        <h3 className="tv-kpi-label">{title}</h3>
        <div className="p-3 bg-orange-50 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 2xl:w-8 2xl:h-8 text-criffer-primary" />
        </div>
      </div>

      <div>
        <div className="tv-kpi-value mb-2">{value}</div>

        {variation ? (
          /* Comparativo real com mês anterior */
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-500 shrink-0" />
            )}
            <span
              className={cn(
                'tv-kpi-variation font-semibold',
                isPositive ? 'text-emerald-600' : 'text-red-500'
              )}
            >
              {isPositive ? '+' : '-'}{variation}
            </span>
            <span className="tv-caption ml-0.5 text-gray-400">vs. mês ant.</span>
          </div>
        ) : (
          /* Sem dado do mês anterior */
          <div className="flex items-center gap-1.5">
            <span className="tv-caption text-gray-400 italic">Sem comparativo</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
