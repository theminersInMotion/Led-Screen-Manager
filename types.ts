export interface ScreenConfig {
  cabinetWidthPx: number;
  cabinetHeightPx: number;
  cabinetWidthCm: number;
  cabinetHeightCm: number;
  cabinetsHorizontal: number;
  cabinetsVertical: number;
  powerPerCabinetW: number;
  voltage: number;
  portCapacityPx: number;
  processorPorts: number;
  cabinetPrice: number;
  processorPrice: number;
  playerPrice: number;
  playerQuantity: number;
}

export interface BreakerResult {
  amps: number;
  count: number;
}

export interface CalculationResults {
  totalWidthPx: number;
  totalHeightPx: number;
  totalCabinets: number;
  totalPixels: number;
  aspectRatio: string;
  totalPowerW: number;
  totalAmps: number;
  breakerResults: BreakerResult[];
  requiredPorts: number;
  totalProcessors: number;
  cabinetsPerPort: number;
  cabinetsPerBreaker: BreakerResult[];
  totalWidthM: number;
  totalHeightM: number;
  totalWidthFt: number;
  totalHeightFt: number;
  totalWidthIn: number;
  totalHeightIn: number;
  totalCabinetPrice: number;
  totalProcessorPrice: number;
  totalPlayerPrice: number;
  grandTotalPrice: number;
}

export interface SelectOption {
    label: string;
    value: number;
}

export interface ProcessorPreset {
  name: string;
  tKey: string;
  capacity: number;
  ports: number;
}

export interface VoltageStandard {
    key: string;
    value: number;
    breakers: number[];
}
