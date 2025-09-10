import React from 'react';
import type { CalculationResults, ScreenConfig } from '../types';
import { ResultCard } from './ui/ResultCard';
import { PixelIcon, RatioIcon, PowerIcon, BreakerIcon, CableIcon, DimensionIcon, ProcessorIcon, CabinetIcon, PriceIcon, PlayerIcon } from './icons';
import { WiringDiagram } from './WiringDiagram';
import { PROCESSOR_PRESETS } from '../constants';
import { useI18n } from '../i18n';

interface ResultsDisplayProps {
  results: CalculationResults;
  config: ScreenConfig;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, config }) => {
  const { t } = useI18n();
  const selectedProcessor = PROCESSOR_PRESETS.find(p => p.capacity === config.portCapacityPx && p.ports === config.processorPorts);
  const processorName = selectedProcessor ? t(selectedProcessor.tKey) : t('customConfig');
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-brand-text-primary">{t('summary')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Row 1: Screen Specs */}
          <ResultCard
            icon={<PixelIcon />}
            label={t('totalResolution')}
            value={`${results.totalWidthPx.toLocaleString()} x ${results.totalHeightPx.toLocaleString()} px`}
            subValue={`${results.totalPixels.toLocaleString()} ${t('pixels')}`}
          />
          <ResultCard
            icon={<CabinetIcon />}
            label={t('totalCabinets')}
            value={results.totalCabinets.toLocaleString()}
            subValue={t('cabinetsLayout', {h: config.cabinetsHorizontal, v: config.cabinetsVertical})}
          />
          <ResultCard
            icon={<DimensionIcon />}
            label={t('totalScreenSize')}
            value={`${results.totalWidthM.toFixed(2)}m x ${results.totalHeightM.toFixed(2)}m`}
            subValue={`${results.totalWidthFt.toFixed(2)}' x ${results.totalHeightFt.toFixed(2)}' (${results.totalWidthIn.toFixed(0)}" x ${results.totalHeightIn.toFixed(0)}")`}
          />
          <ResultCard
            icon={<RatioIcon />}
            label={t('aspectRatio')}
            value={results.aspectRatio}
          />
          
          {/* Row 2: Infrastructure Totals */}
          <ResultCard
            icon={<PowerIcon />}
            label={t('totalPowerDraw')}
            value={`${results.totalPowerW.toLocaleString()} W`}
            subValue={`${results.totalAmps.toFixed(2)} ${t('amps')}`}
          />
          <ResultCard
            icon={<CableIcon />}
            label={t('totalNovastarPorts')}
            value={`${results.requiredPorts.toLocaleString()}`}
          />
          <ResultCard
            icon={<ProcessorIcon />}
            label={t('processorsNeeded')}
            value={`${results.totalProcessors.toLocaleString()}`}
            subValue={processorName}
          />

          {/* Row 3: Cost Estimation (Conditional) */}
          {results.grandTotalPrice > 0 && (
            <>
              <ResultCard
                icon={<PriceIcon />}
                label={t('totalCabinetCost')}
                value={formatCurrency(results.totalCabinetPrice)}
                subValue={config.cabinetPrice > 0 ? `${formatCurrency(config.cabinetPrice)} ${t('perCabinet')}` : undefined}
              />
              <ResultCard
                icon={<PriceIcon />}
                label={t('totalProcessorCost')}
                value={formatCurrency(results.totalProcessorPrice)}
                subValue={config.processorPrice > 0 ? `${results.totalProcessors} x ${formatCurrency(config.processorPrice)}` : undefined}
              />
              <ResultCard
                icon={<PlayerIcon />}
                label={t('totalPlayerCost')}
                value={formatCurrency(results.totalPlayerPrice)}
                subValue={config.playerPrice > 0 ? `${config.playerQuantity} x ${formatCurrency(config.playerPrice)}` : undefined}
              />
              <ResultCard
                icon={<PriceIcon />}
                label={t('grandTotal')}
                value={formatCurrency(results.grandTotalPrice)}
                subValue={t('grandTotalSub')}
              />
            </>
          )}

          {/* Row 4: Breaker Totals */}
          {results.breakerResults.map(breaker => (
            <ResultCard
              key={`total-breaker-${breaker.amps}`}
              icon={<BreakerIcon />}
              label={t('totalBreakers', { amps: breaker.amps })}
              value={breaker.count.toLocaleString()}
              subValue={t('at80Capacity')}
            />
          ))}

          {/* Row 5: Unit Capacity */}
          {results.cabinetsPerBreaker.map(breaker => (
            <ResultCard
              key={`cabinets-per-breaker-${breaker.amps}`}
              icon={<BreakerIcon />}
              label={t('cabinetsPerBreaker', { amps: breaker.amps })}
              value={breaker.count.toLocaleString()}
              subValue={t('at80Capacity')}
            />
          ))}
          <ResultCard
            icon={<CableIcon />}
            label={t('cabinetsPerRJ45Port')}
            value={`${results.cabinetsPerPort.toLocaleString()}`}
            subValue={t('maxPerPort')}
          />
        </div>
      </div>
      <WiringDiagram config={config} results={results} />
    </div>
  );
};
