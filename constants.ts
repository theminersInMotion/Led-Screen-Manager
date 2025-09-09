
import type { SelectOption, ProcessorPreset } from './types';

export const VOLTAGE_OPTIONS: SelectOption[] = [
    { label: "120V (North America)", value: 120 },
    { label: "208V (North America)", value: 208 },
    { label: "240V (Europe/Asia)", value: 240 },
];

export const NOVASTAR_PORT_CAPACITY = 650000;

export const PROCESSOR_PRESETS: ProcessorPreset[] = [
  { name: 'Novastar MCTRL4K', capacity: 575000, ports: 16 },
  { name: 'Novastar VX400', capacity: 650000, ports: 4 },
  { name: 'Novastar VX600', capacity: 650000, ports: 6 },
  { name: 'Novastar VX1000', capacity: 650000, ports: 10 },
];
