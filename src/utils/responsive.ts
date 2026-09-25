import { useState, useEffect } from 'react';

/**
 * Hook para calcular o tamanho de fonte fluido para o ECharts
 * Baseado no window.innerWidth, escalando de minWidth (1024px) até maxWidth (3840px).
 */
export const useFluidSize = (minPx: number, maxPx: number): number => {
  const [size, setSize] = useState(minPx);

  useEffect(() => {
    const handleResize = () => {
      const minWidth = 1024; // Monitor de 27" (approx)
      const maxWidth = 3840; // TV 4K de 65"
      const currentWidth = window.innerWidth;
      
      if (currentWidth <= minWidth) {
        setSize(minPx);
      } else if (currentWidth >= maxWidth) {
        setSize(maxPx);
      } else {
        const percentage = (currentWidth - minWidth) / (maxWidth - minWidth);
        setSize(Math.round(minPx + percentage * (maxPx - minPx)));
      }
    };

    handleResize(); // Chamada inicial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [minPx, maxPx]);

  return size;
};
