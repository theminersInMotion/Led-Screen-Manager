import React from 'react';
import type { Project } from '../types';
import { useI18n } from '../i18n';
import { DeleteIcon, CloseIcon, FolderIcon } from './icons';

interface ProjectManagerProps {
  isOpen: boolean;
  projects: Project[];
  onLoad: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onClose: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ isOpen, projects, onLoad, onDelete, onClose }) => {
  const { t } = useI18n();

  if (!isOpen) return null;
  
  const handleProjectDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); // Prevent load from triggering
    onDelete(id, name);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-manager-title"
    >
      <div 
        className="bg-brand-secondary rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[80vh] flex flex-col transform transition-transform duration-300 scale-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-600/50">
            <h2 id="project-manager-title" className="text-xl font-bold text-brand-accent flex items-center gap-3">
                <FolderIcon />
                {t('myProjects')}
            </h2>
            <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary transition-colors" aria-label={t('close')}>
                <CloseIcon />
            </button>
        </div>
        <div className="flex-grow overflow-y-auto -mr-2 pr-2">
          {projects.length > 0 ? (
            <ul className="space-y-2">
              {projects.map(project => (
                <li key={project.id}>
                  <div 
                    onClick={() => onLoad(project.id)}
                    className="flex items-center justify-between bg-brand-primary p-3 rounded-md border border-gray-600/50 hover:border-brand-accent transition-all cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onLoad(project.id)}
                  >
                    <div>
                      <p className="font-semibold text-brand-text-primary group-hover:text-brand-accent">{project.name}</p>
                      <p className="text-xs text-brand-text-secondary">
                        {t('savedOn', { date: new Date(project.createdAt).toLocaleDateString() })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); onLoad(project.id); }}
                            className="bg-brand-accent/20 text-brand-accent text-xs font-bold py-1 px-3 rounded-md hover:bg-brand-accent/40 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        >
                            {t('load')}
                        </button>
                        <button
                            onClick={(e) => handleProjectDelete(e, project.id, project.name)}
                            className="text-gray-500 hover:text-red-500 p-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label={`${t('delete')} ${project.name}`}
                        >
                            <DeleteIcon />
                        </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12 flex flex-col items-center justify-center h-full">
              <FolderIcon />
              <p className="text-brand-text-secondary mt-4">{t('noSavedProjects')}</p>
              <p className="text-xs text-brand-text-secondary/70 mt-1">{t('noSavedProjectsHint')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};