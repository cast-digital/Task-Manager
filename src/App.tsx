/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, User as UserIcon, Terminal, Calendar, Sliders, Info, Server, RefreshCw } from 'lucide-react';
import { Task, Column, ActivityLog, DBConfigStatus, Project, User } from './types';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import TaskListView from './components/TaskListView';
import CalendarView from './components/CalendarView';
import ActivityLogsView from './components/ActivityLogsView';
import DbStatusWidget from './components/DbStatusWidget';
import TaskModal from './components/TaskModal';
import ProjectsView from './components/ProjectsView';
import LoginView from './components/LoginView';
import UsersView from './components/UsersView';
import WhatsappIntegrationView from './components/WhatsappIntegrationView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('kanban_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setView] = useState('kanban');
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [dbStatus, setDbStatus] = useState<DBConfigStatus | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // States para gerenciar abertura de modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<string | undefined>(undefined);

  // Re-buscar todos os dados
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Busca Status BD
      const resDb = await fetch('/api/db-status');
      if (resDb.ok) {
        const dataDb = await resDb.json();
        setDbStatus(dataDb);
      }

      // Busca Colunas Kanban
      const resCols = await fetch('/api/columns');
      if (resCols.ok) {
        const dataCols = await resCols.json();
        setColumns(dataCols);
      }

      // Busca Projetos
      const resProj = await fetch('/api/projects');
      if (resProj.ok) {
        const dataProj = await resProj.json();
        setProjects(dataProj);
      }

      // Busca Tarefas
      const resTasks = await fetch('/api/tasks');
      if (resTasks.ok) {
        const dataTasks = await resTasks.json();
        setTasks(dataTasks);
      }

      // Busca Histórico de Atividades
      const resLogs = await fetch('/api/logs');
      if (resLogs.ok) {
        const dataLogs = await resLogs.json();
        setLogs(dataLogs);
      }
    } catch (err: any) {
      console.error('Erro de sincronização com o servidor:', err);
      setErrorMessage('Falha na comunicação de dados com o servidor. A aplicação tentará restabelecer a conexão automaticamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [fetchData, currentUser]);

  // Cria ou Atualiza uma tarefa
  const handleSaveTask = async (taskData: Partial<Task> & { id?: string }) => {
    try {
      const isEdit = !!taskData.id;
      const url = isEdit ? `/api/tasks/${taskData.id}` : '/api/tasks';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (!res.ok) {
        throw new Error('Erro ao salvar as alterações da tarefa.');
      }

      // Atualiza localmente e busca novos logs para manter em sincronia perfeita
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro inesperado ao salvar tarefa.');
    }
  };

  // Cria ou atualiza um projeto
  const handleSaveProject = async (projectData: Partial<Project> & { id?: string }) => {
    try {
      const isEdit = !!projectData.id;
      const url = isEdit ? `/api/projects/${projectData.id}` : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (!res.ok) {
        throw new Error('Erro ao salvar as alterações do projeto.');
      }

      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro inesperado ao salvar projeto.');
    }
  };

  // Exclui um projeto
  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Erro ao excluir projeto.');
      }
      if (selectedProjectId === id) {
        setSelectedProjectId('all');
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro inesperado ao excluir projeto.');
    }
  };

  // Exclui uma tarefa
  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Erro ao excluir tarefa.');
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro de rede ao esvaziar tarefa.');
    }
  };

  // Faz logout da sessão
  const handleLogout = () => {
    localStorage.removeItem('kanban_user');
    setCurrentUser(null);
    setView('kanban');
  };

  // Move uma tarefa de coluna
  const handleMoveTask = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        throw new Error('Falha ao registrar movimento.');
      }
      await fetchData();
    } catch (err) {
      console.error('Erro ao mover tarefa:', err);
    }
  };

  // Cria uma nova coluna no Kanban
  const handleAddColumn = async (name: string) => {
    try {
      const res = await fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        throw new Error('Erro ao registrar nova coluna.');
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Deleta uma coluna
  const handleDeleteColumn = async (columnId: string) => {
    try {
      const res = await fetch(`/api/columns/${columnId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao deletar coluna.');
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Abre modal de criação padrão
  const openCreateTaskModal = (statusId?: string, initDate?: string) => {
    setSelectedTask(undefined);
    setModalDefaultStatus(statusId);
    setModalDefaultDate(initDate);
    setIsTaskModalOpen(true);
  };

  // Abre modal para edição
  const openEditTaskModal = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  // Encontra título visual para cabeçalho do navbar
  const getViewTitle = () => {
    switch (currentView) {
      case 'kanban': return 'Quadro de Tarefas (Kanban)';
      case 'list': return 'Lista Estruturada de Atividades';
      case 'agenda': return 'Agenda e Cronograma de Entrega';
      case 'projects': return 'Gerenciar Projetos Integrados';
      case 'users': return 'Gestão de Integrantes & Equipe';
      case 'whatsapp': return 'Central de Integração WhatsApp Web';
      case 'logs': return 'Histórico e Auditoria de Ações';
      case 'database': return 'Configurações de Sincronia Hostinger';
      default: return 'Painel de Gerenciamento';
    }
  };

  const filteredTasks = tasks.filter(
    (t) => selectedProjectId === 'all' || t.projectId === selectedProjectId
  );

  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          localStorage.setItem('kanban_user', JSON.stringify(u));
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50/50 overflow-hidden text-slate-900 font-sans" id="app-root-container">
      {/* Sidebar Navigation Panel */}
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        dbStatus={dbStatus} 
        taskCount={tasks.length} 
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Panel Area */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content-area">
        {/* Top Header Controls bar */}
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-8 flex items-center justify-between select-none shrink-0 sticky top-0 z-10">
          <div className="flex flex-col">
            <h1 className="text-base font-bold tracking-tight text-slate-800 font-sans">
              {getViewTitle()}
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Projeto Alpha • MySQL Dashboard</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Refresh buttons */}
            <button
              onClick={fetchData}
              title="Sincronizar base"
              className="text-slate-400 hover:text-slate-800 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Quick visual active profile */}
            <div className="hidden sm:flex items-center gap-2 border border-slate-200 bg-white px-3 py-1.5 rounded-lg text-xs text-slate-600 font-semibold custom-shadow select-none">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentUser.name}</span>
            </div>

            {/* Main Action create Button */}
            <button
              onClick={() => openCreateTaskModal()}
              className="bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 text-xs font-semibold px-4 py-2 rounded-md flex items-center gap-1.5 custom-shadow transition-all cursor-pointer"
              id="header-btn-create-task"
            >
              <Plus className="w-4 h-4" />
              Nova Tarefa
            </button>
          </div>
        </header>

        {/* Global Connection offline banner warnings if needed */}
        {errorMessage && (
          <div className="bg-amber-50 text-amber-800 px-8 py-2.5 text-xs font-medium border-b border-amber-200/50 flex justify-between items-center transition-all">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button 
              onClick={() => setErrorMessage(null)}
              className="text-[10px] text-amber-600 hover:text-amber-800 underline uppercase cursor-pointer"
            >
              Ocultar
            </button>
          </div>
        )}

        {/* Project Filtering Toolbar */}
        {['kanban', 'list', 'agenda'].includes(currentView) && (
          <div className="bg-white border-b border-slate-200/50 px-8 py-3 flex items-center gap-3 select-none flex-wrap shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans flex items-center gap-1">
              Filtro por Projeto:
            </span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedProjectId('all')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  selectedProjectId === 'all'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                📁 Todos os Projetos
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedProjectId === p.id
                      ? 'bg-slate-950 border-slate-950 text-white shadow-xs font-extrabold'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    p.color === 'indigo' ? 'bg-indigo-500' :
                    p.color === 'emerald' ? 'bg-emerald-500' :
                    p.color === 'sky' ? 'bg-sky-500' :
                    p.color === 'amber' ? 'bg-amber-500' :
                    p.color === 'rose' ? 'bg-rose-500' : 'bg-slate-500'
                  }`} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Inner Panel View depending on sidebar navigation */}
        <main className="flex-1 overflow-hidden relative flex flex-col" id="dashboard-viewer">
          {isLoading && tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-zinc-50">
              <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-sm animate-pulse">
                <Server className="w-6 h-6 text-zinc-400 animate-spin" />
              </div>
              <p className="text-xs text-zinc-400 mt-3 font-semibold font-mono uppercase tracking-widest leading-relaxed">
                Carregando registros do servidor...
              </p>
            </div>
          ) : (
            <>
              {currentView === 'kanban' && (
                <KanbanBoard
                  tasks={filteredTasks}
                  columns={columns}
                  projects={projects}
                  onTaskClick={openEditTaskModal}
                  onAddTaskClick={(colId) => openCreateTaskModal(colId)}
                  onAddColumn={handleAddColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onMoveTask={handleMoveTask}
                />
              )}

              {currentView === 'list' && (
                <TaskListView
                  tasks={filteredTasks}
                  columns={columns}
                  projects={projects}
                  onTaskClick={openEditTaskModal}
                  onAddTaskClick={() => openCreateTaskModal()}
                  onDeleteTask={handleDeleteTask}
                />
              )}

              {currentView === 'agenda' && (
                <CalendarView
                  tasks={filteredTasks}
                  projects={projects}
                  onTaskClick={openEditTaskModal}
                  onAddTaskClick={(_, date) => openCreateTaskModal(undefined, date)}
                />
              )}

              {currentView === 'projects' && (
                <ProjectsView
                  projects={projects}
                  tasks={tasks}
                  onSaveProject={handleSaveProject}
                  onDeleteProject={handleDeleteProject}
                />
              )}

              {currentView === 'users' && (
                <UsersView currentUser={currentUser} />
              )}

              {currentView === 'whatsapp' && (
                <WhatsappIntegrationView />
              )}

              {currentView === 'logs' && (
                <ActivityLogsView logs={logs} />
              )}

              {currentView === 'database' && (
                <DbStatusWidget dbStatus={dbStatus} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Shared Edit/Create Dynamic task modal layout */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(undefined);
          setModalDefaultDate(undefined);
          setModalDefaultStatus(undefined);
        }}
        task={selectedTask}
        columns={columns}
        projects={projects}
        defaultDate={modalDefaultDate}
        defaultStatus={modalDefaultStatus}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
