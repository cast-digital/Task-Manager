/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash, Calendar, User, ArrowLeft, ArrowRight, ArrowUpRight, GripVertical } from 'lucide-react';
import { Column, Task, Project } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface KanbanBoardProps {
  tasks: Task[];
  columns: Column[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onAddTaskClick: (columnId: string) => void;
  onAddColumn: (name: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
  onMoveTask: (taskId: string, newStatus: string) => Promise<void>;
}

export default function KanbanBoard({
  tasks,
  columns,
  projects,
  onTaskClick,
  onAddTaskClick,
  onAddColumn,
  onDeleteColumn,
  onMoveTask,
}: KanbanBoardProps) {
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [colToDelete, setColToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    try {
      await onAddColumn(newColumnName.trim());
      setNewColumnName('');
      setIsAddingCol(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCol = (colId: string, colName: string) => {
    setColToDelete({ id: colId, name: colName });
  };

  const handleConfirmDeleteCol = async () => {
    if (colToDelete) {
      await onDeleteColumn(colToDelete.id);
      setColToDelete(null);
    }
  };

  // Drag-and-drop events
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessário para permitir o drop
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      await onMoveTask(taskId, targetColId);
    }
    setDraggedTaskId(null);
  };

  // Helper to change column index manually (excellent for mobile)
  const shiftColumn = async (task: Task, direction: 'left' | 'right') => {
    const currentIdx = columns.findIndex(c => c.id === task.status);
    if (currentIdx === -1) return;
    
    let targetIdx = direction === 'left' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx >= 0 && targetIdx < columns.length) {
      await onMoveTask(task.id, columns[targetIdx].id);
    }
  };

  // Helpers columns style priority labels
  const getPriorityStyle = (priority: Task['priority']) => {
    switch (priority) {
      case 'Alta':
        return 'bg-rose-50 text-rose-600 border-rose-100/60 font-semibold';
      case 'Média':
        return 'bg-amber-50 text-amber-600 border-amber-100/60 font-semibold';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 font-semibold';
    }
  };

  const formatBrazilianDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/30 select-none" id="kanban-view">
      {/* Scrollable Column Container */}
      <div className="flex-1 overflow-x-auto p-8 flex gap-6 items-start">
        {columns.map((col, colIdx) => {
          const colTasks = tasks
            .filter((t) => t.status === col.id)
            .sort((a, b) => a.position - b.position);

          return (
            <div
              key={col.id}
              className="w-80 bg-white rounded-xl border border-slate-200/50 shadow-xs flex flex-col max-h-[78vh] shrink-0 overflow-hidden custom-shadow"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              id={`kanban-col-${col.id}`}
            >
              {/* Column Header */}
              <div className="px-5 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-slate-800">{col.name}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 font-mono font-bold px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                {columns.length > 1 && (
                  <button
                    onClick={() => handleDeleteCol(col.id, col.name)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Deletar coluna"
                    id={`btn-del-col-${col.id}`}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[150px] bg-slate-50/10">
                {colTasks.length === 0 ? (
                  <div className="h-28 border-2 border-dashed border-slate-200/80 rounded-xl flex items-center justify-center p-4 text-center">
                    <span className="text-xs text-slate-400">Solte tarefas aqui</span>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white p-5 rounded-xl border border-slate-200/40 hover:border-slate-300 shadow-xs transition-all relative group cursor-grab active:cursor-grabbing hover:shadow-md custom-shadow"
                      id={`kanban-task-card-${task.id}`}
                    >
                      {/* Drag Handle Overlay */}
                      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                      </div>

                      {/* Priority and Project Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityStyle(task.priority)}`}>
                            {task.priority}
                          </span>
                          {(() => {
                            const project = projects.find(p => p.id === task.projectId);
                            if (!project) return null;
                            return (
                              <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-500 flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  project.color === 'indigo' ? 'bg-indigo-500' :
                                  project.color === 'emerald' ? 'bg-emerald-500' :
                                  project.color === 'sky' ? 'bg-sky-500' :
                                  project.color === 'amber' ? 'bg-amber-500' :
                                  project.color === 'rose' ? 'bg-rose-500' : 'bg-slate-500'
                                }`} />
                                {project.name}
                              </span>
                            );
                          })()}
                        </div>
                        
                        {/* Mobile quick navigator arrows */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {colIdx > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                shiftColumn(task, 'left');
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                              title="Mover para esquerda"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          {colIdx < columns.length - 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                shiftColumn(task, 'right');
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                              title="Mover para direita"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Task Title */}
                      <h4 
                        onClick={() => onTaskClick(task)}
                        className="text-sm font-bold text-slate-900 group-hover:text-slate-950 font-sans cursor-pointer hover:underline decoration-slate-400 decoration-1"
                      >
                        {task.title}
                      </h4>

                      {/* Task Description */}
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Footer Info */}
                      {(task.dueDate || task.assignee) && (
                        <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-100">
                          {task.dueDate ? (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatBrazilianDate(task.dueDate)}</span>
                            </div>
                          ) : (
                            <div />
                          )}
                          {task.assignee && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg max-w-[124px] truncate font-semibold">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{task.assignee}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add Task footer button */}
              <div className="p-3 bg-white border-t border-slate-100">
                <button
                  onClick={() => onAddTaskClick(col.id)}
                  className="w-full py-2 px-3 border border-dashed border-slate-200 hover:border-slate-800 hover:bg-slate-50 rounded-lg text-xs text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                  id={`btn-add-task-col-${col.id}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Tarefa
                </button>
              </div>
            </div>
          );
        })}

        {/* Create New Column UI */}
        <div className="w-72 bg-white rounded-xl border border-slate-200/50 shadow-xs p-5 shrink-0 overflow-hidden custom-shadow">
          {!isAddingCol ? (
            <button
              onClick={() => setIsAddingCol(true)}
              className="w-full py-2 border border-dashed border-slate-200 hover:border-slate-800 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              id="btn-trigger-new-col"
            >
              <Plus className="w-4 h-4" />
              Nova Coluna
            </button>
          ) : (
            <form onSubmit={handleAddColumn} className="space-y-3" id="form-new-column">
              <input
                type="text"
                required
                placeholder="Ex: Em Homologação"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-white"
                autoFocus
                id="input-new-col-name"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 px-3 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  id="btn-confirm-col-create"
                >
                  Criar Coluna
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCol(false)}
                  className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs rounded-lg transition-colors cursor-pointer"
                  id="btn-cancel-col-create"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Column Delete Custom Confirmation */}
      <ConfirmDialog
        isOpen={!!colToDelete}
        title="Excluir Coluna"
        message={colToDelete ? `Tem certeza que deseja desativar e excluir a coluna "${colToDelete.name}"?${tasks.filter(t => t.status === colToDelete.id).length > 0 ? ` Suas ${tasks.filter(t => t.status === colToDelete.id).length} tarefas serão transferidas automaticamente para a primeira coluna.` : ' Esta ação não pode ser desfeita.'}` : ''}
        confirmText="Sim, Excluir Coluna"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleConfirmDeleteCol}
        onCancel={() => setColToDelete(null)}
      />
    </div>
  );
}
