import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useFluidSize } from '../utils/responsive';
import type { GeoDistributionItem } from '../services/api';

interface CommercialMapProps {
  items?: GeoDistributionItem[];
  loading?: boolean;
}

// Coordenadas geográficas [longitude, latitude] dos estados do Brasil
const STATE_COORDINATES: Record<string, { name: string; coords: [number, number] }> = {
  SP: { name: 'São Paulo', coords: [-46.6333, -23.5505] },
  RJ: { name: 'Rio de Janeiro', coords: [-43.1729, -22.9068] },
  MG: { name: 'Minas Gerais', coords: [-43.9378, -19.9208] },
  PR: { name: 'Paraná', coords: [-49.2731, -25.4284] },
  RS: { name: 'Rio Grande do Sul', coords: [-51.2177, -30.0277] },
  BA: { name: 'Bahia', coords: [-38.5124, -12.9714] },
  PE: { name: 'Pernambuco', coords: [-34.8811, -8.0476] },
  SC: { name: 'Santa Catarina', coords: [-48.5482, -27.5954] },
  GO: { name: 'Goiás', coords: [-49.2648, -16.6869] },
  ES: { name: 'Espírito Santo', coords: [-40.3377, -20.3155] },
  CE: { name: 'Ceará', coords: [-38.5267, -3.7319] },
  PA: { name: 'Pará', coords: [-48.5044, -1.4558] },
  MA: { name: 'Maranhão', coords: [-44.3028, -2.5307] },
  MT: { name: 'Mato Grosso', coords: [-56.0967, -15.6010] },
  MS: { name: 'Mato Grosso do Sul', coords: [-54.6464, -20.4428] },
  PB: { name: 'Paraíba', coords: [-34.8610, -7.1150] },
  RN: { name: 'Rio Grande do Norte', coords: [-35.2094, -5.7945] },
  AL: { name: 'Alagoas', coords: [-35.7353, -9.6658] },
  SE: { name: 'Sergipe', coords: [-37.0731, -10.9472] },
  PI: { name: 'Piauí', coords: [-42.8019, -5.0892] },
  AM: { name: 'Amazonas', coords: [-60.0250, -3.1019] },
  RO: { name: 'Rondônia', coords: [-63.9039, -8.7619] },
  AC: { name: 'Acre', coords: [-67.8100, -9.9747] },
  AP: { name: 'Amapá', coords: [-51.0664, 0.0349] },
  RR: { name: 'Roraima', coords: [-60.6733, 2.8235] },
  TO: { name: 'Tocantins', coords: [-48.3336, -10.1844] },
  DF: { name: 'Distrito Federal', coords: [-47.9297, -15.7801] },
};

