import React, { useMemo, useCallback, useState, useEffect } from 'react';
import type { ScreenConfig, CalculationResults } from '../types';
import { Card } from './ui/Card';
import { Toggle } from './ui/Toggle';
import { DataFlowIcon, TopLeftIcon, TopRightIcon, BottomLeftIcon, BottomRightIcon } from './icons';
import { useI18n } from '../i18n';

export type StartCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
export type WiringPattern = 'horizontal' | 'vertical';

export interface DiagramState {
  dataStartCorner: StartCorner;
  dataWiringPattern: WiringPattern;
  powerStartCorner: StartCorner;
  powerWiringPattern: WiringPattern;
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

interface Path {
  id: number;
  cabinets: { row: number, col: number }[];
}


const DATA_COLORS = ['#00bfff', '#1e90ff', '#5352ed', '#007bff', '#4d7cff', '#005cbf', '#00bfff', '#1e90ff', '#5352ed', '#007bff'];
const POWER_COLORS = ['#ff4757', '#ffa502', '#feca57', '#ff6b81', '#ff9f43', '#e67e22', '#ff4757', '#ffa502', '#feca57', '#ff6b81'];

const calculateSerpentinePath = (startCorner: StartCorner, wiringPattern: WiringPattern, cabinetsVertical: number, cabinetsHorizontal: number) => {
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
}

const useGrouping = (
    cabinetsPerGroup: number,
    wiringPattern: WiringPattern,
    startCorner: StartCorner,
    serpentinePath: { row: number, col: number }[],
    cabinetsVertical: number,
    cabinetsHorizontal: number,
    totalCabinets: number,
) => {
    const groupingStrategy = useMemo(() => {
      if (wiringPattern === 'vertical' && cabinetsVertical > 0) return cabinetsPerGroup >= cabinetsVertical ? 'rectangular' : 'contiguous';
      if (wiringPattern === 'horizontal' && cabinetsHorizontal > 0) return cabinetsPerGroup >= cabinetsHorizontal ? 'rectangular' : 'contiguous';
      return 'contiguous';
    }, [cabinetsPerGroup, wiringPattern, cabinetsVertical, cabinetsHorizontal]);

    const getGroupIndex = useCallback((r: number, c: number): number => {
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
    }, [groupingStrategy, cabinetsPerGroup, wiringPattern, startCorner, serpentinePath, cabinetsVertical, cabinetsHorizontal]);
    
    const totalGroups = useMemo(() => {
        if (cabinetsPerGroup <= 0 || totalCabinets === 0) return 0;
        return Math.ceil(totalCabinets / cabinetsPerGroup);
    }, [cabinetsPerGroup, totalCabinets]);

    const groupStartCabinets = useMemo(() => serpentinePath.reduce((acc, cabinet) => {
        const groupIndex = getGroupIndex(cabinet.row, cabinet.col);
        if (groupIndex !== -1 && !acc[groupIndex]) acc[groupIndex] = cabinet;
        return acc;
    }, {} as Record<number, {row: number, col: number}>), [serpentinePath, getGroupIndex]);

    return { getGroupIndex, totalGroups, groupStartCabinets };
}

export const WiringDiagram: React.FC<WiringDiagramProps> = ({ 
  config, 
  results,
  isPrintMode = false,
  diagramState,
  onDiagramStateChange
}) => {
  const { 
    dataStartCorner, dataWiringPattern,
    powerStartCorner, powerWiringPattern,
    viewMode, visibleDataPorts, visiblePowerBreakers
  } = diagramState;
  const { t } = useI18n();

  const [wiringMode, setWiringMode] = useState<'auto' | 'manual'>('auto');
  const [manualDataPaths, setManualDataPaths] = useState<Path[]>([]);
  const [manualPowerPaths, setManualPowerPaths] = useState<Path[]>([]);
  const [activePathId, setActivePathId] = useState<number | null>(null);

  const effectiveWiringMode = isPrintMode ? 'auto' : wiringMode;

  const { cabinetsHorizontal, cabinetsVertical } = config;
  const totalCabinets = cabinetsHorizontal * cabinetsVertical;
  
  // Clear manual paths if cabinet layout changes
  useEffect(() => {
    setManualDataPaths([]);
    setManualPowerPaths([]);
    setActivePathId(null);
  }, [cabinetsHorizontal, cabinetsVertical]);

  // Reset active path when switching view mode
  useEffect(() => {
    setActivePathId(null);
  }, [viewMode]);

  const dataSerpentinePath = useMemo(() => {
      return calculateSerpentinePath(dataStartCorner, dataWiringPattern, cabinetsVertical, cabinetsHorizontal);
  }, [cabinetsHorizontal, cabinetsVertical, dataStartCorner, dataWiringPattern]);

  const powerSerpentinePath = useMemo(() => {
      return calculateSerpentinePath(powerStartCorner, powerWiringPattern, cabinetsVertical, cabinetsHorizontal);
  }, [cabinetsHorizontal, cabinetsVertical, powerStartCorner, powerWiringPattern]);

  const highestAmpsBreakerResult = useMemo(() => [...results.cabinetsPerBreaker].sort((a, b) => b.amps - a.amps)[0], [results.cabinetsPerBreaker]);
  
  const { getGroupIndex: getDataGroupIndex, totalGroups: totalDataGroups } = useGrouping(results.cabinetsPerPort, dataWiringPattern, dataStartCorner, dataSerpentinePath, cabinetsVertical, cabinetsHorizontal, totalCabinets);
  const { getGroupIndex: getPowerGroupIndex, totalGroups: totalPowerGroups, groupStartCabinets: powerGroupStartCabinets } = useGrouping(highestAmpsBreakerResult?.count || 0, powerWiringPattern, powerStartCorner, powerSerpentinePath, cabinetsVertical, cabinetsHorizontal, totalCabinets);


  const dataGroupLabelCabinets = useMemo(() => {
    if (totalDataGroups === 0) return {};

    const groups: Record<number, { row: number, col: number }[]> = {};
    for (let r = 0; r < cabinetsVertical; r++) {
        for (let c = 0; c < cabinetsHorizontal; c++) {
            const groupIndex = getDataGroupIndex(r, c);
            if (groupIndex !== -1) {
                if (!groups[groupIndex]) {
                    groups[groupIndex] = [];
                }
                groups[groupIndex].push({ row: r, col: c });
            }
        }
    }

    const labelCabinets: Record<number, { row: number, col: number }> = {};
    for (const groupIndexStr in groups) {
        const groupIndex = parseInt(groupIndexStr, 10);
        const cabinetsInGroup = groups[groupIndex];
        if (!cabinetsInGroup || cabinetsInGroup.length === 0) continue;

        let bestCabinet = cabinetsInGroup[0];
        let minDistance = Infinity;

        for (const cabinet of cabinetsInGroup) {
            const distance = Math.min(
                cabinet.row,
                cabinet.col,
                (cabinetsVertical - 1) - cabinet.row,
                (cabinetsHorizontal - 1) - cabinet.col
            );

            if (distance < minDistance) {
                minDistance = distance;
                bestCabinet = cabinet;
            }
        }
        labelCabinets[groupIndex] = bestCabinet;
    }
    return labelCabinets;
  }, [cabinetsHorizontal, cabinetsVertical, getDataGroupIndex, totalDataGroups]);

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

  const handleCabinetClick = (row: number, col: number) => {
    if (wiringMode !== 'manual' || activePathId === null) return;

    const isData = viewMode === 'data';
    const paths = isData ? manualDataPaths : manualPowerPaths;
    const setPaths = isData ? setManualDataPaths : setManualPowerPaths;
    const limit = isData ? results.cabinetsPerPort : (highestAmpsBreakerResult?.count || 0);

    const activePath = paths.find(p => p.id === activePathId);
    if (activePath) {
      const lastCabinet = activePath.cabinets[activePath.cabinets.length - 1];
      if (lastCabinet && lastCabinet.row === row && lastCabinet.col === col) {
        const updatedPath = { ...activePath, cabinets: activePath.cabinets.slice(0, -1) };
        setPaths(paths.map(p => p.id === activePathId ? updatedPath : p).filter(p => p.cabinets.length > 0));
        return;
      }
    }

    const isUsed = paths.some(p => p.cabinets.some(c => c.row === row && c.col === col));
    if (isUsed) return;

    let currentPath = paths.find(p => p.id === activePathId) || { id: activePathId, cabinets: [] };

    if (currentPath.cabinets.length >= limit) return;

    if (currentPath.cabinets.length > 0) {
      const lastCabinet = currentPath.cabinets[currentPath.cabinets.length - 1];
      const isAdjacent = (Math.abs(lastCabinet.row - row) === 1 && lastCabinet.col === col) || (Math.abs(lastCabinet.col - col) === 1 && lastCabinet.row === row);
      if (!isAdjacent) return;
    }

    const updatedPath = { ...currentPath, cabinets: [...currentPath.cabinets, { row, col }] };
    setPaths([...paths.filter(p => p.id !== activePathId), updatedPath].sort((a, b) => a.id - b.id));
  };
  
  const handleClearAllPaths = () => {
    if(viewMode === 'data') setManualDataPaths([]); else setManualPowerPaths([]);
    setActivePathId(null);
  };

  const cabinetSize = 32;
  const gap = 6;
  const cabinetAndGap = cabinetSize + gap;
  const totalWidth = cabinetsHorizontal * cabinetAndGap - gap;
  const totalHeight = cabinetsVertical * cabinetAndGap - gap;
  const getCoords = (row: number, col: number) => ({ x: col * cabinetAndGap, y: row * cabinetAndGap });
  
  const currentManualPaths = viewMode === 'data' ? manualDataPaths : manualPowerPaths;
  const currentTotalGroups = viewMode === 'data' ? totalDataGroups : totalPowerGroups;
  const capacityLimit = viewMode === 'data' ? results.cabinetsPerPort : (highestAmpsBreakerResult?.count || 0);

  const diagramContent = (
    <div className="flex flex-col gap-4">
      {!isPrintMode && onDiagramStateChange && (
        <div className="flex flex-col gap-6 bg-brand-primary p-4 rounded-md border border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('diagramView')}</label>
                    <Toggle 
                        value={viewMode} 
                        onChange={(v) => onDiagramStateChange({ viewMode: v as 'data' | 'power' })} 
                        options={[{ value: 'data', label: t('data') }, { value: 'power', label: t('powerView') }]} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('wiringMode')}</label>
                    <Toggle 
                        value={wiringMode} 
                        onChange={(v) => setWiringMode(v as 'auto' | 'manual')} 
                        options={[{ value: 'auto', label: t('autoMode') }, { value: 'manual', label: t('manualMode') }]} 
                    />
                </div>
            </div>

            {wiringMode === 'auto' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                 <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('wiringPattern')}</label>
                    <Toggle 
                        value={viewMode === 'data' ? dataWiringPattern : powerWiringPattern} 
                        onChange={(p) => onDiagramStateChange(viewMode === 'data' ? { dataWiringPattern: p as WiringPattern } : { powerWiringPattern: p as WiringPattern })} 
                        options={[{ value: 'vertical', label: t('vertical') }, { value: 'horizontal', label: t('horizontal') }]} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('startCorner')}</label>
                    <Toggle 
                        value={viewMode === 'data' ? dataStartCorner : powerStartCorner} 
                        onChange={(c) => onDiagramStateChange(viewMode === 'data' ? { dataStartCorner: c as StartCorner } : { powerStartCorner: c as StartCorner })} 
                        options={[{ value: 'topLeft', label: <TopLeftIcon /> }, { value: 'topRight', label: <TopRightIcon /> }, { value: 'bottomLeft', label: <BottomLeftIcon /> }, { value: 'bottomRight', label: <BottomRightIcon /> }]} 
                    />
                </div>
              </div>
            )}
            
