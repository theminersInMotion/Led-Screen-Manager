
import React, { useState, useMemo, useCallback } from 'react';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import type { ScreenConfig, CalculationResults } from './types';
import { VOLTAGE_OPTIONS, NOVASTAR_PORT_CAPACITY } from './constants';
import { Logo } from './components/icons/Logo';

const App: React.FC = () => {
  const [config, setConfig] = useState<ScreenConfig>({
    cabinetWidthPx: 128,
    cabinetHeightPx: 128,
    cabinetWidthCm: 50,
    cabinetHeightCm: 50,
    cabinetsHorizontal: 16,
    cabinetsVertical: 9,
    powerPerCabinetW: 150,
    voltage: VOLTAGE_OPTIONS[0].value,
    portCapacityPx: NOVASTAR_PORT_CAPACITY,
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
      portCapacityPx
    } = config;

    if (
      !cabinetWidthPx || !cabinetHeightPx || !cabinetsHorizontal || !cabinetsVertical || 
      !powerPerCabinetW || !voltage || !portCapacityPx || !cabinetWidthCm || !cabinetHeightCm
    ) {
      return {
        totalWidthPx: 0,
        totalHeightPx: 0,
        totalPixels: 0,
        aspectRatio: '0:0',
        totalPowerW: 0,
        totalAmps: 0,
        breakers15A: 0,
        breakers20A: 0,
        requiredPorts: 0,
        cabinetsPerPort: 0,
        cabinetsPer15ABreaker: 0,
        cabinetsPer20ABreaker: 0,
        totalWidthM: 0,
        totalHeightM: 0,
        totalWidthFt: 0,
        totalHeightFt: 0,
        totalWidthIn: 0,
        totalHeightIn: 0,
      };
    }

    const totalWidthPx = cabinetWidthPx * cabinetsHorizontal;
    const totalHeightPx = cabinetHeightPx * cabinetsVertical;
    const totalPixels = totalWidthPx * totalHeightPx;
    const totalCabinets = cabinetsHorizontal * cabinetsVertical;
    const totalPowerW = powerPerCabinetW * totalCabinets;
    const totalAmps = totalPowerW / voltage;

    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(totalWidthPx, totalHeightPx);
    const aspectRatio = `${totalWidthPx / divisor}:${totalHeightPx / divisor}`;

    const AMPS_15A_80_PERCENT = 15 * 0.8;
    const AMPS_20A_80_PERCENT = 20 * 0.8;
    const breakers15A = Math.ceil(totalAmps / AMPS_15A_80_PERCENT);
    const breakers20A = Math.ceil(totalAmps / AMPS_20A_80_PERCENT);

    const requiredPorts = Math.ceil(totalPixels / portCapacityPx);
    
    const pixelsPerCabinet = cabinetWidthPx * cabinetHeightPx;
    const cabinetsPerPort = pixelsPerCabinet > 0 ? Math.floor(portCapacityPx / pixelsPerCabinet) : 0;
    
    const ampsPerCabinet = powerPerCabinetW / voltage;
    const cabinetsPer15ABreaker = ampsPerCabinet > 0 ? Math.floor(AMPS_15A_80_PERCENT / ampsPerCabinet) : 0;
    const cabinetsPer20ABreaker = ampsPerCabinet > 0 ? Math.floor(AMPS_20A_80_PERCENT / ampsPerCabinet) : 0;

    const totalWidthM = (cabinetsHorizontal * cabinetWidthCm) / 100;
    const totalHeightM = (cabinetsVertical * cabinetHeightCm) / 100;
    const totalWidthFt = totalWidthM * 3.28084;
    const totalHeightFt = totalHeightM * 3.28084;
    const totalWidthIn = totalWidthM * 39.3701;
    const totalHeightIn = totalHeightM * 39.3701;

    return {
      totalWidthPx,
      totalHeightPx,
      totalPixels,
      aspectRatio,
      totalPowerW,
      totalAmps,
      breakers15A: isNaN(breakers15A) ? 0 : breakers15A,
      breakers20A: isNaN(breakers20A) ? 0 : breakers20A,
      requiredPorts: isNaN(requiredPorts) ? 0 : requiredPorts,
      cabinetsPerPort: isNaN(cabinetsPerPort) ? 0 : cabinetsPerPort,
      cabinetsPer15ABreaker: isNaN(cabinetsPer15ABreaker) ? 0 : cabinetsPer15ABreaker,
      cabinetsPer20ABreaker: isNaN(cabinetsPer20ABreaker) ? 0 : cabinetsPer20ABreaker,
      totalWidthM,
      totalHeightM,
      totalWidthFt,
      totalHeightFt,
      totalWidthIn,
      totalHeightIn,
    };
  }, [config]);

  return (
    <div className="min-h-screen bg-brand-primary p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Logo />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-text-primary tracking-tight">
              LED Screen Manager
            </h1>
            <p className="text-brand-text-secondary text-sm sm:text-base">
              Calculate specifications for your video wall setup.
            </p>
          </div>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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