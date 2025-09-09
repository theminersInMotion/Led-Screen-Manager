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

export interface CalculationResults {
  totalWidthPx: number;
  totalHeightPx: number;
  totalCabinets: number;
  totalPixels: number;
  aspectRatio: string;
  totalPowerW: number;
  totalAmps: number;
  breakers15A: number;
  breakers20A: number;
  requiredPorts: number;
  totalProcessors: number;
  cabinetsPerPort: number;
  cabinetsPer15ABreaker: number;
  cabinetsPer20ABreaker: number;
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
