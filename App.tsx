import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultsDisplay } from './components/ResultsDisplay';
// FIX: Import BreakerResult type to resolve type errors.
import type { ScreenConfig, CalculationResults, Project, BreakerResult } from './types';
import { VOLTAGE_OPTIONS, SYNC_PROCESSOR_PRESETS, ASYNC_PROCESSOR_PRESETS } from './constants';
import { Logo, SaveIcon, FolderIcon, DownloadIcon, UploadIcon } from './components/icons';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ProjectManager } from './components/ProjectManager';
import { useI18n } from './i18n';

const LOCAL_STORAGE_KEY = 'led-screen-manager-projects';

const App: React.FC = () => {
  const { t } = useI18n();
  const [config, setConfig] = useState<ScreenConfig>({
    cabinetWidthPx: 128,
    cabinetHeightPx: 128,
    cabinetWidthCm: 50,
    cabinetHeightCm: 50,
    cabinetsHorizontal: 16,
    cabinetsVertical: 9,
    powerPerCabinetW: 200,
    voltage: VOLTAGE_OPTIONS[0].value,
    portCapacityPx: SYNC_PROCESSOR_PRESETS[0].capacity, // Default to VX400
    processorPorts: SYNC_PROCESSOR_PRESETS[0].ports,
    cabinetPrice: 0,
    processorPrice: 0,
    playerPrice: 0,
    playerQuantity: 1,
    displayType: 'sync',
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedProjects) {
        const parsedProjects: Project[] = JSON.parse(savedProjects);
        parsedProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProjects(parsedProjects);
      }
    } catch (error) {
      console.error("Failed to load projects from localStorage:", error);
    }
  }, []);

  const handleSaveProject = useCallback(() => {
    const projectName = window.prompt(t('enterProjectName'));
    if (!projectName) return;

    setProjects(currentProjects => {
        const existingProject = currentProjects.find(p => p.name === projectName);
        if (existingProject) {
            if (!window.confirm(t('confirmOverwriteProject', { name: projectName }))) {
                return currentProjects; // Abort update by returning current state
            }
        }

        const newProject: Project = {
            id: existingProject?.id || Date.now().toString(),
            name: projectName,
            createdAt: new Date().toISOString(),
            config: config,
        };

        const updatedProjects = existingProject 
            ? currentProjects.map(p => p.id === existingProject.id ? newProject : p)
            : [newProject, ...currentProjects];

        updatedProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects));
            alert(t('projectSavedSuccess', { name: projectName }));
        } catch (error) {
            console.error("Failed to save project:", error);
            alert(t('projectSavedError'));
        }
        return updatedProjects;
    });
  }, [config, t]);
  
  const handleLoadProject = useCallback((id: string) => {
    const projectToLoad = projects.find(p => p.id === id);
    if (projectToLoad) {
      setConfig(projectToLoad.config);
      setIsProjectManagerOpen(false);
    }
  }, [projects]);

  const handleDeleteProject = useCallback((id: string, name: string) => {
    if (window.confirm(t('confirmDeleteProject', { name }))) {
        setProjects(currentProjects => {
            const updatedProjects = currentProjects.filter(p => p.id !== id);
            try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects));
                alert(t('projectDeletedSuccess', { name }));
            } catch (error) {
                console.error("Failed to delete project:", error);
                alert(t('projectDeleteError'));
            }
            return updatedProjects;
        });
    }
  }, [t]);

  const handleExportProject = useCallback(() => {
    try {
        const projectData = JSON.stringify(config, null, 2);
        const blob = new Blob([projectData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `led-project-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export project:", error);
        alert(t('projectExportError'));
    }
  }, [config, t]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File content is not text.");
            
            const importedConfig = JSON.parse(text);
            
            // Basic validation to ensure it's a valid config file
            if (typeof importedConfig.cabinetWidthPx === 'number' && typeof importedConfig.cabinetsHorizontal === 'number') {
                setConfig(importedConfig);
                alert(t('projectImportSuccess'));
            } else {
                throw new Error("Invalid project file format.");
            }
        } catch (error) {
            console.error("Failed to import project:", error);
            alert(t('projectImportError'));
        } finally {
            if(event.target) event.target.value = ''; // Reset file input
        }
    };
    reader.onerror = () => {
        alert(t('projectImportError'));
        if(event.target) event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleConfigChange = useCallback((newConfig: Partial<ScreenConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const calculations = useMemo<CalculationResults>(() => {
    const {
      cabinetWidthPx,
      cabinetHeightPx,
      cabinetWidthCm,
      cabinetHeightCm,
      cabinetsHorizontal,
      cabinetsVertical,
      powerPerCabinetW,
      voltage,
      portCapacityPx,
      processorPorts,
      cabinetPrice,
      processorPrice,
      playerPrice,
      playerQuantity,
    } = config;

    if (
      !cabinetWidthPx || !cabinetHeightPx || !cabinetsHorizontal || !cabinetsVertical || 
      !powerPerCabinetW || !portCapacityPx || !cabinetWidthCm || !cabinetHeightCm
    ) {
      return {
        totalWidthPx: 0,
        totalHeightPx: 0,
        totalCabinets: 0,
        totalPixels: 0,
        aspectRatio: '0:0',
        totalPowerW: 0,
        totalAmps: 0,
        breakerResults: [],
        cabinetsPerBreaker: [],
        requiredPorts: 0,
        totalProcessors: 0,
        cabinetsPerPort: 0,
        totalWidthM: 0,
        totalHeightM: 0,
        totalWidthFt: 0,
        totalHeightFt: 0,
        totalWidthIn: 0,
        totalHeightIn: 0,
        totalCabinetPrice: 0,
        totalProcessorPrice: 0,
        totalPlayerPrice: 0,
        grandTotalPrice: 0,
      };
    }

    const totalWidthPx = cabinetWidthPx * cabinetsHorizontal;
    const totalHeightPx = cabinetHeightPx * cabinetsVertical;
    const totalPixels = totalWidthPx * totalHeightPx;
    const totalCabinets = cabinetsHorizontal * cabinetsVertical;
    const totalPowerW = powerPerCabinetW * totalCabinets;
    const totalAmps = voltage > 0 ? totalPowerW / voltage : 0;

    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(totalWidthPx, totalHeightPx);
    const aspectRatio = divisor > 0 ? `${totalWidthPx / divisor}:${totalHeightPx / divisor}` : '0:0';

    const selectedVoltageStandard = VOLTAGE_OPTIONS.find(v => v.value === voltage) || VOLTAGE_OPTIONS[0];

    const ampsPerCabinet = voltage > 0 ? powerPerCabinetW / voltage : 0;
    const cabinetsPerBreaker: BreakerResult[] = selectedVoltageStandard.breakers.map(breakerAmps => {
        const safeAmps = breakerAmps * 0.8;
        const count = ampsPerCabinet > 0 ? Math.floor(safeAmps / ampsPerCabinet) : 0;
        return { amps: breakerAmps, count: isNaN(count) ? 0 : count };
    });
    
    const breakerResults: BreakerResult[] = selectedVoltageStandard.breakers.map((breakerAmps, index) => {
      const cabinetsOnThisBreakerType = cabinetsPerBreaker[index]?.count || 0;
      const count = cabinetsOnThisBreakerType > 0 ? Math.ceil(totalCabinets / cabinetsOnThisBreakerType) : 0;
      return { amps: breakerAmps, count: isNaN(count) ? 0 : count };
    });

    const requiredPorts = portCapacityPx > 0 ? Math.ceil(totalPixels / portCapacityPx) : 0;
    
    const allPresets = [...SYNC_PROCESSOR_PRESETS, ...ASYNC_PROCESSOR_PRESETS];
    const selectedPreset = allPresets.find(p => p.capacity === portCapacityPx && p.ports === processorPorts);

    let totalProcessors = 0;
    if (selectedPreset && selectedPreset.type === 'async') {
        const processorsByPixels = selectedPreset.totalCapacity > 0 ? Math.ceil(totalPixels / selectedPreset.totalCapacity) : 0;
        const processorsByPorts = processorPorts > 0 ? Math.ceil(requiredPorts / processorPorts) : 0;
        totalProcessors = Math.max(processorsByPixels, processorsByPorts);
    } else { // Sync or custom config
        totalProcessors = processorPorts > 0 ? Math.ceil(requiredPorts / processorPorts) : 0;
    }

    const pixelsPerCabinet = cabinetWidthPx * cabinetHeightPx;
    const cabinetsPerPort = pixelsPerCabinet > 0 ? Math.floor(portCapacityPx / pixelsPerCabinet) : 0;

    const totalWidthM = (cabinetsHorizontal * cabinetWidthCm) / 100;
    const totalHeightM = (cabinetsVertical * cabinetHeightCm) / 100;
    const totalWidthFt = totalWidthM * 3.28084;
    const totalHeightFt = totalHeightM * 3.28084;
    const totalWidthIn = totalWidthM * 39.3701;
    const totalHeightIn = totalHeightM * 39.3701;

    const totalCabinetPrice = totalCabinets * cabinetPrice;
    const totalProcessorPrice = totalProcessors * processorPrice;
    const totalPlayerPrice = playerQuantity * playerPrice;
    const grandTotalPrice = totalCabinetPrice + totalProcessorPrice + totalPlayerPrice;

    return {
      totalWidthPx,
      totalHeightPx,
      totalCabinets,
      totalPixels,
      aspectRatio,
      totalPowerW,
      totalAmps,
      breakerResults,
      cabinetsPerBreaker,
      requiredPorts,
      totalProcessors,
      cabinetsPerPort,
      totalWidthM,
      totalHeightM,
      totalWidthFt,
      totalHeightFt,
      totalWidthIn,
      totalHeightIn,
      totalCabinetPrice,
      totalProcessorPrice,
      totalPlayerPrice,
      grandTotalPrice,
    };
  }, [config]);

  return (
    <div className="min-h-screen bg-brand-primary text-brand-text-primary p-4 sm:p-8 font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/json,.json"
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <ProjectManager 
        isOpen={isProjectManagerOpen}
        projects={projects}
        onLoad={handleLoadProject}
        onDelete={handleDeleteProject}
        onClose={() => setIsProjectManagerOpen(false)}
      />
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Logo />
            <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">{t('appName')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSaveProject}
              className="flex items-center gap-2 bg-brand-secondary hover:bg-gray-700 text-brand-text-primary font-bold py-2 px-3 rounded-lg transition-colors"
              aria-label={t('saveProject')}
            >
              <SaveIcon />
              <span className="hidden sm:inline">{t('save')}</span>
            </button>
            <button 
              onClick={() => setIsProjectManagerOpen(true)}
              className="flex items-center gap-2 bg-brand-secondary hover:bg-gray-700 text-brand-text-primary font-bold py-2 px-3 rounded-lg transition-colors"
              aria-label={t('myProjects')}
            >
              <FolderIcon />
              <span className="hidden sm:inline">{t('myProjects')}</span>
            </button>
            <button 
              onClick={handleImportClick}
              className="flex items-center gap-2 bg-brand-secondary hover:bg-gray-700 text-brand-text-primary font-bold py-2 px-3 rounded-lg transition-colors"
              aria-label={t('importProject')}
            >
              <UploadIcon />
              <span className="hidden sm:inline">{t('importProject')}</span>
            </button>
            <button 
              onClick={handleExportProject}
              className="flex items-center gap-2 bg-brand-secondary hover:bg-gray-700 text-brand-text-primary font-bold py-2 px-3 rounded-lg transition-colors"
              aria-label={t('exportProject')}
            >
              <DownloadIcon />
              <span className="hidden sm:inline">{t('exportProject')}</span>
            </button>
            <LanguageSwitcher />
          </div>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <CalculatorForm config={config} onConfigChange={handleConfigChange} />
          </div>
          <div className="lg:col-span-2">
            <ResultsDisplay results={calculations} config={config} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;