/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, ChevronDown, Calendar, User, Eye, Trash2, Edit } from 'lucide-react';
import { Task, Column, Project } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface TaskListViewProps {
  tasks: Task[];
  columns: Column[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onAddTaskClick: (columnId?: string) => void;
  onDeleteTask: (id: string) => Promise<void>;
}

type SortField = 'title' | 'dueDate' | 'priority' | 'status';
type SortOrder = 'asc' | 'desc';

export default function TaskListView({
  tasks,
  columns,
  projects,
  onTaskClick,
  onAddTaskClick,
  onDeleteTask,
}: TaskListViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);

  // Metricas rápidas
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const pending = total - completed;
    
    // Tarefas atrasadas (se data de vencimento for menor que hoje e status nao for concluido)
    const todayStr = new Date().toISOString().slice(0, 10);
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'done').length;

    return { total, completed, pending, overdue };
  }, [tasks]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Convert priority string back to numeric level to allow correct sorting logic
  const getPriorityWeight = (priority: Task['priority']) => {
    switch (priority) {
      case 'Alta': return 3;
      case 'Média': return 2;
      default: return 1;
    }
  };

  // Filtragem e ordenação
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          task.description.toLowerCase().includes(search.toLowerCase()) ||
          (task.assignee && task.assignee.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        let valueA: any = a[sortField];
        let valueB: any = b[sortField];

        if (sortField === 'priority') {
          valueA = getPriorityWeight(a.priority);
          valueB = getPriorityWeight(b.priority);
        } else if (sortField === 'status') {
          // Ordena pelo index das colunas
          valueA = columns.findIndex(c => c.id === a.status);
          valueB = columns.findIndex(c => c.id === b.status);
        }

        // Se o valor for vazio, move para o final para organizar melhor
        if (valueA === undefined || valueA === null || valueA === '') return 1;
        if (valueB === undefined || valueB === null || valueB === '') return -1;

        if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [tasks, columns, search, statusFilter, priorityFilter, sortField, sortOrder]);

  const getPriorityBadgeAndStyle = (priority: Task['priority']) => {
    switch (priority) {
      case 'Alta':
        return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Média':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getColumnName = (colId: string) => {
    return columns.find((c) => c.id === colId)?.name || colId;
  };

  const getColumnBadgeColor = (colId: string) => {
    switch (colId) {
      case 'todo': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'inprogress': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'inreview': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'done': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const formatBrazilianDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    setTaskToDelete({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      await onDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/20 p-8 space-y-8" id="tasks-list-panel">
      {/* 4 Cards Metricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 select-none">
        <div className="bg-white border border-slate-150 p-5 rounded-xl custom-shadow">
          <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-bold">Total de Tarefas</span>
          <p className="text-2xl font-extrabold font-sans text-slate-800 mt-1">{metrics.total}</p>
        </div>
        <div className="bg-white border border-slate-150 p-5 rounded-xl custom-shadow">
          <span className="text-[10px] text-sky-500 font-mono tracking-wider uppercase font-bold">Pendentes</span>
          <p className="text-2xl font-extrabold font-sans text-sky-600 mt-1">{metrics.pending}</p>
        </div>
        <div className="bg-white border border-slate-150 p-5 rounded-xl custom-shadow">
          <span className="text-[10px] text-emerald-500 font-mono tracking-wider uppercase font-bold">Concluídas</span>
          <p className="text-2xl font-extrabold font-sans text-emerald-600 mt-1">{metrics.completed}</p>
        </div>
        <div className="bg-white border border-slate-150 p-5 rounded-xl custom-shadow">
          <span className="text-[10px] text-rose-500 font-mono tracking-wider uppercase font-bold">Atrasadas</span>
          <p className="text-2xl font-extrabold font-sans text-rose-600 mt-1">{metrics.overdue}</p>
        </div>
      </div>

      {/* Seção de Filtros */}
      <div className="bg-white border border-slate-150 rounded-xl p-5 custom-shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Caixa Pesquisa */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por título, descrição ou responsável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-slate-800 placeholder-slate-400 font-sans"
              id="list-search-input"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Filtro Status */}
            <div className="flex items-center border border-slate-150 rounded-lg bg-slate-50 px-3 cursor-pointer select-none">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <span className="text-xs text-slate-400 mr-1.5 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-700 font-bold focus:outline-none cursor-pointer py-2"
                id="filter-status-select"
              >
                <option value="all">Todos</option>
                {columns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Filtro Prioridade */}
            <div className="flex items-center border border-slate-150 rounded-lg bg-slate-50 px-3 cursor-pointer select-none">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <span className="text-xs text-slate-400 mr-1.5 font-medium">Prioridade:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-700 font-bold focus:outline-none cursor-pointer py-2"
                id="filter-priority-select"
              >
                <option value="all">Todas</option>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>

            {/* Reset */}
            {(search || statusFilter !== 'all' || priorityFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs rounded-lg transition-colors cursor-pointer font-bold"
                id="btn-reset-filters"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Tarefas */}
      <div className="bg-white border border-slate-150 rounded-xl custom-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="tasks-table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 select-none">
                <th 
                  onClick={() => handleSort('title')}
                  className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tarefa</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-800 w-44"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('priority')}
                  className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-800 w-32"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Prioridade</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('dueDate')}
                  className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-800 w-40"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Prazo</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-44">
                  <span>Responsável</span>
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-28 text-right">
                  <span>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    Nenhuma tarefa encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr 
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    id={`table-row-${task.id}`}
                  >
                    {/* Linha Principal - Descricao */}
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <span className="text-sm font-bold text-slate-850 group-hover:text-slate-950 block truncate">
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {task.description && (
                            <span className="text-xs text-slate-400 block truncate max-w-[280px]">
                              {task.description}
                            </span>
                          )}
                          {(() => {
                            const project = projects.find(p => p.id === task.projectId);
                            if (!project) return null;
                            return (
                              <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-500 inline-flex items-center gap-1 shrink-0">
                                <span className={`w-1 h-1 rounded-full ${
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
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border inline-block uppercase tracking-wider ${getColumnBadgeColor(task.status)}`}>
                        {getColumnName(task.status)}
                      </span>
                    </td>

                    {/* Priority Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border inline-block uppercase tracking-wider ${getPriorityBadgeAndStyle(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatBrazilianDate(task.dueDate)}</span>
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.assignee ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[130px]">{task.assignee}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-350">Sem responsável</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task);
                          }}
                          className="p-1 px-2.5 border border-slate-200 hover:border-slate-800 bg-white rounded-lg text-xs text-slate-605 hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                          title="Ver Detalhes"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, task.id, task.title)}
                          className="p-1 px-2 border border-rose-100 hover:border-rose-450 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                          title="Excluir"
                          id={`btn-del-task-table-${task.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Excluir Tarefa"
        message={`Tem certeza que deseja excluir permanentemente a tarefa "${taskToDelete?.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}

