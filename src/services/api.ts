export interface DashboardKPIs {
  faturamento_bruto: number;
  pedidos_faturados: number;
  pecas_faturadas: number;
  ticket_medio: number;
  faturamento_variacao?: number | null;
  pedidos_variacao?: number | null;
  pecas_variacao?: number | null;
  ticket_variacao?: number | null;
}

export interface RankingItem {
  name: string;
  value: number;
  orders: number;
  photo_url?: string;
}

export interface TopProductItem {
  name: string;
  value: number;
  value_raw?: number;
  qty: number;
  progress: number;
}

export interface EvolutionData {
  days: string[];
  revenue: number[];
  orders: number[];
}

export interface GeoDistributionItem {
  uf: string;
  value: number;
  orders: number;
}

export interface DetailItem {
  numero_nf: string | number | null;
  data_lancamento: string | null;
  cliente: string;
  vendedor: string;
  produto: string;
  quantidade: number;
  valor_total: number;
  estado: string;
}

export interface QuotationsData {
  months: string[];
  josi: number[];
  vanessa: number[];
}

export interface RankingCategories {
  vendas: RankingItem[];
  servicos: RankingItem[];
  locacoes: RankingItem[];
}

export interface DashboardData {
  selected_month: string;
  period: {
    start: string;
    end: string;
  };
  kpis: DashboardKPIs;
  ranking: RankingCategories | RankingItem[];
  top_products: TopProductItem[];
  evolution: EvolutionData;
  geo_distribution?: GeoDistributionItem[];
  quotations?: QuotationsData;
  total_registros_brutos: number;
  total_saidas_autorizadas: number;
  updated_at: string;
}

export interface MonthOption {
  value: string;
  label: string;
  isCurrent: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchDashboard(mes?: string): Promise<DashboardData> {
  const url = new URL(`${API_BASE_URL}/api/comercial/dashboard`);
  if (mes) {
    url.searchParams.append('mes', mes);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Erro ao buscar dados do dashboard: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchAvailableMonths(): Promise<MonthOption[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/comercial/meses`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error('Erro ao buscar meses da API:', err);
  }

  // Fallback caso a API ainda não esteja respondendo
  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const now = new Date();
  const options: MonthOption[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    options.push({
      value: `${y}-${m}`,
      label: `${mesesNomes[d.getMonth()]} ${y}`,
      isCurrent: i === 0,
    });
  }
  return options;
}

export async function fetchQuotations(mes?: string): Promise<QuotationsData> {
  const url = new URL(`${API_BASE_URL}/api/comercial/cotacoes`);
  if (mes) {
    url.searchParams.append('mes', mes);
  }
  try {
    const response = await fetch(url.toString());
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error('Erro ao buscar cotações da API:', err);
  }
  // Fallback (mock)
  return {
    months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    josi: [12000, 15000, 14000, 18000, 22000, 24000],
    vanessa: [10000, 12000, 11000, 16000, 19000, 21000]
  };
}