            {wiringMode === 'manual' && currentTotalGroups > 0 && (
              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-brand-text-secondary">{t('selectPathToDraw')}</label>
                    <button onClick={handleClearAllPaths} className="text-xs text-brand-accent hover:underline">{t('clearAllPaths')}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: currentTotalGroups }).map((_, i) => {
                    const path = currentManualPaths.find(p => p.id === i);
                    const count = path?.cabinets.length || 0;
                    const isFull = count >= capacityLimit;
                    const isActive = activePathId === i;
                    const prefix = viewMode === 'data' ? 'P' : 'B';

                    return (
                      <button 
                        key={`${viewMode}-path-btn-${i}`} 
                        onClick={() => setActivePathId(i)}
                        className={`flex flex-col items-center justify-center p-2 rounded-md transition-all border ${isActive ? 'bg-brand-accent/20 border-brand-accent' : 'bg-brand-primary border-gray-600 hover:border-gray-500'}`}
                      >
                        <span className={`font-bold text-sm ${isActive ? 'text-brand-accent' : 'text-brand-text-primary'}`}>{prefix}{i+1}</span>
                        <span className={`text-xs ${isFull ? 'text-yellow-400' : 'text-brand-text-secondary'}`}>
                          {isFull ? t('pathComplete') : t('pathCapacity', { count, limit: capacityLimit })}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {wiringMode === 'auto' && viewMode === 'data' && totalDataGroups > 0 && <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Data Ports</label>
                <div className="flex flex-wrap gap-2">{Array.from({ length: totalDataGroups }).map((_, i) => <button key={`data-toggle-${i}`} onClick={() => handleToggleVisibility('data', i)} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${visibleDataPorts[i] ? 'text-white' : 'text-gray-500 bg-transparent'}`} style={{ backgroundColor: visibleDataPorts[i] ? DATA_COLORS[i % DATA_COLORS.length] : '#2a2a2a' }}>P{i + 1}</button>)}</div>
            </div>}
            
            {wiringMode === 'auto' && viewMode === 'power' && totalPowerGroups > 0 && <div>
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
              {Array.from({ length: cabinetsVertical }).map((_, r) => Array.from({ length: cabinetsHorizontal }).map((_, c) => {
                const isManualUsed = effectiveWiringMode === 'manual' && currentManualPaths.some(p => p.cabinets.some(cab => cab.row === r && cab.col === c));
                const isManualActivePath = effectiveWiringMode === 'manual' && activePathId !== null && currentManualPaths.find(p => p.id === activePathId)?.cabinets.some(cab => cab.row === r && cab.col === c);

                return (
                  <rect 
                    key={`${r}-${c}`} 
                    x={getCoords(r,c).x} 
                    y={getCoords(r,c).y} 
                    width={cabinetSize} 
                    height={cabinetSize} 
                    fill={isManualUsed ? '#111' : '#1a1a1a'} 
                    stroke={isManualActivePath ? '#00bfff' : '#4a4a4a'}
                    strokeWidth="2" 
                    rx="2"
                    onClick={() => handleCabinetClick(r, c)}
                    className={effectiveWiringMode === 'manual' ? 'cursor-pointer' : ''}
                  />
                );
              }))}
              
              {effectiveWiringMode === 'auto' && viewMode === 'power' && powerSerpentinePath.slice(0, -1).map((p, i) => {
                const powerGroupIndex = getPowerGroupIndex(p.row, p.col);
                if (powerGroupIndex !== -1 && visiblePowerBreakers[powerGroupIndex] && powerGroupIndex === getPowerGroupIndex(powerSerpentinePath[i + 1].row, powerSerpentinePath[i + 1].col)) {
                    const { x: x1, y: y1 } = getCoords(p.row, p.col); const { x: x2, y: y2 } = getCoords(powerSerpentinePath[i + 1].row, powerSerpentinePath[i + 1].col);
                    return <line key={`power-line-${i}`} x1={x1 + cabinetSize / 2} y1={y1 + cabinetSize / 2} x2={x2 + cabinetSize / 2} y2={y2 + cabinetSize / 2} stroke={POWER_COLORS[powerGroupIndex % POWER_COLORS.length]} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 2" />;
                } return null;
              })}

              {effectiveWiringMode === 'auto' && viewMode === 'data' && dataSerpentinePath.slice(0, -1).map((p, i) => {
                const dataGroupIndex = getDataGroupIndex(p.row, p.col);
                if (dataGroupIndex !== -1 && visibleDataPorts[dataGroupIndex] && dataGroupIndex === getDataGroupIndex(dataSerpentinePath[i + 1].row, dataSerpentinePath[i + 1].col)) {
                    const { x: x1, y: y1 } = getCoords(p.row, p.col); const { x: x2, y: y2 } = getCoords(dataSerpentinePath[i + 1].row, dataSerpentinePath[i + 1].col);
                    return <line key={`data-line-${i}`} x1={x1 + cabinetSize / 2} y1={y1 + cabinetSize / 2} x2={x2 + cabinetSize / 2} y2={y2 + cabinetSize / 2} stroke={DATA_COLORS[dataGroupIndex % DATA_COLORS.length]} strokeWidth="1.5" strokeLinecap="round" />;
                } return null;
              })}

              {effectiveWiringMode === 'manual' && currentManualPaths.map(path => {
                const color = viewMode === 'data' ? DATA_COLORS[path.id % DATA_COLORS.length] : POWER_COLORS[path.id % POWER_COLORS.length];
                return path.cabinets.slice(0, -1).map((cab, i) => {
                  const nextCab = path.cabinets[i + 1];
                  const { x: x1, y: y1 } = getCoords(cab.row, cab.col);
                  const { x: x2, y: y2 } = getCoords(nextCab.row, nextCab.col);
                  return (
                    <line key={`manual-line-${path.id}-${i}`} x1={x1 + cabinetSize / 2} y1={y1 + cabinetSize / 2} x2={x2 + cabinetSize / 2} y2={y2 + cabinetSize / 2} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray={viewMode === 'power' ? '4 2' : undefined} />
                  );
                });
              })}

              {/* FIX: Cast `cab` to `any` because TypeScript infers its type as `unknown` from Object.entries, causing a compilation error. */}
              {effectiveWiringMode === 'auto' && viewMode === 'power' && Object.entries(powerGroupStartCabinets).map(([idx, cab]) => { const i = parseInt(idx); if(visiblePowerBreakers[i]) { const {x, y} = getCoords((cab as any).row, (cab as any).col); return <g key={`power-label-${i}`}><rect x={x+4} y={y+4} width={cabinetSize-8} height={cabinetSize-8} rx="2" fill={POWER_COLORS[i % POWER_COLORS.length]} /><text x={x + cabinetSize/2} y={y + cabinetSize/2} textAnchor="middle" dy=".3em" fill="#0a0a0a" fontSize="9" fontWeight="bold">B{i + 1}</text></g> } return null; })}
              {/* FIX: Cast `cab` to `any` because TypeScript infers its type as `unknown` from Object.entries, causing a compilation error. */}
              {effectiveWiringMode === 'auto' && viewMode === 'data' && Object.entries(dataGroupLabelCabinets).map(([idx, cab]) => { const i = parseInt(idx); if(visibleDataPorts[i] && cab) { const {x, y} = getCoords((cab as any).row, (cab as any).col); return <g key={`data-label-${i}`}><circle cx={x + cabinetSize/2} cy={y + cabinetSize/2} r={cabinetSize/3} fill={DATA_COLORS[i % DATA_COLORS.length]} /><text x={x + cabinetSize/2} y={y + cabinetSize/2} textAnchor="middle" dy=".3em" fill="#0a0a0a" fontSize="10" fontWeight="bold">P{i + 1}</text></g> } return null; })}
            
              {effectiveWiringMode === 'manual' && currentManualPaths.map(path => {
                if(path.cabinets.length > 0) {
                    const i = path.id;
                    const cab = path.cabinets[0];
                    const { x, y } = getCoords(cab.row, cab.col);
                    const color = viewMode === 'data' ? DATA_COLORS[i % DATA_COLORS.length] : POWER_COLORS[i % POWER_COLORS.length];
                    const prefix = viewMode === 'data' ? 'P' : 'B';

                    return (
                        <g key={`manual-label-${viewMode}-${i}`}>
                            <circle cx={x + cabinetSize / 2} cy={y + cabinetSize / 2} r={cabinetSize / 3} fill={color} />
                            <text x={x + cabinetSize / 2} y={y + cabinetSize / 2} textAnchor="middle" dy=".3em" fill="#0a0a0a" fontSize="10" fontWeight="bold">{prefix}{i + 1}</text>
                        </g>
                    );
                }
                return null;
              })}
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
