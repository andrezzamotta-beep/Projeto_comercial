import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import KPISection from './components/KPISection';
import Ranking from './components/Ranking';
import ServiceEvolution from './components/ServiceEvolution';
import TopProducts from './components/TopProducts';
import QuotationsEvolution from './components/QuotationsEvolution';
import CommercialMap from './components/CommercialMap';
import {
  fetchDashboard,
  fetchAvailableMonths,
  fetchQuotations,
} from './services/api';
import type { DashboardData, QuotationsData, MonthOption } from './services/api';
import { LayoutDashboard, Map, Pause, Play } from 'lucide-react';

const App: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [quotationsData, setQuotationsData] = useState<QuotationsData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'map'>('overview');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [progress, setProgress] = useState(0);

  // Carregar opções de meses na inicialização
  useEffect(() => {
    fetchAvailableMonths().then((opts) => {
      setMonths(opts);
      if (opts.length > 0) {
        // Encontra o mês atual ou usa o primeiro
        const current = opts.find((m) => m.isCurrent);
        if (current) {
          setSelectedMonth(current.value);
        } else {
          setSelectedMonth(opts[0].value);
        }
      }
    });
  }, []);

  // Carregar dados do dashboard ao alterar o mês
  const loadDashboardData = useCallback(async (mes: string) => {
    setLoading(true);
    try {
      const [data, quotes] = await Promise.all([
        fetchDashboard(mes),
        fetchQuotations(mes)
      ]);
      setDashboardData(data);
      setQuotationsData(quotes);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadDashboardData(selectedMonth);
    }
  }, [selectedMonth, loadDashboardData]);

  // Rotação de telas no modo TV (quando autoRotate estiver ativo)
  // 5 minutos (300.000 ms) para a tela principal e 30 segundos (30.000 ms) para o mapa
  const currentInterval = activeTab === 'overview' ? 300000 : 30000;

  useEffect(() => {
    if (!autoRotate) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const stepMs = 100;
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 100 / (currentInterval / stepMs);
        return next >= 100 ? 100 : next;
      });
    }, stepMs);

    const switchInterval = setInterval(() => {
      setActiveTab((prev) => (prev === 'overview' ? 'map' : 'overview'));
      setProgress(0);
    }, currentInterval);

    return () => {
      clearInterval(progressInterval);
      clearInterval(switchInterval);
    };
  }, [autoRotate, activeTab, currentInterval]);

  const handleManualTabChange = (tab: 'overview' | 'map') => {
    setActiveTab(tab);
    // Se o usuário clicar manualmente, pausa o carrossel temporariamente para que ele possa analisar
    setAutoRotate(false);
  };

  return (
    <div className="min-h-screen bg-dashboard-bg flex flex-col font-sans pt-16 sm:pt-20">
      {/* Cabeçalho Corporativo com Filtro de Mês */}
      <Header
        selectedMonth={selectedMonth}
        onMonthChange={(newMonth) => {
          setSelectedMonth(newMonth);
        }}
        months={months}
        loading={loading}
        onRefresh={() => loadDashboardData(selectedMonth)}
        lastUpdated={dashboardData?.updated_at}
      />

      {/* Barra de progresso da rotação automática de telas */}
      {autoRotate && (
        <div className="fixed left-0 w-full h-1 bg-gray-200 z-40 top-16 sm:top-20">
          <div
            className="h-full bg-criffer-primary transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Barra de Abas e Controle de TV */}
      <div className="px-4 sm:px-8 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl shadow-xs border border-gray-100">
          <button
            onClick={() => handleManualTabChange('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'overview'
                ? 'bg-criffer-primary text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Visão Geral
          </button>
          <button
            onClick={() => handleManualTabChange('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'map'
                ? 'bg-criffer-primary text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Map className="w-3.5 h-3.5" />
            Mapa Brasil
          </button>
        </div>

        {/* Botão de Pausar/Retomar Carrossel */}
        <button
          onClick={() => setAutoRotate((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${autoRotate
              ? 'bg-orange-50/60 border-orange-200 text-criffer-primary hover:bg-orange-100/50'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          title={autoRotate ? 'Pausar rotação automática de telas' : 'Ativar rotação automática de telas para TV'}
        >
          {autoRotate ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Modo TV Ativo</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Retomar Modo TV</span>
            </>
          )}
        </button>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 sm:p-8 pt-2 flex flex-col gap-6">
        {/* ABA 1: Visão Geral */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* KPIs no topo */}
            <KPISection kpis={dashboardData?.kpis} loading={loading} />

            {/* Grid Central */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna 1: Ranking de Vendedores */}
              <div className="lg:col-span-1 min-h-[420px]">
                <Ranking items={dashboardData?.ranking} loading={loading} />
              </div>

              {/* Coluna 2: Evolução de Vendas no Mês + Cotações */}
              <div className="lg:col-span-1 flex flex-col gap-6 min-h-[420px]">
                <div className="flex-1 min-h-[220px]">
                  <ServiceEvolution evolution={dashboardData?.evolution} loading={loading} />
                </div>
                <div className="flex-1 min-h-[220px]">
                  <QuotationsEvolution data={quotationsData} loading={loading} />
                </div>
              </div>

              {/* Coluna 3: Produtos Mais Vendidos */}
              <div className="lg:col-span-1 min-h-[420px]">
                <TopProducts items={dashboardData?.top_products} loading={loading} />
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: Mapa */}
        {activeTab === 'map' && (
          <div className="h-[calc(100vh-180px)] min-h-[500px] animate-fadeIn">
            <CommercialMap items={dashboardData?.geo_distribution} loading={loading} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