const CommercialMap: React.FC<CommercialMapProps> = ({ items = [], loading = false }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const tooltipFontSize = useFluidSize(14, 24);

  useEffect(() => {
    fetch('/data/brazil.json')
      .then(res => res.json())
      .then(geoJson => {
        echarts.registerMap('Brazil', geoJson);
        setMapLoaded(true);
      })
      .catch(err => {
        console.error("Erro ao carregar mapa do Brasil", err);
      });
  }, []);

  if (!mapLoaded || loading) {
    return (
      <div className="tv-card justify-center items-center h-full min-h-[400px]">
        <div className="text-criffer-primary font-medium text-xl animate-pulse flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-criffer-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Carregando dados do mapa...</span>
        </div>
      </div>
    );
  }

  // Processar dados reais da API
  const maxVal = items.length > 0 ? Math.max(...items.map(i => i.value), 1) : 1;

  const salesData = items
    .map(item => {
      const ufUpper = (item.uf || '').toUpperCase().trim();
      const info = STATE_COORDINATES[ufUpper];
      if (!info) return null;
      return {
        name: `${info.name} (${ufUpper})`,
        value: [...info.coords, item.value, item.orders]
      };
    })
    .filter(Boolean);

  // Caso ainda não existam dados retornados, mantemos pontos padrão para não quebrar o layout
  const fallbackSalesData = salesData.length > 0 ? salesData : [
    { name: 'São Paulo (SP)', value: [-46.6333, -23.5505, 500000, 120] },
    { name: 'Rio de Janeiro (RJ)', value: [-43.1729, -22.9068, 300000, 80] },
    { name: 'Minas Gerais (MG)', value: [-43.9378, -19.9208, 250000, 65] },
    { name: 'Paraná (PR)', value: [-49.2731, -25.4284, 200000, 45] },
    { name: 'Rio Grande do Sul (RS)', value: [-51.2177, -30.0277, 180000, 40] },
  ];

  const displaySalesData = salesData.length > 0 ? salesData : fallbackSalesData;

  const servicesData = [
    { name: 'São Paulo', value: [-46.6333, -23.5505] },
    { name: 'Paraná', value: [-49.2731, -25.4284] },
    { name: 'Minas Gerais', value: [-43.9378, -19.9208] },
  ];

  const rentalsData = [
    { name: 'Rio de Janeiro', value: [-43.1729, -22.9068] },
    { name: 'Bahia', value: [-38.5124, -12.9714] },
  ];

  // SVG paths para ícones de serviços e locações
  const gearPath = 'path://M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z';
  const contractPath = 'path://M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z M14.487 7.858A1 1 0 0 1 14 7V2 M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516 M8 18h1';

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      textStyle: { fontSize: tooltipFontSize },
      formatter: function (params: any) {
        if (params.seriesName === 'Vendas' && Array.isArray(params.value)) {
          const valNum = params.value[2] || 0;
          const valorFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valNum);
          const qtdPedidos = params.value[3] !== undefined ? params.value[3] : '-';
          return `<div class="font-sans font-bold text-gray-900">${params.name}</div>
                  <div class="text-sm text-criffer-primary font-bold mt-1">Faturamento: ${valorFormatted}</div>
                  <div class="text-xs text-gray-600">Pedidos/NFs: ${qtdPedidos}</div>`;
        }
        return `<div class="font-sans font-medium">${params.name}</div>${params.seriesName}`;
      }
    },
    geo: {
      map: 'Brazil',
      roam: true,
      zoom: 1.2,
      itemStyle: {
        areaColor: '#f3f4f6', // cinza muito claro
        borderColor: '#ffffff',
        borderWidth: 1.5,
      },
      emphasis: {
        itemStyle: {
          areaColor: '#e5e7eb'
        },
        label: { show: false }
      }
    },
    series: [
      {
        name: 'Vendas',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: displaySalesData,
        symbolSize: function (val: any) {
          if (!Array.isArray(val) || val[2] === undefined) return 14;
          const ratio = val[2] / maxVal;
          return Math.min(45, Math.max(14, Math.round(ratio * 38)));
        },
        itemStyle: {
          color: 'rgba(255, 106, 34, 0.85)',
          shadowBlur: 12,
          shadowColor: 'rgba(255, 106, 34, 0.4)'
        }
      },
      {
        name: 'Serviços',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: servicesData,
        symbol: gearPath,
        symbolSize: 24,
        itemStyle: {
          color: '#1f2937' // dark gray
        },
        zlevel: 1
      },
      {
        name: 'Locações',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: rentalsData,
        symbol: contractPath,
        symbolSize: 24,
        itemStyle: {
          color: '#3b82f6' // blue
        },
        zlevel: 1
      }
    ]
  };

  return (
    <div className="tv-card flex-1 min-h-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="tv-section-title mb-2!">Mapa Comercial</h3>
          <p className="tv-subtitle">Distribuição geográfica de vendas por estado</p>
        </div>
        <div className="flex gap-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-criffer-primary opacity-85"></div>
            <span className="tv-list-item">Vendas por Estado</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-800"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span className="tv-list-item">Serviços</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z" />
                <path d="M14.487 7.858A1 1 0 0 1 14 7V2" />
                <path d="M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516" />
                <path d="M8 18h1" />
              </svg>
            </div>
            <span className="tv-list-item">Locações</span>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full relative min-h-0">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
};

export default CommercialMap;
