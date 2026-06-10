/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, User, Layers, AlertCircle, FileText, Trash2, Check, Folder } from 'lucide-react';
import { Task, Column, Project } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  columns: Column[];
  projects: Project[];
  defaultDate?: string;
  defaultStatus?: string;
  onSave: (taskData: Partial<Task> & { id?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function TaskModal({
  isOpen,
  onClose,
  task,
  columns,
  projects,
  defaultDate,
  defaultStatus,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || (columns[0]?.id || ''));
      setPriority(task.priority || 'Média');
      setStartDate(task.startDate || '');
      setDueDate(task.dueDate || '');
      setAssignee(task.assignee || '');
      setProjectId(task.projectId || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus || (columns[0]?.id || ''));
      setPriority('Média');
      setStartDate(defaultDate || '');
      setDueDate(defaultDate || '');
      setAssignee('');
      setProjectId('');
    }
  }, [task, isOpen, columns, defaultDate, defaultStatus]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        ...(task ? { id: task.id } : {}),
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        assignee: assignee.trim() || undefined,
        projectId: projectId || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Erro ao salvar tarefa:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!task || !onDelete) return;
    setIsSaving(true);
    try {
      await onDelete(task.id);
      setShowConfirmDelete(false);
      onClose();
    } catch (err) {
      console.error('Erro ao deletar tarefa:', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-150 overflow-hidden transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh] custom-shadow"
        id="task-dialog"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">
            {task ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            id="btn-close-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4" id="task-form">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
              Título da Tarefa
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Desenhar wireframes da dashboard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-xs placeholder-slate-400 text-slate-800 font-medium"
              id="input-task-title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
              Descrição / Detalhes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <textarea
                placeholder="Detalhes adicionais sobre as entregas e requisitos..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-xs placeholder-slate-400 text-slate-800 font-medium"
                id="input-task-desc"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                Status / Coluna
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-xs text-slate-800 cursor-pointer font-semibold"
                  id="select-task-status"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                Prioridade
              </label>
              <div className="relative">
                <AlertCircle className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-xs text-slate-800 cursor-pointer font-semibold"
                  id="select-task-priority"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>
          </div>

          {/* Projeto Associado */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
              Projeto Associado
            </label>
            <div className="relative">
              <Folder className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-xs text-slate-800 cursor-pointer font-semibold"
                id="select-task-project"
              >
                <option value="">Nenhum Projeto (Sem Vínculo)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
              Responsável / Responsável
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nome do membro da equipe"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-xs placeholder-slate-400 text-slate-800 font-semibold"
                id="input-task-assignee"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                Data de Início
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-xs text-slate-800 cursor-pointer font-semibold"
                  id="input-task-startdate"
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                Prazo / Due Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-xs text-slate-800 cursor-pointer font-semibold"
                  id="input-task-duedate"
                />
              </div>
            </div>
          </div>

          {/* Footer inside form to handle sticky display nicely */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-2 mt-6">
            <div>
              {task && onDelete && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={isSaving}
                  className="px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  id="btn-delete-task"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                id="btn-cancel-task"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className="px-4 py-2 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                id="btn-save-task"
              >
                {isSaving ? 'Salvando...' : (
                  <>
                    <Check className="w-4 h-4" />
                    {task ? 'Salvar Alterações' : 'Criar Tarefa'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Excluir Tarefa"
        message={`Tem certeza que deseja excluir permanentemente a tarefa "${task?.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </div>
  );
}
