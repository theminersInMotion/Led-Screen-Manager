import type { ProcessorPreset, VoltageStandard } from './types';

export const VOLTAGE_OPTIONS: VoltageStandard[] = [
    { key: "voltage120", value: 120, breakers: [15, 20] },
    { key: "voltage208", value: 208, breakers: [15, 20] },
    { key: "voltage240", value: 240, breakers: [16, 20, 32] },
    { key: "voltage220_china", value: 220, breakers: [10, 16, 25, 32] },
];

export const NOVASTAR_PORT_CAPACITY = 650000;

export const PROCESSOR_PRESETS: ProcessorPreset[] = [
  { name: 'Novastar MCTRL4K', tKey: 'proc_mctrl4k', capacity: 575000, ports: 16 },
  { name: 'Novastar VX400', tKey: 'proc_vx400', capacity: 650000, ports: 4 },
  { name: 'Novastar VX600', tKey: 'proc_vx600', capacity: 650000, ports: 6 },
  { name: 'Novastar VX1000', tKey: 'proc_vx1000', capacity: 650000, ports: 10 },
];
