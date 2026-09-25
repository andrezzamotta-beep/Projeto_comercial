import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import type { MonthOption } from '../services/api';

interface HeaderProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  months: MonthOption[];
  loading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: string;
}

const Header: React.FC<HeaderProps> = ({
  selectedMonth,
  onMonthChange,
  months,
  loading = false,
  onRefresh,
  lastUpdated,
}) => {
  const currentIndex = months.findIndex((m) => m.value === selectedMonth);

  const handlePrevMonth = () => {
    // Meses estão ordenados decrescentes, então mês anterior cronológico é index + 1
    if (currentIndex < months.length - 1) {
      onMonthChange(months[currentIndex + 1].value);
    }
  };

  const handleNextMonth = () => {
    // Próximo mês cronológico é index - 1
    if (currentIndex > 0) {
      onMonthChange(months[currentIndex - 1].value);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 sm:h-20 bg-white border-b border-gray-100 z-50 px-4 sm:px-8 flex items-center justify-between shadow-xs">
      {/* Lado Esquerdo: Logo Oficial e Título */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="h-9 sm:h-10 w-28 sm:w-36 relative flex items-center">
          <img
            src="/Criffer-logo.webp"
            alt="Criffer Logo"
            className="h-full w-full object-contain object-left"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.innerHTML =
                  '<span class="text-[#FF6A22] font-black text-xl tracking-tight">CRIFFER</span>';
              }
            }}
          />
        </div>
        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
        <div>
          <h1 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight leading-none">
            Dashboard Comercial
          </h1>
        </div>
      </div>

      {/* Lado Direito: Seletor de Mês/Ano e Atualização */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Controles de Navegação de Mês */}
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1 shadow-xs">
          <button
            onClick={handlePrevMonth}
            disabled={currentIndex >= months.length - 1 || loading}
            className="p-1 sm:p-1.5 rounded hover:bg-white text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="w-3.5 h-3.5 text-[#FF6A22]" />
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              disabled={loading}
              className="bg-transparent text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer pr-1"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} {m.isCurrent ? '(Mês Atual)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            disabled={currentIndex <= 0 || loading}
            className="p-1 sm:p-1.5 rounded hover:bg-white text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Botão de Atualizar */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors ${loading ? 'animate-spin text-[#FF6A22]' : ''
              }`}
            title="Atualizar dados agora"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Info de Atualização */}
        <div className="hidden lg:flex flex-col items-end text-right pl-2 border-l border-gray-100">
          <span className="text-[10px] uppercase font-semibold text-gray-400">
            Atualizado em
          </span>
          <span className="text-xs font-medium text-gray-700">
            {lastUpdated || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
