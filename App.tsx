

import React, { useState, useMemo, useCallback } from 'react';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import type { ScreenConfig, CalculationResults, BreakerResult } from './types';
import { VOLTAGE_OPTIONS, SYNC_PROCESSOR_PRESETS, ASYNC_PROCESSOR_PRESETS } from './constants';
import { Logo } from './components/icons/Logo';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useI18n } from './i18n';

const App: React.FC = () => {
  const { t } = useI18n();
  const [config, setConfig] = useState<ScreenConfig>({
    cabinetWidthPx: 128,
    cabinetHeightPx: 128,
    cabinetWidthCm: 50,
    cabinetHeightCm: 50,
    cabinetsHorizontal: 16,
    cabinetsVertical: 9,
    powerPerCabinetW: 200,
    voltage: VOLTAGE_OPTIONS[0].value,
    portCapacityPx: SYNC_PROCESSOR_PRESETS[0].capacity, // Default to VX400
    processorPorts: SYNC_PROCESSOR_PRESETS[0].ports,
    cabinetPrice: 0,
    processorPrice: 0,
    playerPrice: 0,
    playerQuantity: 1,
    displayType: 'sync',
  });

  const handleConfigChange = useCallback((newConfig: Partial<ScreenConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const calculations = useMemo<CalculationResults>(() => {
    const {
      cabinetWidthPx,
      cabinetHeightPx,
      cabinetWidthCm,
      cabinetHeightCm,
      cabinetsHorizontal,
      cabinetsVertical,
      powerPerCabinetW,
      voltage,
      portCapacityPx,
      processorPorts,
      cabinetPrice,
      processorPrice,
      playerPrice,
      playerQuantity,
    } = config;

    if (
      !cabinetWidthPx || !cabinetHeightPx || !cabinetsHorizontal || !cabinetsVertical || 
      !powerPerCabinetW || !portCapacityPx || !cabinetWidthCm || !cabinetHeightCm
    ) {
      return {
        totalWidthPx: 0,
        totalHeightPx: 0,
        totalCabinets: 0,
        totalPixels: 0,
        aspectRatio: '0:0',
        totalPowerW: 0,
        totalAmps: 0,
        breakerResults: [],
        cabinetsPerBreaker: [],
        requiredPorts: 0,
        totalProcessors: 0,
        cabinetsPerPort: 0,
        totalWidthM: 0,
        totalHeightM: 0,
        totalWidthFt: 0,
        totalHeightFt: 0,
        totalWidthIn: 0,
        totalHeightIn: 0,
        totalCabinetPrice: 0,
        totalProcessorPrice: 0,
        totalPlayerPrice: 0,
        grandTotalPrice: 0,
      };
    }

    const totalWidthPx = cabinetWidthPx * cabinetsHorizontal;
    const totalHeightPx = cabinetHeightPx * cabinetsVertical;
    const totalPixels = totalWidthPx * totalHeightPx;
    const totalCabinets = cabinetsHorizontal * cabinetsVertical;
    const totalPowerW = powerPerCabinetW * totalCabinets;
    const totalAmps = voltage > 0 ? totalPowerW / voltage : 0;

    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(totalWidthPx, totalHeightPx);
    // FIX: Prevent division by zero when calculating aspect ratio if total resolution is zero.
    const aspectRatio = divisor > 0 ? `${totalWidthPx / divisor}:${totalHeightPx / divisor}` : '0:0';

    const selectedVoltageStandard = VOLTAGE_OPTIONS.find(v => v.value === voltage) || VOLTAGE_OPTIONS[0];

    const ampsPerCabinet = voltage > 0 ? powerPerCabinetW / voltage : 0;
    const cabinetsPerBreaker: BreakerResult[] = selectedVoltageStandard.breakers.map(breakerAmps => {
        const safeAmps = breakerAmps * 0.8;
        const count = ampsPerCabinet > 0 ? Math.floor(safeAmps / ampsPerCabinet) : 0;
        return { amps: breakerAmps, count: isNaN(count) ? 0 : count };
    });
    
    // FIX: Calculate total breakers based on cabinet grouping, not total amperage, to avoid rounding discrepancies.
    const breakerResults: BreakerResult[] = selectedVoltageStandard.breakers.map((breakerAmps, index) => {
      const cabinetsOnThisBreakerType = cabinetsPerBreaker[index]?.count || 0;
      const count = cabinetsOnThisBreakerType > 0 ? Math.ceil(totalCabinets / cabinetsOnThisBreakerType) : 0;
      return { amps: breakerAmps, count: isNaN(count) ? 0 : count };
    });

    const requiredPorts = portCapacityPx > 0 ? Math.ceil(totalPixels / portCapacityPx) : 0;
    
    const allPresets = [...SYNC_PROCESSOR_PRESETS, ...ASYNC_PROCESSOR_PRESETS];
    const selectedPreset = allPresets.find(p => p.capacity === portCapacityPx && p.ports === processorPorts);

    let totalProcessors = 0;
    if (selectedPreset && selectedPreset.type === 'async') {
        const processorsByPixels = selectedPreset.totalCapacity > 0 ? Math.ceil(totalPixels / selectedPreset.totalCapacity) : 0;
        const processorsByPorts = processorPorts > 0 ? Math.ceil(requiredPorts / processorPorts) : 0;
        totalProcessors = Math.max(processorsByPixels, processorsByPorts);
    } else { // Sync or custom config
        totalProcessors = processorPorts > 0 ? Math.ceil(requiredPorts / processorPorts) : 0;
    }

    const pixelsPerCabinet = cabinetWidthPx * cabinetHeightPx;
    const cabinetsPerPort = pixelsPerCabinet > 0 ? Math.floor(portCapacityPx / pixelsPerCabinet) : 0;

    const totalWidthM = (cabinetsHorizontal * cabinetWidthCm) / 100;
    const totalHeightM = (cabinetsVertical * cabinetHeightCm) / 100;
    const totalWidthFt = totalWidthM * 3.28084;
    const totalHeightFt = totalHeightM * 3.28084;
    const totalWidthIn = totalWidthM * 39.3701;
    const totalHeightIn = totalHeightM * 39.3701;

    const totalCabinetPrice = totalCabinets * cabinetPrice;
    const totalProcessorPrice = totalProcessors * processorPrice;
    const totalPlayerPrice = playerQuantity * playerPrice;
    const grandTotalPrice = totalCabinetPrice + totalProcessorPrice + totalPlayerPrice;

    return {
      totalWidthPx,
      totalHeightPx,
      totalCabinets,
      totalPixels,
      aspectRatio,
      totalPowerW,
      totalAmps,
      breakerResults,
      cabinetsPerBreaker,
      requiredPorts,
      totalProcessors,
      cabinetsPerPort,
      totalWidthM,
      totalHeightM,
      totalWidthFt,
      totalHeightFt,
      totalWidthIn,
      totalHeightIn,
      totalCabinetPrice,
      totalProcessorPrice,
      totalPlayerPrice,
      grandTotalPrice,
    };
  }, [config]);

  return (
    <div className="min-h-screen bg-brand-primary text-brand-text-primary p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Logo />
            <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">{t('appName')}</h1>
          </div>
          <LanguageSwitcher />
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <CalculatorForm config={config} onConfigChange={handleConfigChange} />
          </div>
          <div className="lg:col-span-2">
            <ResultsDisplay results={calculations} config={config} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
