import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { CalculationResults, ScreenConfig } from '../types';
import { PrintIcon, DownloadIcon } from './icons';
import { WiringDiagram, type DiagramState } from './WiringDiagram';
import { useI18n } from '../i18n';
import { ResultsGrid } from './ResultsGrid';
import { Toggle } from './ui/Toggle';

// Declare types for CDN-loaded libraries
declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
    }
}

interface ResultsDisplayProps {
  results: CalculationResults;
  config: ScreenConfig;
}

const PrintPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mount = document.getElementById('print-mount-root');
  return mount ? ReactDOM.createPortal(children, mount) : null;
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, config }) => {
  const { t } = useI18n();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4');
  const [diagramState, setDiagramState] = useState<DiagramState>({
    startCorner: 'bottomLeft',
    wiringPattern: 'vertical',
    viewMode: 'data',
    visibleDataPorts: {},
    visiblePowerBreakers: {},
  });

  useEffect(() => {
    const totalDataGroups = results.cabinetsPerPort > 0 ? Math.ceil(results.totalCabinets / results.cabinetsPerPort) : 0;
    
    const highestAmpsBreakerResult = [...results.cabinetsPerBreaker].sort((a, b) => b.amps - a.amps)[0];
    const cabinetsPerPowerGroup = highestAmpsBreakerResult?.count || 0;
    const totalPowerGroups = cabinetsPerPowerGroup > 0 ? Math.ceil(results.totalCabinets / cabinetsPerPowerGroup) : 0;

    setDiagramState(prev => ({
      ...prev,
      visibleDataPorts: Object.fromEntries(Array.from({ length: totalDataGroups }, (_, i) => [i, true])),
      visiblePowerBreakers: Object.fromEntries(Array.from({ length: totalPowerGroups }, (_, i) => [i, true]))
    }));
  }, [results.totalCabinets, results.cabinetsPerPort, results.cabinetsPerBreaker]);

  const handleDiagramStateChange = (newState: Partial<DiagramState>) => {
    setDiagramState(prevState => ({ ...prevState, ...newState }));
  };

  const handlePrint = () => {
    setIsPrinting(true);
  };
  
  const handleSavePdf = () => {
    if (!window.jspdf || !window.html2canvas) {
      alert('PDF generation library is not loaded. Please check your connection and try again.');
      return;
    }
    setIsSavingPdf(true);
  };

  // Effect for PDF Generation
  useEffect(() => {
    const portalRoot = document.getElementById('print-mount-root');
    if (!portalRoot) return;

    if (isSavingPdf) {
      portalRoot.classList.add('pdf-capture-mode');
      
      const generatePdf = async () => {
        // Wait a tick for DOM to update with the new class
        await new Promise(resolve => setTimeout(resolve, 50));
        
        try {
          const { jsPDF } = window.jspdf;
          const canvas = await window.html2canvas(portalRoot, {
            scale: 2,
            windowWidth: portalRoot.scrollWidth,
            windowHeight: portalRoot.scrollHeight,
          });
          const imgData = canvas.toDataURL('image/png');
          
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: paperSize });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          const imgProps = pdf.getImageProperties(imgData);
          const imgWidth = imgProps.width;
          const imgHeight = imgProps.height;

          const ratio = pdfWidth / imgWidth;
          const scaledImgHeight = imgHeight * ratio;

          let position = 0;
          let remainingHeight = scaledImgHeight;

          // Add the first page
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledImgHeight);
          remainingHeight -= pdfHeight;

          // Add subsequent pages if the content overflows
          while (remainingHeight > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledImgHeight);
            remainingHeight -= pdfHeight;
          }

          pdf.save('led-screen-summary.pdf');
        } catch(e) {
            console.error("Error generating PDF", e);
            alert("Sorry, there was an error generating the PDF.");
        } finally {
            portalRoot.classList.remove('pdf-capture-mode');
            setIsSavingPdf(false);
        }
      };
      generatePdf();
    }
    
    return () => {
        portalRoot.classList.remove('pdf-capture-mode');
    };
  }, [isSavingPdf, paperSize, diagramState]);

  // Effect for Browser Printing
  useEffect(() => {
    if (isPrinting) {
      const handleAfterPrint = () => setIsPrinting(false);
      window.addEventListener('afterprint', handleAfterPrint, { once: true });
      
      const printTimeout = setTimeout(() => window.print(), 50);

      return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
        clearTimeout(printTimeout);
      };
    }
  }, [isPrinting]);

  // Effect to manage print-specific stylesheet for paper size
  useEffect(() => {
    const styleId = 'print-paper-size-style';
    document.getElementById(styleId)?.remove();
    
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.innerHTML = `@media print { @page { size: ${paperSize}; } }`;
    document.head.appendChild(styleEl);

    return () => {
        document.getElementById(styleId)?.remove();
    };
  }, [paperSize]);

  const showPortal = isPrinting || isSavingPdf;

  return (
    <div className="flex flex-col gap-8 results-display-root">
      {showPortal && (
        <PrintPortal>
          <h1 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '1rem', color: 'black'}}>
            {t('appName')} - {t('summary')}
          </h1>
          <div className="print-container">
            <ResultsGrid results={results} config={config} />
          </div>
          <div style={{ pageBreakBefore: 'always', paddingTop: '1rem' }}>
            <h2 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '1rem', color: 'black'}}>
                {t('dataWiringDiagram')}
            </h2>
            <WiringDiagram
              config={config}
              results={results}
              isPrintMode={true}
              diagramState={{ ...diagramState, viewMode: 'data' }}
            />
          </div>
          <div style={{ pageBreakBefore: 'always', paddingTop: '1rem' }}>
            <h2 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '1rem', color: 'black'}}>
                {t('powerWiringDiagram')}
            </h2>
            <WiringDiagram
              config={config}
              results={results}
              isPrintMode={true}
              diagramState={{ ...diagramState, viewMode: 'power' }}
            />
          </div>
        </PrintPortal>
      )}

      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 no-print">
            <h2 className="text-2xl font-bold text-brand-text-primary whitespace-nowrap">{t('summary')}</h2>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <div>
                  <label className="sr-only">{t('paperSize')}</label>
                  <Toggle
                    value={paperSize}
                    onChange={(s) => setPaperSize(s as 'a4' | 'letter')}
                    options={[ { value: 'a4', label: t('a4') }, { value: 'letter', label: t('letter') } ]}
                  />
                </div>
                <button
                  onClick={handleSavePdf}
                  disabled={isSavingPdf}
                  className="flex items-center gap-2 bg-brand-secondary hover:bg-gray-700 text-brand-text-primary font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  aria-label={t('savePdf')}
                >
                  <DownloadIcon />
                  {isSavingPdf ? 'Saving...' : t('savePdf')}
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-brand-secondary hover:bg-gray-700 text-brand-text-primary font-bold py-2 px-4 rounded-lg transition-colors"
                  aria-label={t('printSummary')}
                >
                  <PrintIcon />
                  {t('print')}
                </button>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 printable-section">
          <ResultsGrid results={results} config={config} />
        </div>
      </div>
      <div className="no-print">
        <WiringDiagram 
            config={config} 
            results={results}
            diagramState={diagramState}
            onDiagramStateChange={handleDiagramStateChange}
        />
      </div>
    </div>
  );
};