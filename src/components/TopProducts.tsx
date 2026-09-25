import React from 'react';
import type { TopProductItem } from '../services/api';
import { PackageCheck } from 'lucide-react';

interface TopProductsProps {
  items?: TopProductItem[];
  loading?: boolean;
}

const TopProducts: React.FC<TopProductsProps> = ({ items = [], loading = false }) => {
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  return (
    <div className="tv-card h-full flex flex-col justify-between">
      {/* Cabeçalho do Card */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <PackageCheck className="w-5 h-5 text-criffer-primary" />
          <h3 className="tv-section-title mb-0">Produtos Mais Vendidos</h3>
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2.5 py-1 rounded-md">Top 5</span>
      </div>

      {/* Lista de Produtos com barras mais encorpadas e melhor preenchimento */}
      <div className="flex-1 flex flex-col justify-around gap-4 min-h-[260px] py-1">
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12 font-medium">
            Carregando produtos...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12 font-medium">
            Nenhum produto faturado no período.
          </div>
        ) : (
          items.map((product, index) => (
            <div key={index} className="flex flex-col gap-1.5 group">
              <div className="flex justify-between items-end">
                <span
                  className="font-semibold text-gray-800 text-sm sm:text-base truncate mr-3 group-hover:text-criffer-primary transition-colors"
                  title={product.name}
                >
                  <span className="text-criffer-primary font-bold mr-1.5">{index + 1}.</span>
                  {product.name}
                </span>
                <div className="text-right flex-shrink-0">
                  <span className="block text-sm sm:text-base font-extrabold text-gray-900 leading-tight">
                    {formatCurrency(product.value)}
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {product.qty} {product.qty === 1 ? 'unidade' : 'unidades'}
                  </span>
                </div>
              </div>
              {/* Barra de Progresso Mais Grossa (h-3.5 = 14px) com Gradiente Corporativo */}
              <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-orange-400 to-criffer-primary h-full rounded-full transition-all duration-700 ease-out shadow-xs"
                  style={{ width: `${Math.max(6, product.progress)}%` }}
                ></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopProducts;
