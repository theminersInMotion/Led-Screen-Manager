import React from 'react';
import type { ScreenConfig, ProcessorPreset } from '../types';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Toggle } from './ui/Toggle';
import { VOLTAGE_OPTIONS, SYNC_PROCESSOR_PRESETS, ASYNC_PROCESSOR_PRESETS, STANDARD_DIAGONAL_INCHES } from '../constants';
import { useI18n } from '../i18n';

interface CalculatorFormProps {
  config: ScreenConfig;
  onConfigChange: (newConfig: Partial<ScreenConfig>) => void;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({ config, onConfigChange }) => {
  const { t } = useI18n();
    
  const handleInputChange = <K extends keyof ScreenConfig>(key: K, value: string) => {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && numericValue >= 0) {
        onConfigChange({ [key]: numericValue });
      } else if (value === '') {
        onConfigChange({ [key]: 0 as ScreenConfig[K]});
      }
  };

  const handlePresetClick = (preset: ProcessorPreset) => {
    onConfigChange({
      portCapacityPx: preset.capacity,
      processorPorts: preset.ports,
    });
  };

  const handleDiagonalPresetClick = (targetInches: number) => {
    const { cabinetWidthCm, cabinetHeightCm } = config;
    if (!cabinetWidthCm || !cabinetHeightCm) {
        alert("Please set cabinet physical dimensions first.");
        return;
    }

    const targetDiagonalCm = targetInches * 2.54;
    let bestFit = { h: 0, v: 0, diff: Infinity };
    
    // Search for best fit by iterating through possible vertical cabinet counts
    for (let v = 1; v < 40; v++) {
        const h_ideal = v * (16 / 9) * (cabinetHeightCm / cabinetWidthCm);
        
        // Check two candidate h values (floor and ceil) for the current v
        for (const h of [Math.floor(h_ideal), Math.ceil(h_ideal)]) {
            if (h <= 0) continue;

            const screenWidthCm = h * cabinetWidthCm;
            const screenHeightCm = v * cabinetHeightCm;
            const currentDiagonalCm = Math.sqrt(Math.pow(screenWidthCm, 2) + Math.pow(screenHeightCm, 2));
            
            const diff = Math.abs(currentDiagonalCm - targetDiagonalCm);

            if (diff < bestFit.diff) {
                bestFit = { h, v, diff };
            }
        }
    }

    if (bestFit.h > 0 && bestFit.v > 0) {
        onConfigChange({
            cabinetsHorizontal: bestFit.h,
            cabinetsVertical: bestFit.v,
        });
    }
  };
  
  const translatedVoltageOptions = React.useMemo(() => VOLTAGE_OPTIONS.map(option => ({
    label: t(option.key),
    value: option.value
  })), [t]);

  const presetsToShow = config.displayType === 'sync' ? SYNC_PROCESSOR_PRESETS : ASYNC_PROCESSOR_PRESETS;

