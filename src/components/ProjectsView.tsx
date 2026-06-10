/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Folder, Plus, Trash2, Edit, Calendar, BookOpen, Layers, Check, X } from 'lucide-react';
import { Project, Task } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  onSaveProject: (projectData: Partial<Project> & { id?: string }) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

const COLOR_OPTIONS = [
  { value: 'indigo', label: 'Índigo', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  { value: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'sky', label: 'Celeste', bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', dot: 'bg-sky-500' },
  { value: 'amber', label: 'Âmbar', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-500' },
  { value: 'rose', label: 'Rosa', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', dot: 'bg-rose-500' },
  { value: 'slate', label: 'Grafite', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-500' },
];

export default function ProjectsView({
  projects,
  tasks,
  onSaveProject,
  onDeleteProject,
}: ProjectsViewProps) {
  // Form states
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('indigo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirm dialog state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Stats calculate
  const projectStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number }> = {};
    projects.forEach(p => {
      stats[p.id] = { total: 0, completed: 0 };
    });

    tasks.forEach(task => {
      if (task.projectId && stats[task.projectId]) {
        stats[task.projectId].total += 1;
        if (task.status === 'done') {
          stats[task.projectId].completed += 1;
        }
      }
    });

    return stats;
  }, [projects, tasks]);

  const handleEditClick = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description || '');
    setColor(p.color || 'indigo');
  };

  const handleClearForm = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setColor('indigo');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingProject) {
        await onSaveProject({
          id: editingProject.id,
          name,
          description,
          color,
        });
      } else {
        await onSaveProject({
          name,
          description,
          color,
        });
      }
      handleClearForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (p: Project) => {
    setProjectToDelete(p);
  };

  const handleConfirmDelete = async () => {
    if (projectToDelete) {
      try {
        await onDeleteProject(projectToDelete.id);
        if (editingProject?.id === projectToDelete.id) {
          handleClearForm();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setProjectToDelete(null);
      }
    }
  };

  const getThemeClasses = (colorValue?: string) => {
    const opt = COLOR_OPTIONS.find(o => o.value === colorValue) || COLOR_OPTIONS[0];
    return opt;
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30" id="projects-view-root">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: List of projects */}
        <div className="lg:col-span-2 space-y-5" id="projects-list-container">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
              Projetos Cadastrados ({projects.length})
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white border border-slate-200/60 rounded-xl p-10 text-center custom-shadow select-none">
              <Folder className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-bold font-sans">Nenhum projeto encontrado</p>
              <p className="text-[10px] text-slate-450 mt-1">Crie seu primeiro projeto no formulário ao lado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => {
                const theme = getThemeClasses(p.color);
                const stats = projectStats[p.id] || { total: 0, completed: 0 };
                const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

                return (
                  <div
                    key={p.id}
                    className={`bg-white border border-slate-200/70 hover:border-slate-300 rounded-xl p-5 custom-shadow flex flex-col justify-between transition-all relative group`}
                    id={`project-card-${p.id}`}
                  >
                    {/* Header Row */}
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <div className={`p-2 rounded-lg ${theme.bg} ${theme.text}`}>
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="p-1 text-slate-455 hover:text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                            title="Editar Projeto"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(p)}
                            className="p-1 text-slate-455 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Excluir Projeto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <h3 className="text-xs font-bold text-slate-800 font-sans tracking-wide">
                        {p.name}
                      </h3>
                      <p className="text-[10.5px] text-slate-450 mt-1.5 leading-relaxed min-h-[32px] line-clamp-2">
                        {p.description || 'Sem descrição cadastrada para este projeto.'}
                      </p>
                    </div>

                    {/* Progress & Meta Footer */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100/80">
                      <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-350" />
                          {stats.total} {stats.total === 1 ? 'tarefa' : 'tarefas'}
                        </span>
                        <span>{pct}% Concluído</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${theme.dot} transition-all duration-350`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Timestamp Info */}
                      <div className="flex items-center justify-between mt-3 text-[9px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-350" />
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                          {theme.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Create/Edit Form */}
        <div className="lg:col-span-1" id="project-form-container">
          <div className="bg-white border border-slate-200/70 rounded-xl p-5 custom-shadow sticky top-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-2">
                <Folder className="w-4 h-4 text-slate-500" />
                {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
              </h2>
              {editingProject && (
                <button
                  onClick={handleClearForm}
                  className="text-slate-400 hover:text-slate-600 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                  Nome do Projeto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Refatoração de APIs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-white font-sans font-semibold"
                  id="input-project-name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Explique brevemente as metas e o escopo deste projeto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-white font-sans font-medium resize-none min-h-[80px]"
                  id="input-project-desc"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                  Cor Temática / Identificação
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setColor(opt.value)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                        color === opt.value
                          ? `${opt.bg} ${opt.text} ${opt.border} ring-1 ring-offset-0 ring-${opt.value}-400`
                          : 'border-slate-150 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-5">
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="w-full bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  id="btn-save-project"
                >
                  {isSubmitting ? (
                    'Salvando...'
                  ) : (
                    <>
                      {editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!projectToDelete}
        title="Excluir Projeto"
        message={projectToDelete ? `Tem certeza que deseja desativar e excluir o projeto "${projectToDelete.name}"? As tarefas associadas a ele NÃO serão excluídas, mas perderão o vínculo com este projeto. Esta ação não pode ser desfeita.` : ''}
        confirmText="Sim, Excluir Projeto"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
}
