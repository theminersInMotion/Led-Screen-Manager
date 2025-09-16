import React, { useMemo } from 'react';
import type { ScreenConfig, CalculationResults } from '../types';
import { Card } from './ui/Card';
import { Toggle } from './ui/Toggle';
import { DataFlowIcon, TopLeftIcon, TopRightIcon, BottomLeftIcon, BottomRightIcon } from './icons';
import { useI18n } from '../i18n';

export type StartCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
export type WiringPattern = 'horizontal' | 'vertical';

export interface DiagramState {
  startCorner: StartCorner;
  wiringPattern: WiringPattern;
  viewMode: 'data' | 'power';
  visibleDataPorts: Record<number, boolean>;
  visiblePowerBreakers: Record<number, boolean>;
}

interface WiringDiagramProps {
  config: ScreenConfig;
  results: CalculationResults;
  isPrintMode?: boolean;
  diagramState: DiagramState;
  onDiagramStateChange?: (newState: Partial<DiagramState>) => void;
}

const DATA_COLORS = ['#00bfff', '#1e90ff', '#5352ed', '#007bff', '#4d7cff', '#005cbf', '#00bfff', '#1e90ff', '#5352ed', '#007bff'];
const POWER_COLORS = ['#ff4757', '#ffa502', '#feca57', '#ff6b81', '#ff9f43', '#e67e22', '#ff4757', '#ffa502', '#feca57', '#ff6b81'];

