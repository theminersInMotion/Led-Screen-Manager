import React, { useMemo, useCallback, useState, useEffect } from 'react';
import type { ScreenConfig, CalculationResults } from '../types';
import { Card } from './ui/Card';
import { Toggle } from './ui/Toggle';
import { DataFlowIcon, TopLeftIcon, TopRightIcon, BottomLeftIcon, BottomRightIcon, AddIcon } from './icons';
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
  selectedBreakerAmps: number | null;
}

interface Path {
  id: number;
  cabinets: { row: number, col: number }[];
}


const DATA_COLORS = ['#00bfff', '#1e90ff', '#5352ed', '#007bff', '#4d7cff', '#005cbf', '#00bfff', '#1e90ff', '#5352ed', '#007bff'];
const POWER_COLORS = ['#ff4757', '#ffa502', '#feca57', '#ff6b81', '#ff9f43', '#e67e22', '#ff4757', '#ffa502', '#feca57', '#ff6b81'];
const MAX_RENDER_CABINETS = 800;

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
      // Use rectangular grouping only if it results in perfect, full-column/row groups.
      if (wiringPattern === 'vertical' && cabinetsVertical > 0 && cabinetsPerGroup > 0 && cabinetsPerGroup % cabinetsVertical === 0) {
        return 'rectangular';
      }
      if (wiringPattern === 'horizontal' && cabinetsHorizontal > 0 && cabinetsPerGroup > 0 && cabinetsPerGroup % cabinetsHorizontal === 0) {
        return 'rectangular';
      }
      return 'contiguous';
    }, [cabinetsPerGroup, wiringPattern, cabinetsVertical, cabinetsHorizontal]);
    
    const serpentinePathMap = useMemo(() => {
      const map = new Map<string, number>();
      serpentinePath.forEach((p, index) => {
        map.set(`${p.row},${p.col}`, index);
      });
      return map;
    }, [serpentinePath]);

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
        } else { // horizontal
          const rowsPerGroup = Math.floor(cabinetsPerGroup / cabinetsHorizontal);
          if (rowsPerGroup === 0) return -1;
          const rowIndices = Array.from({ length: cabinetsVertical }, (_, i) => i);
          if (startCorner.includes('bottom')) rowIndices.reverse();
          const orderedRowIndex = rowIndices.indexOf(r);
          return Math.floor(orderedRowIndex / rowsPerGroup);
        }
      } else { // contiguous
        const cabinetIndex = serpentinePathMap.get(`${r},${c}`);
        return cabinetIndex !== undefined ? Math.floor(cabinetIndex / cabinetsPerGroup) : -1;
      }
    }, [groupingStrategy, cabinetsPerGroup, wiringPattern, startCorner, serpentinePathMap, cabinetsVertical, cabinetsHorizontal]);
    
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
  onDiagramStateChange,
  selectedBreakerAmps
}) => {
  const { t } = useI18n();
  const { cabinetsHorizontal, cabinetsVertical } = config;
  const totalCabinets = cabinetsHorizontal * cabinetsVertical;

  // EARLY RETURN: Prevent performance issues with huge cabinet counts.
  if (totalCabinets > MAX_RENDER_CABINETS && !isPrintMode) {
    return (
        <Card title={t('wiringDiagram')}>
            <div className="text-center p-8 bg-brand-primary rounded-lg">
                <p className="font-semibold text-brand-text-primary">{t('diagramTooLargeError')}</p>
                <p className="text-sm text-brand-text-secondary mt-2">{t('diagramTooLargeErrorHint', { limit: MAX_RENDER_CABINETS.toLocaleString() })}</p>
            </div>
        </Card>
    );
  }

  const { 
    dataStartCorner, dataWiringPattern,
    powerStartCorner, powerWiringPattern,
    viewMode, visibleDataPorts, visiblePowerBreakers
  } = diagramState;
  
  const [wiringMode, setWiringMode] = useState<'auto' | 'manual'>('auto');
  const [manualDataPaths, setManualDataPaths] = useState<Path[]>([]);
  const [manualPowerPaths, setManualPowerPaths] = useState<Path[]>([]);
  const [activePathId, setActivePathId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const gridContainerRef = React.useRef<HTMLDivElement>(null);
  const [cabinetSize, setCabinetSize] = useState(20);


  const effectiveWiringMode = isPrintMode ? 'auto' : wiringMode;

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

  const selectedBreakerResult = useMemo(() => {
    if (!results.cabinetsPerBreaker || results.cabinetsPerBreaker.length === 0) {
      return null;
    }
    const targetAmps = selectedBreakerAmps ?? Math.max(...results.cabinetsPerBreaker.map(b => b.amps));
    return results.cabinetsPerBreaker.find(b => b.amps === targetAmps) || results.cabinetsPerBreaker[0];
  }, [results.cabinetsPerBreaker, selectedBreakerAmps]);
  
  const { getGroupIndex: getDataGroupIndex, totalGroups: totalDataGroups, groupStartCabinets: dataGroupStartCabinets } = useGrouping(results.cabinetsPerPort, dataWiringPattern, dataStartCorner, dataSerpentinePath, cabinetsVertical, cabinetsHorizontal, totalCabinets);
  const { getGroupIndex: getPowerGroupIndex, totalGroups: totalPowerGroups, groupStartCabinets: powerGroupStartCabinets } = useGrouping(selectedBreakerResult?.count || 0, powerWiringPattern, powerStartCorner, powerSerpentinePath, cabinetsVertical, cabinetsHorizontal, totalCabinets);

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

  const handleCabinetClickOrDrag = (row: number, col: number) => {
    if (wiringMode !== 'manual' || activePathId === null) return;

    const isData = viewMode === 'data';
    const paths = isData ? manualDataPaths : manualPowerPaths;
    const setPaths = isData ? setManualDataPaths : setManualPowerPaths;
    const limit = isData ? results.cabinetsPerPort : (selectedBreakerResult?.count || 0);

    const isUsed = paths.some(p => p.id !== activePathId && p.cabinets.some(c => c.row === row && c.col === col));
    if (isUsed) return; // Already in another path
    
    setPaths(prevPaths => prevPaths.map(path => {
        if (path.id !== activePathId) return path;

        const cabinetIndex = path.cabinets.findIndex(c => c.row === row && c.col === col);
        
        if (cabinetIndex !== -1) {
            // Remove the cabinet if it's the last one added
            if (cabinetIndex === path.cabinets.length - 1) {
                return { ...path, cabinets: path.cabinets.slice(0, -1) };
            }
            return path; // Cannot remove from middle
        } else {
            // Add the cabinet if the path is not full
            if (path.cabinets.length < limit) {
                return { ...path, cabinets: [...path.cabinets, { row, col }] };
            }
            return path;
        }
    }));
  };
  
  const handleMouseDown = (row: number, col: number) => {
    setIsDragging(true);
    handleCabinetClickOrDrag(row, col);
  };
  
  const handleMouseEnter = (row: number, col: number) => {
    if (isDragging) {
      handleCabinetClickOrDrag(row, col);
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleAddPath = () => {
    const isData = viewMode === 'data';
    const paths = isData ? manualDataPaths : manualPowerPaths;
    const setPaths = isData ? setManualDataPaths : setManualPowerPaths;
    const newId = (paths[paths.length - 1]?.id ?? -1) + 1;
    setPaths([...paths, { id: newId, cabinets: [] }]);
    setActivePathId(newId);
  };

  const handleClearPaths = () => {
    if (viewMode === 'data') {
      setManualDataPaths([]);
    } else {
      setManualPowerPaths([]);
    }
    setActivePathId(null);
  };
  
  const getManualPathForCabinet = (row: number, col: number) => {
    const paths = viewMode === 'data' ? manualDataPaths : manualPowerPaths;
    return paths.find(p => p.cabinets.some(c => c.row === row && c.col === col));
  };
  
  const canvasRef = useCallback((canvas: HTMLCanvasElement) => {
    const renderPaths = (ctx: CanvasRenderingContext2D, cabSize: number, gap: number) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.lineCap = 'round';

      // Style for wiring path
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 4;
  
      const getCenter = (r: number, c: number) => ({
        x: c * (cabSize + gap) + cabSize / 2,
        y: r * (cabSize + gap) + cabSize / 2,
      });

      const drawPath = (cabinets: {row: number, col: number}[]) => {
          if (cabinets.length < 2) return;
          ctx.beginPath();
          const start = getCenter(cabinets[0].row, cabinets[0].col);
          ctx.moveTo(start.x, start.y);
          for (let i = 1; i < cabinets.length; i++) {
              const end = getCenter(cabinets[i].row, cabinets[i].col);
              ctx.lineTo(end.x, end.y);
          }
          ctx.stroke();
      };
      
      if (effectiveWiringMode === 'manual') {
          const paths = viewMode === 'data' ? manualDataPaths : manualPowerPaths;
          paths.forEach(path => drawPath(path.cabinets));
      } else { // Auto mode
          const cabinetsPerGroup = viewMode === 'data' ? results.cabinetsPerPort : (selectedBreakerResult?.count || 0);
          if (cabinetsPerGroup <= 0) return;
          
          const totalGroups = viewMode === 'data' ? totalDataGroups : totalPowerGroups;
          const serpentinePath = viewMode === 'data' ? dataSerpentinePath : powerSerpentinePath;
          const visibleGroups = viewMode === 'data' ? visibleDataPorts : visiblePowerBreakers;
          
          for (let i = 0; i < totalGroups; i++) {
              if (!visibleGroups[i]) continue;
              const pathCabinets = serpentinePath.slice(i * cabinetsPerGroup, (i + 1) * cabinetsPerGroup);
              drawPath(pathCabinets);
          }
      }
    };

    if (canvas !== null) {
      const container = canvas.parentElement;
      if (container) {
          const gap = 2;
          const width = cabinetsHorizontal * (cabinetSize + gap) - gap;
          const height = cabinetsVertical * (cabinetSize + gap) - gap;
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            renderPaths(ctx, cabinetSize, gap);
          }
      }
    }
  }, [
      cabinetsHorizontal, cabinetsVertical, effectiveWiringMode, 
      viewMode, manualDataPaths, manualPowerPaths,
      results.cabinetsPerPort, selectedBreakerResult,
      dataSerpentinePath, powerSerpentinePath,
      visibleDataPorts, visiblePowerBreakers,
      totalDataGroups, totalPowerGroups, cabinetSize
  ]);

  if (totalCabinets === 0 || (viewMode === 'data' && results.cabinetsPerPort === 0) || (viewMode === 'power' && (selectedBreakerResult?.count || 0) === 0)) {
    return (
        <Card title={t('wiringDiagram')}>
            <div className="text-center p-8 bg-brand-primary rounded-lg">
                <p className="font-semibold text-brand-text-primary">{t('wiringDiagramError')}</p>
                <p className="text-sm text-brand-text-secondary mt-2">{t('wiringDiagramErrorHint')}</p>
            </div>
        </Card>
    );
  }

  useEffect(() => {
    const updateSize = () => {
      if (gridContainerRef.current) {
        const containerWidth = gridContainerRef.current.offsetWidth;
        const effectiveHorizontal = Math.max(1, cabinetsHorizontal);
        const maxCabinetWidth = (containerWidth / effectiveHorizontal) - 2; // 2 for gap
        setCabinetSize(Math.max(10, Math.min(24, maxCabinetWidth)));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [cabinetsHorizontal]);
  
  const getGroupColor = (r: number, c: number) => {
    const getIndex = viewMode === 'data' ? getDataGroupIndex : getPowerGroupIndex;
    const colors = viewMode === 'data' ? DATA_COLORS : POWER_COLORS;
    const index = getIndex(r,c);
    return index !== -1 ? colors[index % colors.length] : 'transparent';
  };
  
  const renderManualControls = () => {
    const isData = viewMode === 'data';
    const paths = isData ? manualDataPaths : manualPowerPaths;
    const limit = isData ? results.cabinetsPerPort : (selectedBreakerResult?.count || 0);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleAddPath}
              className="flex-grow flex items-center justify-center gap-2 bg-brand-accent/20 text-brand-accent text-sm font-bold py-2 px-3 rounded-md hover:bg-brand-accent/40 transition-colors"
            >
              <AddIcon />
              {isData ? t('addPort') : t('addCircuit')}
            </button>
            <button
              onClick={handleClearPaths}
              disabled={paths.length === 0}
              className="text-brand-text-secondary hover:text-red-500 text-sm font-semibold py-2 px-3 rounded-md disabled:opacity-50 transition-colors"
            >
              {t('clearAllPaths')}
            </button>
          </div>
          <ul className="space-y-1 max-h-48 overflow-y-auto pr-2">
            {paths.map(path => {
              const isFull = path.cabinets.length >= limit;
              return (
                <li key={path.id}>
                  <button
                    onClick={() => setActivePathId(path.id)}
                    className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                      activePathId === path.id
                        ? 'bg-brand-accent text-brand-primary'
                        : 'bg-brand-primary hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-4 h-4 rounded-full" style={{ backgroundColor: (viewMode === 'data' ? DATA_COLORS : POWER_COLORS)[path.id % 10] }} />
                         <span className="font-semibold">
                          {isData ? 'Port' : 'B'}{path.id + 1}
                         </span>
                      </div>
                      <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${isFull ? 'bg-green-500/20 text-green-400' : ''}`}>
                          {isFull ? t('pathComplete') : t('pathCapacity', { count: path.cabinets.length, limit: limit })}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
             {paths.length === 0 && <p className="text-xs text-center text-brand-text-secondary py-4">{t('selectPathToDraw')}</p>}
          </ul>
        </div>
      </div>
    );
  };
  
  const cabinetAspectRatio = useMemo(() => (
    config.cabinetWidthPx > 0 ? config.cabinetHeightPx / config.cabinetWidthPx : 1
  ), [config.cabinetHeightPx, config.cabinetWidthPx]);

  return (
    <Card title={t('wiringDiagram')}>
      {!isPrintMode && (
        <div className="flex flex-col sm:flex-row flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-brand-text-secondary">{t('diagramView')}</span>
            <Toggle
              value={viewMode}
              onChange={(v) => onDiagramStateChange?.({ viewMode: v as 'data' | 'power' })}
              options={[
                { value: 'data', label: t('data') },
                { value: 'power', label: t('powerView') }
              ]}
            />
          </div>
           <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-brand-text-secondary">{t('wiringMode')}</span>
            <Toggle
              value={wiringMode}
              onChange={(v) => setWiringMode(v as 'auto' | 'manual')}
              options={[
                { value: 'auto', label: t('autoMode') },
                { value: 'manual', label: t('manualMode') }
              ]}
            />
          </div>
        </div>
      )}

      {effectiveWiringMode === 'auto' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">{t('wiringPattern')}</label>
              <Toggle
                  value={viewMode === 'data' ? dataWiringPattern : powerWiringPattern}
                  onChange={(v) => onDiagramStateChange?.(viewMode === 'data' ? { dataWiringPattern: v as WiringPattern } : { powerWiringPattern: v as WiringPattern })}
                  options={[
                      { value: 'vertical', label: t('vertical') },
                      { value: 'horizontal', label: t('horizontal') }
                  ]}
              />
          </div>
          <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">{t('startCorner')}</label>
              <Toggle
                  value={viewMode === 'data' ? dataStartCorner : powerStartCorner}
                  onChange={(v) => onDiagramStateChange?.(viewMode === 'data' ? { dataStartCorner: v as StartCorner } : { powerStartCorner: v as StartCorner })}
                  options={[
                      { value: 'topLeft', label: <TopLeftIcon /> },
                      { value: 'topRight', label: <TopRightIcon /> },
                      { value: 'bottomLeft', label: <BottomLeftIcon /> },
                      { value: 'bottomRight', label: <BottomRightIcon /> }
                  ]}
              />
          </div>
        </div>
      )}
      
      {effectiveWiringMode === 'manual' && !isPrintMode && renderManualControls()}

      <div className="mt-6 flex flex-col items-center">
        <div 
          ref={gridContainerRef}
          className="relative w-full aspect-video max-w-full overflow-x-auto p-2 bg-brand-primary rounded-lg"
          style={{ touchAction: 'none' }}
        >
          <div 
            className="relative inline-block"
            onMouseLeave={handleMouseUp}
          >
            <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${cabinetsHorizontal}, ${cabinetSize}px)` }}>
              {Array.from({ length: totalCabinets }).map((_, i) => {
                const row = Math.floor(i / cabinetsHorizontal);
                const col = i % cabinetsHorizontal;
                const manualPath = effectiveWiringMode === 'manual' ? getManualPathForCabinet(row, col) : undefined;
                
                let backgroundColor = 'rgba(255, 255, 255, 0.05)';
                let label = '';
                
                if (effectiveWiringMode === 'manual' && manualPath) {
                    backgroundColor = (viewMode === 'data' ? DATA_COLORS : POWER_COLORS)[manualPath.id % 10];
                    label = (viewMode === 'data' ? 'P' : 'B') + (manualPath.id + 1);
                } else if (effectiveWiringMode === 'auto') {
                    const getIndex = viewMode === 'data' ? getDataGroupIndex : getPowerGroupIndex;
                    const groupIndex = getIndex(row, col);
                    const visibleGroups = viewMode === 'data' ? visibleDataPorts : visiblePowerBreakers;
                    if (groupIndex !== -1 && visibleGroups[groupIndex]) {
                      backgroundColor = getGroupColor(row, col);
                    }
                    if (viewMode === 'data' && dataGroupStartCabinets[groupIndex]?.row === row && dataGroupStartCabinets[groupIndex]?.col === col) {
                        label = `P${groupIndex + 1}`;
                    }
                    if (viewMode === 'power' && powerGroupStartCabinets[groupIndex]?.row === row && powerGroupStartCabinets[groupIndex]?.col === col) {
                        label = `B${groupIndex + 1}`;
                    }
                }

                return (
                  <div
                    key={i}
                    className="relative flex items-center justify-center text-white text-[8px] font-bold"
                    style={{ 
                        width: `${cabinetSize}px`, 
                        height: `${cabinetSize * cabinetAspectRatio}px`,
                        backgroundColor,
                        borderRadius: '2px',
                        cursor: effectiveWiringMode === 'manual' && activePathId !== null ? 'pointer' : 'default',
                        transition: 'background-color 0.2s',
                        boxShadow: activePathId !== null && manualPath?.id === activePathId ? `0 0 0 2px ${backgroundColor}` : 'none'
                    }}
                    onMouseDown={() => handleMouseDown(row, col)}
                    onMouseEnter={() => handleMouseEnter(row, col)}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
            <canvas ref={canvasRef} className="absolute top-0 left-0 pointer-events-none" />
          </div>
        </div>
      </div>
      
      {effectiveWiringMode === 'auto' && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-brand-text-secondary mb-2">{viewMode === 'data' ? 'Data Ports' : `Power Circuits (${selectedBreakerResult?.amps}A)`}</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: viewMode === 'data' ? totalDataGroups : totalPowerGroups }).map((_, i) => {
              const colors = viewMode === 'data' ? DATA_COLORS : POWER_COLORS;
              const isVisible = viewMode === 'data' ? visibleDataPorts[i] : visiblePowerBreakers[i];
              return (
                <button
                  key={i}
                  onClick={() => handleToggleVisibility(viewMode, i)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all border-2 ${
                    isVisible ? 'opacity-100' : 'opacity-40 hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: isVisible ? `${colors[i % colors.length]}33` : 'transparent',
                    borderColor: colors[i % colors.length],
                    color: colors[i % colors.length]
                  }}
                >
                  {viewMode === 'data' ? 'P' : 'B'}{i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};