import React from 'react';
import type { RankingItem, RankingCategories } from '../services/api';
import { Trophy, ShoppingBag, Wrench, KeyRound } from 'lucide-react';

import ferreiraImg from '../assets/Ferreira.webp';
import kleinImg from '../assets/Klein.webp';
import rogisleiImg from '../assets/Rogislei.webp';
import mercadoLivreImg from '../assets/mercado livre.webp';
import medeirosImg from '../assets/Medeiros.webp';
import josianeImg from '../assets/Josiane.webp';
import vanessaImg from '../assets/Vanessa.webp';

interface RankingProps {
  items?: RankingCategories | RankingItem[];
  loading?: boolean;
}

const CATEGORIES_CONFIG = [
  {
    key: 'vendas' as const,
    label: 'Vendas',
    badgeStyle: 'bg-orange-50/90 text-criffer-primary border-orange-100',
    icon: ShoppingBag,
    whitelist: ['rogislei', 'klein', 'ferreira', 'mercado'],
    defaultNames: [
      { name: 'Rogislei Padilha', filterKey: 'rogislei' },
      { name: 'Gabriel Klein', filterKey: 'klein' },
      { name: 'Gabriel Ferreira', filterKey: 'ferreira' },
      { name: 'Mercado Livre', filterKey: 'mercado' },
    ]
  },
  {
    key: 'servicos' as const,
    label: 'Serviços',
    badgeStyle: 'bg-blue-50/90 text-blue-600 border-blue-100',
    icon: Wrench,
    whitelist: ['medeiros'],
    defaultNames: [
      { name: 'Gabriel Medeiros', filterKey: 'medeiros' }
    ]
  },
  {
    key: 'locacoes' as const,
    label: 'Locações',
    badgeStyle: 'bg-emerald-50/90 text-emerald-600 border-emerald-100',
    icon: KeyRound,
    whitelist: ['josiane', 'josi', 'vanessa', 'vane', 'van', 'vá'],
    defaultNames: [
      { name: 'Josiane', filterKey: 'josi' },
      { name: 'Vanessa', filterKey: 'van' }
    ]
  },
];

function getSellerPhoto(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('vanessa') || lower.includes('vane') || lower.includes('van') || lower.includes('vá')) return vanessaImg;
  if (lower.includes('josiane') || lower.includes('josi')) return josianeImg;
  if (lower.includes('ferreira')) return ferreiraImg;
  if (lower.includes('klein')) return kleinImg;
  if (lower.includes('rogislei') || lower.includes('padilha')) return rogisleiImg;
  if (lower.includes('mercado') || lower.includes('livre')) return mercadoLivreImg;
  if (lower.includes('medeiros')) return medeirosImg;
  return vanessaImg;
}

const Ranking: React.FC<RankingProps> = ({ items, loading = false }) => {
  // Extrair itens de cada categoria com filtro estrito e garantia de presença dos vendedores fixos
  const getCategoryItems = (
    key: 'vendas' | 'servicos' | 'locacoes',
    whitelist: string[],
    defaultNames: { name: string; filterKey: string }[]
  ): RankingItem[] => {
    if (!items) return [];
    const rawItems: RankingItem[] = Array.isArray(items)
      ? (key === 'vendas' ? items : [])
      : (items[key] || []);

    const filtered = rawItems.filter((i) =>
      whitelist.some((w) => i.name.toLowerCase().includes(w))
    );

    const result = [...filtered];
    for (const def of defaultNames) {
      if (!result.some((r) => r.name.toLowerCase().includes(def.filterKey))) {
        result.push({
          name: def.name,
          value: 0,
          orders: 0
        });
      }
    }

    result.sort((a, b) => b.value - a.value);
    return result;
  };

  return (
    <div className="tv-card h-full flex flex-col justify-between bg-slate-50/40 p-4 sm:p-5 rounded-3xl border border-slate-200/60 shadow-sm">
      {/* Título Principal */}
      <div className="flex items-center gap-2.5 mb-4">
        <Trophy className="w-6 h-6 text-criffer-primary" />
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Ranking Comercial</h2>
      </div>

      {/* Guia Única com Sub-Cards Separados por Categoria */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        {loading ? (
          <div className="h-full min-h-[250px] flex items-center justify-center text-slate-400 text-sm font-medium">
            Carregando ranking...
          </div>
        ) : (
          CATEGORIES_CONFIG.map(({ key, label, badgeStyle, icon: Icon, whitelist, defaultNames }) => {
            const categoryItems = getCategoryItems(key, whitelist, defaultNames);
            const maxValue = Math.max(...categoryItems.map((i) => i.value), 1);

            return (
              <div key={key} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col gap-3">
                {/* Sub-Card Header Badge */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${badgeStyle}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </span>
                </div>

                {/* Lista de Vendedores */}
                <div className="flex flex-col gap-3">
                  {categoryItems.map((item) => {
                    const pct = Math.min(100, Math.max(4, Math.round((item.value / maxValue) * 100)));
                    const sellerPhoto = getSellerPhoto(item.name);

                    return (
                      <div key={item.name} className="flex items-center gap-3 py-1 group">
                        {/* Avatar HD do Vendedor em Tamanho Maior (80px) */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={sellerPhoto}
                            alt={item.name}
                            title={item.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md hover:scale-105 transition-transform duration-200 bg-slate-100"
                          />
                        </div>

                        {/* Barra de Progresso da Categoria */}
                        <div className="flex-1 h-3 bg-slate-100/90 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-criffer-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Pedidos */}
                        <div className="px-3 py-1 bg-slate-100/80 rounded-md text-xs font-semibold text-slate-600 whitespace-nowrap min-w-[65px] text-center">
                          {item.orders} {item.orders === 1 ? 'ped' : 'peds'}
                        </div>

                        {/* Valor Total */}
                        <div className="text-right flex-shrink-0 min-w-[125px]">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block leading-none mb-0.5">
                            Total:
                          </span>
                          <span className="text-sm font-extrabold text-slate-800 leading-tight">
                            R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Ranking;
