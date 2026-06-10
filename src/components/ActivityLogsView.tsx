/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { History, Activity, Calendar, Clock, Smile } from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityLogsViewProps {
  logs: ActivityLog[];
}

export default function ActivityLogsView({ logs }: ActivityLogsViewProps) {
  const formatBrazilianDateTime = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} às ${hours}:${minutes}`;
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/20 p-8 space-y-8" id="activity-logs-panel">
      <div className="bg-white border border-slate-150 rounded-xl p-6 custom-shadow">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 select-none">
          <History className="w-5 h-5 text-slate-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans">
              Histórico Geral de Atividades
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditoria em tempo-real das alterações efetuadas em tarefas, colunas e progresso do kanban.
            </p>
          </div>
        </div>

        <div className="mt-6">
          {logs.length === 0 ? (
            <div className="py-12 text-center rounded-lg border border-dashed border-slate-150 p-6">
              <Smile className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
              <p className="text-sm text-slate-500 font-semibold">Tudo calmo por aqui!</p>
              <p className="text-xs text-slate-400 mt-1">
                As ações executadas no gerenciador de tarefas aparecerão organizadas neste diário em tempo real.
              </p>
            </div>
          ) : (
            <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="relative group transition-all"
                  id={`log-item-${log.id}`}
                >
                  {/* Timeline Indicator Dot */}
                  <span className="absolute -left-[31px] top-1 bg-white border border-slate-350 p-1 rounded-full group-hover:border-slate-850 group-hover:bg-slate-900 group-hover:text-white text-slate-400 transition-colors shadow-xs">
                    <Activity className="w-2.5 h-2.5" />
                  </span>

                  {/* Log Content Card */}
                  <div className="p-4 bg-slate-50/60 hover:bg-slate-50 rounded-xl border border-slate-150/60 custom-shadow transition-all">
                    <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                      {log.action}
                    </p>
                    
                    {/* Log Date stamp */}
                    <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 mt-2 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatBrazilianDateTime(log.createdAt)}</span>
                      {log.taskTitle && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600 border border-slate-150 bg-white px-2 py-0.5 rounded-md font-sans font-bold">
                            {log.taskTitle}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
