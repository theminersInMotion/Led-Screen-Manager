import React, { useState, useMemo, useCallback } from 'react';
import type { ScreenConfig, CalculationResults } from '../types';
import { Card } from './ui/Card';
import { Toggle } from './ui/Toggle';
import { DataFlowIcon, TopLeftIcon, TopRightIcon, BottomLeftIcon, BottomRightIcon } from './icons';
import { useI18n } from '../i18n';

interface WiringDiagramProps {
  config: ScreenConfig;
  results: CalculationResults;
}

type DiagramView = 'data' | 'power';
type StartCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
type WiringPattern = 'horizontal' | 'vertical';

const WIRING_COLORS = [
  '#00bfff', '#ff4757', '#2ed573', '#ffa502', '#5352ed',
  '#feca57', '#ff6b81', '#1e90ff', '#ff9f43', '#32ff7e'
];

export const WiringDiagram: React.FC<WiringDiagramProps> = ({ config, results }) => {
  const [view, setView] = useState<DiagramView>('data');
  const [startCorner, setStartCorner] = useState<StartCorner>('bottomLeft');
  const [wiringPattern, setWiringPattern] = useState<WiringPattern>('vertical');
  const { t } = useI18n();

  const { cabinetsHorizontal, cabinetsVertical } = config;

  const highestAmpsBreakerResult = useMemo(() => {
    if (!results.cabinetsPerBreaker || results.cabinetsPerBreaker.length === 0) {
        return null;
    }
    return [...results.cabinetsPerBreaker].sort((a, b) => b.amps - a.amps)[0];
  }, [results.cabinetsPerBreaker]);

  const powerToggleLabel = highestAmpsBreakerResult 
    ? t('powerAmps', { amps: highestAmpsBreakerResult.amps })
    : t('power');

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

  const cabinetsPerGroup = view === 'data' 
    ? results.cabinetsPerPort 
    : (highestAmpsBreakerResult?.count || 0);

  const groupingStrategy = useMemo(() => {
    if (wiringPattern === 'vertical' && cabinetsVertical > 0) {
      return cabinetsPerGroup >= cabinetsVertical ? 'rectangular' : 'contiguous';
    }
    if (wiringPattern === 'horizontal' && cabinetsHorizontal > 0) {
      return cabinetsPerGroup >= cabinetsHorizontal ? 'rectangular' : 'contiguous';
    }
    return 'contiguous';
  }, [wiringPattern, cabinetsPerGroup, cabinetsVertical, cabinetsHorizontal]);

  const getGroupIndex = useCallback((r: number, c: number): number => {
    if (cabinetsPerGroup <= 0) return -1;

    if (groupingStrategy === 'rectangular') {
      if (wiringPattern === 'vertical') {
        const colsPerGroup = Math.floor(cabinetsPerGroup / cabinetsVertical);
        if (colsPerGroup === 0) return -1; // Should not happen due to strategy check
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
      const cabinetIndex = serpentinePath.findIndex(p => p.row === r && p.col === c);
      return cabinetIndex !== -1 ? Math.floor(cabinetIndex / cabinetsPerGroup) : -1;
    }
  }, [groupingStrategy, wiringPattern, cabinetsPerGroup, cabinetsVertical, cabinetsHorizontal, startCorner, serpentinePath]);

  const totalGroups = useMemo(() => {
    if (cabinetsPerGroup <= 0) return 0;
    const totalCabinets = cabinetsHorizontal * cabinetsVertical;
    if (totalCabinets === 0) return 0;
    
    if (groupingStrategy === 'rectangular') {
      if (wiringPattern === 'vertical') {
        const colsPerGroup = Math.floor(cabinetsPerGroup / cabinetsVertical);
        return colsPerGroup > 0 ? Math.ceil(cabinetsHorizontal / colsPerGroup) : 0;
      } else { // horizontal
        const rowsPerGroup = Math.floor(cabinetsPerGroup / cabinetsHorizontal);
        return rowsPerGroup > 0 ? Math.ceil(cabinetsVertical / rowsPerGroup) : 0;
      }
    } else {
      return Math.ceil(totalCabinets / cabinetsPerGroup);
    }
  }, [groupingStrategy, wiringPattern, cabinetsPerGroup, cabinetsHorizontal, cabinetsVertical]);

  const groupStartCabinets = useMemo(() => {
    return serpentinePath.reduce((acc, cabinet) => {
        const groupIndex = getGroupIndex(cabinet.row, cabinet.col);
        if (groupIndex !== -1 && !acc[groupIndex]) {
            acc[groupIndex] = cabinet;
        }
        return acc;
    }, {} as Record<number, {row: number, col: number}>);
  }, [serpentinePath, getGroupIndex]);

  const cabinetSize = 32;
  const gap = 6;
  const cabinetAndGap = cabinetSize + gap;
  
  const totalWidth = cabinetsHorizontal * cabinetAndGap - gap;
  const totalHeight = cabinetsVertical * cabinetAndGap - gap;

  const getCoords = (row: number, col: number) => ({
    x: col * cabinetAndGap,
    y: row * cabinetAndGap,
  });

  return (
    <Card title={t('wiringDiagram')}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-6 bg-brand-primary p-4 rounded-md border border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-brand-text-primary">
                <DataFlowIcon />
                <h3 className="font-semibold text-base">{t('wiringOptions')}</h3>
            </div>
            <Toggle
                value={view}
                onChange={(newView) => setView(newView)}
                options={[
                    { value: 'data', label: <div className="flex items-center gap-2">{t('data')}</div> },
                    { value: 'power', label: <div className="flex items-center gap-2">{powerToggleLabel}</div> }
                ]}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('wiringPattern')}</label>
                <Toggle
                    value={wiringPattern}
                    onChange={(p) => setWiringPattern(p)}
                    options={[
                        { value: 'vertical', label: t('vertical') },
                        { value: 'horizontal', label: t('horizontal') }
                    ]}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('startCorner')}</label>
                <Toggle
                    value={startCorner}
                    onChange={(c) => setStartCorner(c)}
                    options={[
                        { value: 'topLeft', label: <TopLeftIcon /> },
                        { value: 'topRight', label: <TopRightIcon /> },
                        { value: 'bottomLeft', label: <BottomLeftIcon /> },
                        { value: 'bottomRight', label: <BottomRightIcon /> },
                    ]}
                />
            </div>
          </div>
        </div>

        {totalGroups > 0 ? (
          <div className="w-full bg-brand-primary p-4 rounded-md overflow-x-auto">
            <svg
              viewBox={`-16 -16 ${totalWidth + 32} ${totalHeight + 32}`}
              width="100%"
              height="100%"
              style={{ minWidth: Math.max(300, totalWidth / 2), minHeight: Math.max(200, totalHeight / 2) }}
              aria-label={`Wiring diagram showing ${view} connections.`}
            >
              <g>
                {/* Render Cabinets */}
                {Array.from({ length: cabinetsVertical }).map((_, r) =>
                  Array.from({ length: cabinetsHorizontal }).map((_, c) => {
                    const { x, y } = getCoords(r, c);
                    const groupIndex = getGroupIndex(r, c);
                    const color = groupIndex !== -1 ? WIRING_COLORS[groupIndex % WIRING_COLORS.length] : '#4a4a4a';
                    
                    return (
                      <rect
                        key={`${r}-${c}`}
                        x={x} y={y}
                        width={cabinetSize} height={cabinetSize}
                        fill="#1a1a1a"
                        stroke={color}
                        strokeWidth="2"
                        rx="2"
                      />
                    );
                  })
                )}
                
                {/* Render Wires */}
                {serpentinePath.slice(0, -1).map((p, i) => {
                  const nextP = serpentinePath[i + 1];
                  const groupIndex = getGroupIndex(p.row, p.col);
                  const nextGroupIndex = getGroupIndex(nextP.row, nextP.col);
                  
                  if (groupIndex === -1 || groupIndex !== nextGroupIndex) return null;

                  const { x: x1, y: y1 } = getCoords(p.row, p.col);
                  const { x: x2, y: y2 } = getCoords(nextP.row, nextP.col);
                  const color = WIRING_COLORS[groupIndex % WIRING_COLORS.length];
                  
                  return (
                    <line
                      key={`line-${i}`}
                      x1={x1 + cabinetSize / 2} y1={y1 + cabinetSize / 2}
                      x2={x2 + cabinetSize / 2} y2={y2 + cabinetSize / 2}
                      stroke={color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  );
                })}
                
                {/* Render Labels */}
                {Object.entries(groupStartCabinets).map(([groupIndexStr, startCabinet]) => {
                  const groupIndex = parseInt(groupIndexStr, 10);
                  const { x, y } = getCoords(startCabinet.row, startCabinet.col);
                  const color = WIRING_COLORS[groupIndex % WIRING_COLORS.length];
                  const label = view === 'data' ? `P${groupIndex + 1}` : `B${groupIndex + 1}`;
                  
                  return (
                    <g key={`label-group-${groupIndex}`}>
                      <circle cx={x + cabinetSize/2} cy={y + cabinetSize/2} r={cabinetSize/3} fill={color} />
                      <text
                        x={x + cabinetSize / 2} y={y + cabinetSize / 2}
                        textAnchor="middle" dy=".3em" fill="#0a0a0a"
                        fontSize="10" fontWeight="bold"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        ) : (
          <div className="text-center text-brand-text-secondary p-8 bg-brand-primary rounded-md">
            <p>{t('wiringDiagramError')}</p>
            <p className="text-sm">{t('wiringDiagramErrorHint')}</p>
          </div>
        )}
      </div>
    </Card>
  );
};