  return (
    <Card title={t('configuration')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cabinet Resolution */}
        <div className="sm:col-span-2 font-semibold text-brand-text-secondary text-sm mb-[-8px]">{t('cabinetResolution')}</div>
        <Input
          label={t('widthPx')}
          type="number"
          value={config.cabinetWidthPx.toString()}
          onChange={(e) => handleInputChange('cabinetWidthPx', e.target.value)}
        />
        <Input
          label={t('heightPx')}
          type="number"
          value={config.cabinetHeightPx.toString()}
          onChange={(e) => handleInputChange('cabinetHeightPx', e.target.value)}
        />

        {/* Cabinet Physical Size */}
        <div className="sm:col-span-2 font-semibold text-brand-text-secondary text-sm mt-4 mb-[-8px]">{t('cabinetPhysicalSize')}</div>
        <Input
          label={t('widthCm')}
          type="number"
          value={config.cabinetWidthCm.toString()}
          onChange={(e) => handleInputChange('cabinetWidthCm', e.target.value)}
        />
        <Input
          label={t('heightCm')}
          type="number"
          value={config.cabinetHeightCm.toString()}
          onChange={(e) => handleInputChange('cabinetHeightCm', e.target.value)}
        />

        {/* Screen Layout */}
        <div className="sm:col-span-2 font-semibold text-brand-text-secondary text-sm mt-4 mb-[-8px]">{t('screenLayout')}</div>
        <Input
          label={t('cabinetsHorizontal')}
          type="number"
          value={config.cabinetsHorizontal.toString()}
          onChange={(e) => handleInputChange('cabinetsHorizontal', e.target.value)}
        />
        <Input
          label={t('cabinetsVertical')}
          type="number"
          value={config.cabinetsVertical.toString()}
          onChange={(e) => handleInputChange('cabinetsVertical', e.target.value)}
        />

        {/* Screen Size Helper */}
        <div className="sm:col-span-2 font-semibold text-brand-text-secondary text-sm mt-4 mb-[-8px]">{t('screenSizeHelper')}</div>
        <div className="sm:col-span-2">
            <p className="text-xs text-brand-text-secondary mb-2">{t('screenSizeHelperDescription')}</p>
            <div className="flex flex-wrap gap-2">
                {STANDARD_DIAGONAL_INCHES.map(inches => (
                    <button 
                      key={inches} 
                      onClick={() => handleDiagonalPresetClick(inches)}
                      className="bg-brand-primary border border-gray-600/80 text-brand-text-secondary text-xs font-semibold py-1 px-3 rounded-md hover:bg-brand-accent/20 hover:text-brand-accent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    >
                        {inches}"
                    </button>
                ))}
            </div>
        </div>
        
        {/* Power */}
        <div className="sm:col-span-2 font-semibold text-brand-text-secondary text-sm mt-4 mb-[-8px]">{t('power')}</div>
         <Input
          label={t('wattsPerCabinet')}
          type="number"
          value={config.powerPerCabinetW.toString()}
          onChange={(e) => handleInputChange('powerPerCabinetW', e.target.value)}
        />
        <Select
          label={t('voltage')}
          value={config.voltage}
          onChange={(e) => handleInputChange('voltage', e.target.value)}
          options={translatedVoltageOptions}
        />

        {/* Video Processor */}
        <div className="sm:col-span-2 font-semibold text-brand-text-secondary text-sm mt-4 mb-[-8px]">{t('novastarProcessor')}</div>
        <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">{t('displayType')}</label>
            <Toggle
                value={config.displayType}
                onChange={(newValue) => onConfigChange({ displayType: newValue as 'sync' | 'async' })}
                options={[
                    { value: 'sync', label: t('synchronous') },
                    { value: 'async', label: t('asynchronous') }
                ]}
            />
        </div>
        <div className="sm:col-span-2">
            <Input
              label={t('pixelsPerPort')}
              type="number"
              value={config.portCapacityPx.toString()}
              onChange={(e) => handleInputChange('portCapacityPx', e.target.value)}
              helperText={t('pixelsPerPortHelper')}
            />
        </div>
        <div className="sm:col-span-2 mt-4">
            <h3 className="font-semibold text-brand-text-secondary text-sm mb-2">
                {config.displayType === 'sync' ? t('vxProSeries') : t('tbSeries')}
            </h3>
            <ul className="space-y-2">
                {presetsToShow.map((preset) => (
                    <li key={preset.name} className="flex items-center justify-between bg-brand-primary p-2 rounded-md border border-gray-600/50">
                        <div>
                            <p className="font-semibold text-brand-text-primary text-sm">{t(preset.tKey)}</p>
                            <p className="text-xs text-brand-text-secondary">{t('processorPresetDetailsWithInputs', { capacity: preset.capacity.toLocaleString(), ports: preset.ports, inputs: preset.inputs })}</p>
                        </div>
                        <button
                            onClick={() => handlePresetClick(preset)}
                            className="bg-brand-accent/20 text-brand-accent text-xs font-bold py-1 px-3 rounded-md hover:bg-brand-accent/40 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            aria-label={`Use ${preset.name} settings`}
                        >
                            {t('use')}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
        
        {/* Cost Estimation */}
        <div className="sm:col-span-2 font-semibold text-brand-text-secondary text-sm mt-4 mb-[-8px]">{t('costEstimation')}</div>
        <Input
          label={t('pricePerCabinet')}
          type="number"
          value={config.cabinetPrice.toString()}
          onChange={(e) => handleInputChange('cabinetPrice', e.target.value)}
        />
        <Input
          label={t('pricePerProcessor')}
          type="number"
          value={config.processorPrice.toString()}
          onChange={(e) => handleInputChange('processorPrice', e.target.value)}
        />
        <Input
          label={t('playerQuantity')}
          type="number"
          value={config.playerQuantity.toString()}
          onChange={(e) => handleInputChange('playerQuantity', e.target.value)}
        />
        <Input
          label={t('pricePerPlayer')}
          type="number"
          value={config.playerPrice.toString()}
          // FIX: Corrected typo from 'pricePerPlayer' to 'playerPrice' to match ScreenConfig key.
          onChange={(e) => handleInputChange('playerPrice', e.target.value)}
        />
      </div>
    </Card>
  );
};
