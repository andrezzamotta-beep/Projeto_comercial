import React from 'react';
import { DollarSign, FileCheck, Package, TrendingUp } from 'lucide-react';
import KPICard from './KPICard';
import type { DashboardKPIs } from '../services/api';

interface KPISectionProps {
  kpis?: DashboardKPIs;
  loading?: boolean;
}

/**
 * Formata a variação percentual para exibição.
 * Retorna undefined se o valor for null/undefined (sem dados do mês anterior).
 */
function formatVariacao(val?: number | null): string | undefined {
  if (val === null || val === undefined) return undefined;
  return `${Math.abs(val).toFixed(1)}%`;
}

const KPISection: React.FC<KPISectionProps> = ({ kpis, loading = false }) => {
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const faturamento = kpis ? formatCurrency(kpis.faturamento_bruto) : 'R$ 0,00';
  const pedidos = kpis ? kpis.pedidos_faturados.toLocaleString('pt-BR') : '0';
  const pecas = kpis ? kpis.pecas_faturadas.toLocaleString('pt-BR') : '0';
  const ticketMedio = kpis ? formatCurrency(kpis.ticket_medio) : 'R$ 0,00';

  const cards = [
    {
      title: 'Faturamento Bruto (Saídas)',
      value: loading ? 'Carregando...' : faturamento,
      variation: loading ? undefined : formatVariacao(kpis?.faturamento_variacao),
      isPositive: (kpis?.faturamento_variacao ?? 0) >= 0,
      Icon: DollarSign,
    },
    {
      title: 'Notas Faturadas',
      value: loading ? '...' : pedidos,
      variation: loading ? undefined : formatVariacao(kpis?.pedidos_variacao),
      isPositive: (kpis?.pedidos_variacao ?? 0) >= 0,
      Icon: FileCheck,
    },
    {
      title: 'Itens Faturados',
      value: loading ? '...' : pecas,
      variation: loading ? undefined : formatVariacao(kpis?.pecas_variacao),
      isPositive: (kpis?.pecas_variacao ?? 0) >= 0,
      Icon: Package,
    },
    {
      title: 'Ticket Médio / Nota',
      value: loading ? '...' : ticketMedio,
      variation: loading ? undefined : formatVariacao(kpis?.ticket_variacao),
      isPositive: (kpis?.ticket_variacao ?? 0) >= 0,
      Icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
      {cards.map((card, index) => (
        <KPICard key={index} {...card} />
      ))}
    </div>
  );
};

export default KPISection;
