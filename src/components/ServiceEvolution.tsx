import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useFluidSize } from '../utils/responsive';
import type { EvolutionData } from '../services/api';
import { TrendingUp } from 'lucide-react';

interface ServiceEvolutionProps {
  evolution?: EvolutionData;
  loading?: boolean;
}

const ServiceEvolution: React.FC<ServiceEvolutionProps> = ({ evolution, loading = false }) => {
  const days = evolution?.days?.length
    ? evolution.days
    : ['01/09', '05/09', '10/09', '15/09', '20/09', '25/09', '30/09'];
  const revenue = evolution?.revenue?.length
    ? evolution.revenue
    : [0, 0, 0, 0, 0, 0, 0];
  const orders = evolution?.orders?.length
    ? evolution.orders
    : [0, 0, 0, 0, 0, 0, 0];

  const axisFontSize = useFluidSize(11, 14);
  const legendFontSize = useFluidSize(11, 15);
  const tooltipFontSize = useFluidSize(12, 16);

  const option = {
    color: ['#FF6A22', '#3b82f6'],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      textStyle: { fontSize: tooltipFontSize },
      formatter: function (params: any) {
        let res = `<div style="font-weight:700;margin-bottom:4px;">Dia ${params[0].axisValue}</div>`;
        params.forEach((item: any) => {
          if (item.seriesName === 'Faturamento') {
            res += `<div>${item.marker} ${item.seriesName}: <b>R$ ${Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></div>`;
          } else {
            res += `<div>${item.marker} ${item.seriesName}: <b>${item.value} notas</b></div>`;
          }
        });
        return res;
      },
    },
    legend: {
      data: ['Faturamento', 'Notas Faturadas'],
      top: 0,
      icon: 'circle',
      textStyle: { fontSize: legendFontSize },
    },
    grid: {
      top: 35,
      bottom: 25,
      left: 60,
      right: 45,
    },
    xAxis: [
      {
        type: 'category',
        data: days,
        axisLabel: {
          fontSize: axisFontSize,
          interval: days.length > 20 ? 3 : 'auto',
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: '',
        min: 0,
        axisLabel: {
          formatter: (val: number) => `R$ ${(val / 1000).toFixed(0)}k`,
          fontSize: axisFontSize,
        },
        splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
      },
      {
        type: 'value',
        name: '',
        min: 0,
        axisLabel: { formatter: '{value}', fontSize: axisFontSize },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Faturamento',
        type: 'bar',
        data: revenue,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: '#FF6A22',
        },
        barMaxWidth: '35%',
      },
      {
        name: 'Notas Faturadas',
        type: 'line',
        yAxisIndex: 1,
        data: orders,
        smooth: true,
        symbolSize: 6,
        lineStyle: { width: 2.5, color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
      },
    ],
  };

  return (
    <div className="tv-card h-full flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-criffer-primary" />
          <h3 className="tv-section-title mb-0">Evolução de Vendas no Mês</h3>
        </div>
      </div>
      <div className="flex-1 min-h-[180px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Carregando evolução...
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

export default ServiceEvolution;
