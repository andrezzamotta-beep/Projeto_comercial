import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useFluidSize } from '../utils/responsive';
import type { QuotationsData } from '../services/api';
import { TrendingUp } from 'lucide-react';

interface QuotationsEvolutionProps {
  data?: QuotationsData;
  loading?: boolean;
}

const QuotationsEvolution: React.FC<QuotationsEvolutionProps> = ({ data, loading = false }) => {
  const axisFontSize = useFluidSize(12, 18);
  const legendFontSize = useFluidSize(12, 20);
  const tooltipFontSize = useFluidSize(14, 24);

  const defaultMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const months = data?.months || defaultMonths;
  const josiData = data?.josi || [0, 0, 0, 0, 0, 0];
  const vanessaData = data?.vanessa || [0, 0, 0, 0, 0, 0];

  const option = {
    color: ['#FF6A22', '#8b5cf6'], // Laranja Criffer e Roxo
    tooltip: {
      trigger: 'axis',
      textStyle: { fontSize: tooltipFontSize },
      position: function (point: any) {
        return [point[0], 10];
      },
      formatter: function (params: any) {
        let result = `<div style="font-weight: bold; margin-bottom: 5px;">${params[0].name}</div>`;
        params.forEach((param: any) => {
          result += `<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <span><span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>${param.seriesName}</span>
            <span style="font-weight: bold;">R$ ${param.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>`;
        });
        return result;
      }
    },
    legend: {
      data: ['Josi', 'Vanessa'],
      top: 0,
      icon: 'circle',
      textStyle: { fontSize: legendFontSize, color: '#4b5563' }
    },
    grid: {
      top: 40,
      bottom: 20,
      left: 60,
      right: 30
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months,
      axisLabel: {
        fontSize: axisFontSize,
        color: '#6b7280',
        interval: months.length > 20 ? 3 : 'auto'
      },
      axisLine: { lineStyle: { color: '#e5e7eb' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (val: number) => `R$ ${(val / 1000).toFixed(0)}k`,
        fontSize: axisFontSize,
        color: '#6b7280'
      },
      splitLine: {
        lineStyle: { type: 'dashed', color: '#f3f4f6' }
      }
    },
    series: [
      {
        name: 'Josi',
        type: 'line',
        data: josiData,
        smooth: true,
        symbolSize: 8,
        lineStyle: { width: 3 },
        areaStyle: {
          opacity: 0.1,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#FF6A22' }, { offset: 1, color: 'rgba(255, 106, 34, 0)' }]
          }
        }
      },
      {
        name: 'Vanessa',
        type: 'line',
        data: vanessaData,
        smooth: true,
        symbolSize: 8,
        lineStyle: { width: 3 },
        areaStyle: {
          opacity: 0.1,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#8b5cf6' }, { offset: 1, color: 'rgba(139, 92, 246, 0)' }]
          }
        }
      }
    ]
  };

  return (
    <div className="tv-card h-full flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-criffer-primary" />
          <h3 className="tv-section-title mb-0">Locações</h3>
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Josi & Vanessa
        </span>
      </div>
      <div className="flex-1 min-h-[180px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Carregando locações...
          </div>
        ) : (
          <ReactECharts
            option={option}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        )}
      </div>
    </div>
  );
};

export default QuotationsEvolution;
