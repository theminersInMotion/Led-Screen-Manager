import React, { useState, useMemo } from 'react';
import type { ScreenConfig, CalculationResults } from '../types';
import { Card } from './ui/Card';
import { Toggle } from './ui/Toggle';
import { CableIcon, PowerIcon, DataFlowIcon } from './icons';
import { useI18n } from '../i18n';

interface WiringDiagramProps {
  config: ScreenConfig;
  results: CalculationResults;
}

type DiagramView = 'data' | 'power';

const WIRING_COLORS = [
  '#00bfff', '#ff4757', '#2ed573', '#ffa502', '#5352ed',
  '#feca57', '#ff6b81', '#1e90ff', '#ff9f43', '#32ff7e'
];

export const WiringDiagram: React.FC<WiringDiagramProps> = ({ config, results }) => {
  const [view, setView] = useState<DiagramView>('data');
  const { t } = useI18n();

  const { cabinetsHorizontal, cabinetsVertical } = config;

  const serpentinePath = useMemo(() => {
    const path: { row: number, col: number }[] = [];
    if (cabinetsHorizontal <= 0 || cabinetsVertical <= 0) return path;

    for (let row = 0; row < cabinetsVertical; row++) {
      if (row % 2 === 0) { // Left-to-right
        for (let col = 0; col < cabinetsHorizontal; col++) {
          path.push({ row, col });
        }
      } else { // Right-to-left
        for (let col = cabinetsHorizontal - 1; col >= 0; col--) {
          path.push({ row, col });
        }
      }
    }
    return path;
  }, [cabinetsHorizontal, cabinetsVertical]);

  const cabinetsPerGroup = view === 'data' 
    ? results.cabinetsPerPort 
    : results.cabinetsPer20ABreaker;

  const totalGroups = cabinetsPerGroup > 0 
    ? Math.ceil((cabinetsHorizontal * cabinetsVertical) / cabinetsPerGroup) 
    : 0;

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
            <div className="flex justify-center sm:justify-end">
                <Toggle
                    value={view}
                    onChange={(newView) => setView(newView)}
                    options={[
                        { value: 'data', label: <div className="flex items-center gap-2"><DataFlowIcon /> {t('data')}</div> },
                        { value: 'power', label: <div className="flex items-center gap-2"><PowerIcon /> {t('power20A')}</div> }
                    ]}
                />
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
                                    const cabinetIndex = serpentinePath.findIndex(p => p.row === r && p.col === c);
                                    const groupIndex = cabinetIndex !== -1 ? Math.floor(cabinetIndex / cabinetsPerGroup) : -1;
                                    const color = groupIndex !== -1 ? WIRING_COLORS[groupIndex % WIRING_COLORS.length] : '#4a4a4a';
                                    
                                    return (
                                        <rect
                                            key={`${r}-${c}`}
                                            x={x}
                                            y={y}
                                            width={cabinetSize}
                                            height={cabinetSize}
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
                                const groupIndex = Math.floor(i / cabinetsPerGroup);
                                const nextGroupIndex = Math.floor((i + 1) / cabinetsPerGroup);
                                
                                if (groupIndex !== nextGroupIndex) return null; // Don't draw line between groups

                                const { x: x1, y: y1 } = getCoords(p.row, p.col);
                                const { x: x2, y: y2 } = getCoords(nextP.row, nextP.col);
                                const color = WIRING_COLORS[groupIndex % WIRING_COLORS.length];
                                
                                return (
                                    <line
                                        key={`line-${i}`}
                                        x1={x1 + cabinetSize / 2}
                                        y1={y1 + cabinetSize / 2}
                                        x2={x2 + cabinetSize / 2}
                                        y2={y2 + cabinetSize / 2}
                                        stroke={color}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                );
                            })}
                            
                            {/* Render Labels */}
                             {Array.from({ length: totalGroups }).map((_, groupIndex) => {
                                const startIndex = groupIndex * cabinetsPerGroup;
                                if (startIndex >= serpentinePath.length) return null;

                                const startCabinet = serpentinePath[startIndex];
                                const { x, y } = getCoords(startCabinet.row, startCabinet.col);
                                const color = WIRING_COLORS[groupIndex % WIRING_COLORS.length];
                                const label = view === 'data' ? `P${groupIndex + 1}` : `B${groupIndex + 1}`;
                                
                                return (
                                    <g key={`label-group-${groupIndex}`}>
                                        <circle cx={x + cabinetSize/2} cy={y + cabinetSize/2} r={cabinetSize/3} fill={color} />
                                        <text
                                            x={x + cabinetSize / 2}
                                            y={y + cabinetSize / 2}
                                            textAnchor="middle"
                                            dy=".3em"
                                            fill="#0a0a0a"
                                            fontSize="10"
                                            fontWeight="bold"
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
