/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { KanbanSquare, ListTodo, Calendar, History, Database, Layers, CheckSquare, Folder, Users, LogOut, MessageSquare } from 'lucide-react';
import { DBConfigStatus, User } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  dbStatus: DBConfigStatus | null;
  taskCount: number;
  currentUser: User;
  onLogout: () => void;
}

export default function Sidebar({ currentView, setView, dbStatus, taskCount, currentUser, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'kanban', label: 'Quadro Kanban', icon: KanbanSquare },
    { id: 'list', label: 'Lista de Tarefas', icon: ListTodo },
    { id: 'agenda', label: 'Agenda / Calendário', icon: Calendar },
    { id: 'projects', label: 'Gerenciar Projetos', icon: Folder },
    { id: 'users', label: 'Equipe & Usuários', icon: Users },
    { id: 'whatsapp', label: 'Integração WhatsApp', icon: MessageSquare },
    { id: 'logs', label: 'Histórico de Ações', icon: History },
    { id: 'database', label: 'Hospedagem & Banco', icon: Database },
  ];

  return (
    <aside 
      className="w-64 bg-white text-slate-800 flex flex-col justify-between border-r border-slate-100 shrink-0 select-none"
      id="app-sidebar"
    >
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center shadow-sm">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 font-sans italic">
              CastTaskManager
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              Gerenciador Sóbrio
            </p>
          </div>
        </div>
      </div>

      {/* Main Menu Links */}
      <div className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group cursor-pointer ${
                isActive
                  ? 'bg-slate-50 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/70'
              }`}
              id={`sidebar-item-${item.id}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                }`} />
                <span>{item.label}</span>
              </div>
              {item.id === 'list' && taskCount > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                }`}>
                  {taskCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Diagnostic Panel */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="rounded-xl bg-white border border-slate-150 p-4 space-y-3.5 custom-shadow">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Banco de Dados
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                dbStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
              }`} />
              <span className={`text-[10px] uppercase font-mono font-bold ${
                dbStatus?.connected ? 'text-emerald-500' : 'text-amber-500'
              }`}>
                {dbStatus?.connected ? 'mysql' : 'local json'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[11px] text-slate-700 border border-slate-200 shrink-0">
                {currentUser.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800 truncate" title={currentUser.name}>
                  {currentUser.name}
                </span>
                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors cursor-pointer"
              title="Sair do sistema/logout"
              id="sidebar-logout-button"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
