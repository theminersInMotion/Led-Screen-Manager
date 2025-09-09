
export interface ScreenConfig {
  cabinetWidthPx: number;
  cabinetHeightPx: number;
  cabinetsHorizontal: number;
  cabinetsVertical: number;
  powerPerCabinetW: number;
  voltage: number;
  portCapacityPx: number;
}

export interface CalculationResults {
  totalWidthPx: number;
  totalHeightPx: number;
  totalPixels: number;
  aspectRatio: string;
  totalPowerW: number;
  totalAmps: number;
  breakers15A: number;
  breakers20A: number;
  requiredPorts: number;
  cabinetsPerPort: number;
  cabinetsPer15ABreaker: number;
  cabinetsPer20ABreaker: number;
}

export interface SelectOption {
    label: string;
    value: number;
}
