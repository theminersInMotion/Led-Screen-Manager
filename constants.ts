import type { ProcessorPreset, VoltageStandard } from './types';

export const VOLTAGE_OPTIONS: VoltageStandard[] = [
    { key: "voltage120", value: 120, breakers: [15, 20] },
    { key: "voltage208", value: 208, breakers: [15, 20] },
    { key: "voltage240", value: 240, breakers: [16, 20, 32] },
    { key: "voltage220_china", value: 220, breakers: [10, 16, 25, 32] },
];

export const NOVASTAR_PORT_CAPACITY = 650000;

export const SYNC_PROCESSOR_PRESETS: ProcessorPreset[] = [
  { name: 'Novastar VX400', tKey: 'proc_vx400', type: 'sync', capacity: 650000, totalCapacity: 2600000, ports: 4, inputs: 'HDMI, DVI, VGA, SDI' },
  { name: 'Novastar VX600', tKey: 'proc_vx600', type: 'sync', capacity: 650000, totalCapacity: 3900000, ports: 6, inputs: 'HDMI, DVI, SDI' },
  { name: 'Novastar VX1000', tKey: 'proc_vx1000', type: 'sync', capacity: 650000, totalCapacity: 6500000, ports: 10, inputs: 'DP, HDMI, DVI, SDI' },
  { name: 'Novastar VX16s', tKey: 'proc_vx16s', type: 'sync', capacity: 650000, totalCapacity: 10400000, ports: 16, inputs: 'DP, HDMI, DVI, SDI' },
];

export const ASYNC_PROCESSOR_PRESETS: ProcessorPreset[] = [
  { name: 'Novastar TB30', tKey: 'proc_tb30', type: 'async', capacity: 650000, totalCapacity: 650000, ports: 2, inputs: 'Wi-Fi, LAN, USB' },
  { name: 'Novastar TB40', tKey: 'proc_tb40', type: 'async', capacity: 650000, totalCapacity: 1300000, ports: 4, inputs: 'Wi-Fi, LAN, USB, HDMI In' },
  { name: 'Novastar TB50', tKey: 'proc_tb50', type: 'async', capacity: 650000, totalCapacity: 2300000, ports: 8, inputs: 'Wi-Fi, LAN, USB, HDMI In/Out' },
];

export const STANDARD_DIAGONAL_INCHES = [85, 98, 110, 135, 165, 200];