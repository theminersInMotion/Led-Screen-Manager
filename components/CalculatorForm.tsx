
import React from 'react';
import type { ScreenConfig, ProcessorPreset } from '../types';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { VOLTAGE_OPTIONS, PROCESSOR_PRESETS } from '../constants';

interface CalculatorFormProps {
  config: ScreenConfig;
  onConfigChange: (newConfig: Partial<ScreenConfig>) => void;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({ config, onConfigChange }) => {
    
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

  return (
    <Card title="Configuration">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cabinet Resolution */}
        <div className="sm:col-span-2 font-semibold text-brand-text-secondary text-sm mb-[-8px]">CABINET RESOLUTION</div>
        <Input
          label="Width (px)"
          type="number"
          value={config.cabinetWidthPx.toString()}
          onChange={(e) => handleInputChange('cabinetWidthPx', e.target.value)}
        />
        <Input
          label="Height (px)"
          type="number"
          value={config.cabinetHeightPx.toString()}
          onChange={(e) => handleInputChange('cabinetHeightPx', e.target.value)}
        />

        {/* Cabinet Physical Size */}
        <div className="sm:col-span-2 font-semibold text-brand-text-secondary text-sm mt-4 mb-[-8px]">CABINET PHYSICAL SIZE</div>
        <Input
          label="Width (cm)"
          type="number"
          value={config.cabinetWidthCm.toString()}
          onChange={(e) => handleInputChange('cabinetWidthCm', e.target.value)}
        />
        <Input
          label="Height (cm)"
          type="number"
          value={config.cabinetHeightCm.toString()}
          onChange={(e) => handleInputChange('cabinetHeightCm', e.target.value)}
        />

        {/* Screen Layout */}
        <div className="sm:col-span-2 font-semibold text-brand-text-secondary text-sm mt-4 mb-[-8px]">SCREEN LAYOUT</div>
        <Input
          label="Cabinets Horizontal"
          type="number"
          value={config.cabinetsHorizontal.toString()}
          onChange={(e) => handleInputChange('cabinetsHorizontal', e.target.value)}
        />
        <Input
          label="Cabinets Vertical"
          type="number"
          value={config.cabinetsVertical.toString()}
          onChange={(e) => handleInputChange('cabinetsVertical', e.target.value)}
        />
        
        {/* Power */}
        <div className="sm:col-span-2 font-semibold text-brand-text-secondary text-sm mt-4 mb-[-8px]">POWER</div>
         <Input
          label="Watts per Cabinet"
          type="number"
          value={config.powerPerCabinetW.toString()}
          onChange={(e) => handleInputChange('powerPerCabinetW', e.target.value)}
        />
        <Select
          label="Voltage"
          value={config.voltage}
          onChange={(e) => handleInputChange('voltage', e.target.value)}
          options={VOLTAGE_OPTIONS}
        />

        {/* Video Processor */}
        <div className="sm:col-span-2 font-semibold text-brand-text-secondary text-sm mt-4 mb-[-8px]">NOVASTAR PROCESSOR</div>
        <div className="sm:col-span-2">
            <Input
              label="Pixels per Port"
              type="number"
              value={config.portCapacityPx.toString()}
              onChange={(e) => handleInputChange('portCapacityPx', e.target.value)}
              helperText="Enter a custom value or select a preset below."
            />
        </div>
        <div className="sm:col-span-2 mt-2">
            <ul className="space-y-2">
                {PROCESSOR_PRESETS.map((preset) => (
                    <li key={preset.name} className="flex items-center justify-between bg-brand-primary p-2 rounded-md border border-gray-600/50">
                        <div>
                            <p className="font-semibold text-brand-text-primary text-sm">{preset.name}</p>
                            <p className="text-xs text-brand-text-secondary">{preset.capacity.toLocaleString()} pixels/port • {preset.ports} ports total</p>
                        </div>
                        <button
                            onClick={() => handlePresetClick(preset)}
                            className="bg-brand-accent/20 text-brand-accent text-xs font-bold py-1 px-3 rounded-md hover:bg-brand-accent/40 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            aria-label={`Use ${preset.name} settings`}
                        >
                            Use
                        </button>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </Card>
  );
};
