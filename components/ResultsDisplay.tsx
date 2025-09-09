
import React from 'react';
import type { CalculationResults, ScreenConfig } from '../types';
import { ResultCard } from './ui/ResultCard';
import { PixelIcon, RatioIcon, PowerIcon, BreakerIcon, CableIcon } from './icons';
import { WiringDiagram } from './WiringDiagram';

interface ResultsDisplayProps {
  results: CalculationResults;
  config: ScreenConfig;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, config }) => {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-brand-text-primary">Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Row 1: Screen Specs */}
          <ResultCard
            icon={<PixelIcon />}
            label="Total Resolution"
            value={`${results.totalWidthPx.toLocaleString()} x ${results.totalHeightPx.toLocaleString()} px`}
            subValue={`${results.totalPixels.toLocaleString()} pixels`}
          />
          <ResultCard
            icon={<RatioIcon />}
            label="Aspect Ratio"
            value={results.aspectRatio}
          />
          <ResultCard
            icon={<PowerIcon />}
            label="Total Power Draw"
            value={`${results.totalPowerW.toLocaleString()} W`}
            subValue={`${results.totalAmps.toFixed(2)} Amps`}
          />
          
          {/* Row 2: Infrastructure Totals */}
          <ResultCard
            icon={<BreakerIcon />}
            label="Total 15A Breakers"
            value={`${results.breakers15A.toLocaleString()}`}
            subValue="at 80% capacity"
          />
           <ResultCard
            icon={<BreakerIcon />}
            label="Total 20A Breakers"
            value={`${results.breakers20A.toLocaleString()}`}
            subValue="at 80% capacity"
          />
          <ResultCard
            icon={<CableIcon />}
            label="Total Novastar RJ45 Ports"
            value={`${results.requiredPorts.toLocaleString()}`}
          />

          {/* Row 3: Unit Capacity */}
          <ResultCard
            icon={<BreakerIcon />}
            label="Cabinets per 15A Breaker"
            value={`${results.cabinetsPer15ABreaker.toLocaleString()}`}
            subValue="at 80% capacity"
          />
          <ResultCard
            icon={<BreakerIcon />}
            label="Cabinets per 20A Breaker"
            value={`${results.cabinetsPer20ABreaker.toLocaleString()}`}
            subValue="at 80% capacity"
          />
          <ResultCard
            icon={<CableIcon />}
            label="Cabinets per RJ45 Port"
            value={`${results.cabinetsPerPort.toLocaleString()}`}
            subValue="max per port"
          />
        </div>
      </div>
      <WiringDiagram config={config} results={results} />
    </div>
  );
};
