
import React from 'react';
import type { ScreenConfig } from '../types';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { VOLTAGE_OPTIONS } from '../constants';

interface CalculatorFormProps {
  config: ScreenConfig;
  onConfigChange: (newConfig: Partial<ScreenConfig>) => void;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({ config, onConfigChange }) => {
    
  // FIX: All errors stemmed from this function's signature. The `value` from an input's onChange event is always a string.
  // The previous type `ScreenConfig[K]` (a number) caused a mismatch at call sites and within this function's logic.
  // The signature is updated to accept a `string`, and the logic is simplified to handle string parsing correctly.
  const handleInputChange = <K extends keyof ScreenConfig>(key: K, value: string) => {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && numericValue >= 0) {
        onConfigChange({ [key]: numericValue });
      } else if (value === '') {
        onConfigChange({ [key]: 0 as ScreenConfig[K]});
      }
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
        <div className="sm:col-span-2 font-semibold text-brand-text-secondary text-sm mt-4 mb-[-8px]">VIDEO PROCESSOR</div>
        <Input
          label="Pixels per Port"
          type="number"
          value={config.portCapacityPx.toString()}
          onChange={(e) => handleInputChange('portCapacityPx', e.target.value)}
          helperText="e.g., Novastar VX4S: 650,000"
        />
      </div>
    </Card>
  );
};