export const WiringDiagram: React.FC<WiringDiagramProps> = ({ 
  config, 
  results,
  isPrintMode = false,
  diagramState,
  onDiagramStateChange
}) => {
  const { startCorner, wiringPattern, viewMode, visibleDataPorts, visiblePowerBreakers } = diagramState;
  const { t } = useI18n();

  const { cabinetsHorizontal, cabinetsVertical } = config;
  const totalCabinets = cabinetsHorizontal * cabinetsVertical;

  const serpentinePath = useMemo(() => {
    const path: { row: number, col: number }[] = [];
    if (cabinetsHorizontal <= 0 || cabinetsVertical <= 0) return path;

    if (wiringPattern === 'horizontal') {
      const rowIndices = Array.from({ length: cabinetsVertical }, (_, i) => i);
      if (startCorner.includes('bottom')) rowIndices.reverse();

      rowIndices.forEach((row, i) => {
        const colIndices = Array.from({ length: cabinetsHorizontal }, (_, i) => i);
        const isFirstPassEven = i % 2 === 0;

        if ( (startCorner.includes('Right') && isFirstPassEven) || (startCorner.includes('Left') && !isFirstPassEven) ) {
          colIndices.reverse();
        }

        colIndices.forEach(col => path.push({ row, col }));
      });
    } else { // vertical
      const colIndices = Array.from({ length: cabinetsHorizontal }, (_, i) => i);
      if (startCorner.includes('Right')) colIndices.reverse();

      colIndices.forEach((col, i) => {
        const rowIndices = Array.from({ length: cabinetsVertical }, (_, i) => i);
        const isFirstPassEven = i % 2 === 0;

        if ( (startCorner.includes('bottom') && isFirstPassEven) || (startCorner.includes('top') && !isFirstPassEven) ) {
          rowIndices.reverse();
        }
        
        rowIndices.forEach(row => path.push({ row, col }));
      });
    }
    return path;
  }, [cabinetsHorizontal, cabinetsVertical, startCorner, wiringPattern]);

  const createGrouping = (cabinetsPerGroup: number) => {
    const groupingStrategy = useMemo(() => {
      if (wiringPattern === 'vertical' && cabinetsVertical > 0) return cabinetsPerGroup >= cabinetsVertical ? 'rectangular' : 'contiguous';
      if (wiringPattern === 'horizontal' && cabinetsHorizontal > 0) return cabinetsPerGroup >= cabinetsHorizontal ? 'rectangular' : 'contiguous';
      return 'contiguous';
    }, [cabinetsPerGroup]);

    const getGroupIndex = (r: number, c: number): number => {
      if (cabinetsPerGroup <= 0) return -1;
      if (groupingStrategy === 'rectangular') {
        if (wiringPattern === 'vertical') {
          const colsPerGroup = Math.floor(cabinetsPerGroup / cabinetsVertical);
          if (colsPerGroup === 0) return -1;
          const colIndices = Array.from({ length: cabinetsHorizontal }, (_, i) => i);
          if (startCorner.includes('Right')) colIndices.reverse();
          const orderedColIndex = colIndices.indexOf(c);
          return Math.floor(orderedColIndex / colsPerGroup);
        } else {
          const rowsPerGroup = Math.floor(cabinetsPerGroup / cabinetsHorizontal);
          if (rowsPerGroup === 0) return -1;
          const rowIndices = Array.from({ length: cabinetsVertical }, (_, i) => i);
          if (startCorner.includes('bottom')) rowIndices.reverse();
          const orderedRowIndex = rowIndices.indexOf(r);
          return Math.floor(orderedRowIndex / rowsPerGroup);
        }
      } else {
        const cabinetIndex = serpentinePath.findIndex(p => p.row === r && p.col === c);
        return cabinetIndex !== -1 ? Math.floor(cabinetIndex / cabinetsPerGroup) : -1;
      }
    };
    
    const totalGroups = useMemo(() => {
        if (cabinetsPerGroup <= 0 || totalCabinets === 0) return 0;
        return Math.ceil(totalCabinets / cabinetsPerGroup);
    }, [cabinetsPerGroup, totalCabinets]);

    const groupStartCabinets = useMemo(() => serpentinePath.reduce((acc, cabinet) => {
        const groupIndex = getGroupIndex(cabinet.row, cabinet.col);
        if (groupIndex !== -1 && !acc[groupIndex]) acc[groupIndex] = cabinet;
        return acc;
    }, {} as Record<number, {row: number, col: number}>), [serpentinePath]);

    return { getGroupIndex, totalGroups, groupStartCabinets };
  };
  
  const { getGroupIndex: getDataGroupIndex, totalGroups: totalDataGroups, groupStartCabinets: dataGroupStartCabinets } = createGrouping(results.cabinetsPerPort);
  const highestAmpsBreakerResult = useMemo(() => [...results.cabinetsPerBreaker].sort((a, b) => b.amps - a.amps)[0], [results.cabinetsPerBreaker]);
  const { getGroupIndex: getPowerGroupIndex, totalGroups: totalPowerGroups, groupStartCabinets: powerGroupStartCabinets } = createGrouping(highestAmpsBreakerResult?.count || 0);

  const handleToggleVisibility = (type: 'data' | 'power', index: number) => {
    if (!onDiagramStateChange) return;
    if (type === 'data') {
      const newVisible = { ...visibleDataPorts, [index]: !visibleDataPorts[index] };
      onDiagramStateChange({ visibleDataPorts: newVisible });
    } else {
      const newVisible = { ...visiblePowerBreakers, [index]: !visiblePowerBreakers[index] };
      onDiagramStateChange({ visiblePowerBreakers: newVisible });
    }
  };

  const cabinetSize = 32;
  const gap = 6;
  const cabinetAndGap = cabinetSize + gap;
  const totalWidth = cabinetsHorizontal * cabinetAndGap - gap;
  const totalHeight = cabinetsVertical * cabinetAndGap - gap;
  const getCoords = (row: number, col: number) => ({ x: col * cabinetAndGap, y: row * cabinetAndGap });

  const diagramContent = (
    <div className="flex flex-col gap-4">
      {!isPrintMode && onDiagramStateChange && (
        <div className="flex flex-col gap-6 bg-brand-primary p-4 rounded-md border border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('wiringPattern')}</label>
                    <Toggle value={wiringPattern} onChange={(p) => onDiagramStateChange({ wiringPattern: p as WiringPattern })} options={[{ value: 'vertical', label: t('vertical') }, { value: 'horizontal', label: t('horizontal') }]} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('startCorner')}</label>
                    <Toggle value={startCorner} onChange={(c) => onDiagramStateChange({ startCorner: c as StartCorner })} options={[{ value: 'topLeft', label: <TopLeftIcon /> }, { value: 'topRight', label: <TopRightIcon /> }, { value: 'bottomLeft', label: <BottomLeftIcon /> }, { value: 'bottomRight', label: <BottomRightIcon /> }]} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('diagramView')}</label>
                    <Toggle 
                        value={viewMode} 
                        onChange={(v) => onDiagramStateChange({ viewMode: v as 'data' | 'power' })} 
                        options={[
                            { value: 'data', label: t('data') }, 
                            { value: 'power', label: t('powerView') }
                        ]} 
                    />
                </div>
            </div>
            
            {viewMode === 'data' && totalDataGroups > 0 && <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Data Ports</label>
                <div className="flex flex-wrap gap-2">{Array.from({ length: totalDataGroups }).map((_, i) => <button key={`data-toggle-${i}`} onClick={() => handleToggleVisibility('data', i)} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${visibleDataPorts[i] ? 'text-white' : 'text-gray-500 bg-transparent'}`} style={{ backgroundColor: visibleDataPorts[i] ? DATA_COLORS[i % DATA_COLORS.length] : '#2a2a2a' }}>P{i + 1}</button>)}</div>
            </div>}
            
            {viewMode === 'power' && totalPowerGroups > 0 && <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Power Circuits ({highestAmpsBreakerResult?.amps}A)</label>
                <div className="flex flex-wrap gap-2">{Array.from({ length: totalPowerGroups }).map((_, i) => <button key={`power-toggle-${i}`} onClick={() => handleToggleVisibility('power', i)} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${visiblePowerBreakers[i] ? 'text-white' : 'text-gray-500 bg-transparent'}`} style={{ backgroundColor: visiblePowerBreakers[i] ? POWER_COLORS[i % POWER_COLORS.length] : '#2a2a2a' }}>B{i + 1}</button>)}</div>
            </div>}
        </div>
      )}

      {isPrintMode && (
        <div className="flex gap-4 text-xs font-semibold" style={{ color: '#333' }}>
            {viewMode === 'data' && 
                <div className="flex items-center gap-2"><svg height="4" width="20"><line x1="0" y1="2" x2="20" y2="2" style={{stroke: DATA_COLORS[0], strokeWidth:2}} /></svg>Data Port</div>
            }
            {viewMode === 'power' &&
                <div className="flex items-center gap-2"><svg height="4" width="20"><line x1="0" y1="2" x2="20" y2="2" style={{stroke:POWER_COLORS[0], strokeWidth:2, strokeDasharray: '4 2'}} /></svg>Power Circuit</div>
            }
        </div>
      )}

      {totalCabinets > 0 ? (
        <div className="w-full bg-brand-primary p-4 rounded-md overflow-x-auto">
          <svg viewBox={`-16 -16 ${totalWidth + 32} ${totalHeight + 32}`} width="100%" height="100%" style={{ minWidth: Math.max(300, totalWidth / 2), minHeight: Math.max(200, totalHeight / 2) }} aria-label="Wiring diagram">
            <g>
              {Array.from({ length: cabinetsVertical }).map((_, r) => Array.from({ length: cabinetsHorizontal }).map((_, c) => <rect key={`${r}-${c}`} x={getCoords(r,c).x} y={getCoords(r,c).y} width={cabinetSize} height={cabinetSize} fill="#1a1a1a" stroke="#4a4a4a" strokeWidth="2" rx="2" />))}
              
              {viewMode === 'power' && serpentinePath.slice(0, -1).map((p, i) => {
                const powerGroupIndex = getPowerGroupIndex(p.row, p.col);
                if (powerGroupIndex !== -1 && visiblePowerBreakers[powerGroupIndex] && powerGroupIndex === getPowerGroupIndex(serpentinePath[i + 1].row, serpentinePath[i + 1].col)) {
                    const { x: x1, y: y1 } = getCoords(p.row, p.col); const { x: x2, y: y2 } = getCoords(serpentinePath[i + 1].row, serpentinePath[i + 1].col);
                    return <line key={`power-line-${i}`} x1={x1 + cabinetSize / 2} y1={y1 + cabinetSize / 2} x2={x2 + cabinetSize / 2} y2={y2 + cabinetSize / 2} stroke={POWER_COLORS[powerGroupIndex % POWER_COLORS.length]} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 2" />;
                } return null;
              })}

              {viewMode === 'data' && serpentinePath.slice(0, -1).map((p, i) => {
                const dataGroupIndex = getDataGroupIndex(p.row, p.col);
                if (dataGroupIndex !== -1 && visibleDataPorts[dataGroupIndex] && dataGroupIndex === getDataGroupIndex(serpentinePath[i + 1].row, serpentinePath[i + 1].col)) {
                    const { x: x1, y: y1 } = getCoords(p.row, p.col); const { x: x2, y: y2 } = getCoords(serpentinePath[i + 1].row, serpentinePath[i + 1].col);
                    return <line key={`data-line-${i}`} x1={x1 + cabinetSize / 2} y1={y1 + cabinetSize / 2} x2={x2 + cabinetSize / 2} y2={y2 + cabinetSize / 2} stroke={DATA_COLORS[dataGroupIndex % DATA_COLORS.length]} strokeWidth="1.5" strokeLinecap="round" />;
                } return null;
              })}

              {viewMode === 'power' && Object.entries(powerGroupStartCabinets).map(([idx, cab]) => { const i = parseInt(idx); if(visiblePowerBreakers[i]) { const {x, y} = getCoords(cab.row, cab.col); return <g key={`power-label-${i}`}><rect x={x+4} y={y+4} width={cabinetSize-8} height={cabinetSize-8} rx="2" fill={POWER_COLORS[i % POWER_COLORS.length]} /><text x={x + cabinetSize/2} y={y + cabinetSize/2} textAnchor="middle" dy=".3em" fill="#0a0a0a" fontSize="9" fontWeight="bold">B{i + 1}</text></g> } return null; })}
              {viewMode === 'data' && Object.entries(dataGroupStartCabinets).map(([idx, cab]) => { const i = parseInt(idx); if(visibleDataPorts[i]) { const {x, y} = getCoords(cab.row, cab.col); return <g key={`data-label-${i}`}><circle cx={x + cabinetSize/2} cy={y + cabinetSize/2} r={cabinetSize/3} fill={DATA_COLORS[i % DATA_COLORS.length]} /><text x={x + cabinetSize/2} y={y + cabinetSize/2} textAnchor="middle" dy=".3em" fill="#0a0a0a" fontSize="10" fontWeight="bold">P{i + 1}</text></g> } return null; })}
            </g>
          </svg>
        </div>
      ) : (
        <div className="text-center text-brand-text-secondary p-8 bg-brand-primary rounded-md"><p>{t('wiringDiagramError')}</p><p className="text-sm">{t('wiringDiagramErrorHint')}</p></div>
      )}
    </div>
  );

  if (isPrintMode) return diagramContent;

  return <Card title={t('wiringDiagram')}>{diagramContent}</Card>;
};