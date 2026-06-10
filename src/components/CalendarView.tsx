/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, User, AlertCircle } from 'lucide-react';
import { Task, Project } from '../types';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onAddTaskClick: (columnId?: string, date?: string) => void;
}

export default function CalendarView({
  tasks,
  projects,
  onTaskClick,
  onAddTaskClick,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Gera dias do grid de calendário (42 células para cobrir o mês inteiro adequadamente)
  const calendarDays = useMemo(() => {
    // Primeiro dia do mês corrente
    const firstDay = new Date(year, month, 1);
    // Dia da semana do primeiro dia do mês (0 = Domingo, 1 = Segunda, ...)
    const firstDayOfWeek = firstDay.getDay();

    // Total de dias no mês
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Dias do mês anterior para preenchimento
    const totalDaysPrev = new Date(year, month, 0).getDate();

    const days: Array<{
      date: string; // YYYY-MM-DD
      dayNum: number;
      isCurrentMonth: boolean;
      fullDateObj: Date;
    }> = [];

    // Preenche dias do mês anterior
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDayNum = totalDaysPrev - i;
      const prevMonthObj = new Date(year, month - 1, prevDayNum);
      const yStr = prevMonthObj.getFullYear();
      const mStr = String(prevMonthObj.getMonth() + 1).padStart(2, '0');
      const dStr = String(prevDayNum).padStart(2, '0');
      days.push({
        date: `${yStr}-${mStr}-${dStr}`,
        dayNum: prevDayNum,
        isCurrentMonth: false,
        fullDateObj: prevMonthObj,
      });
    }

    // Preenche dias do mês corrente
    for (let i = 1; i <= totalDays; i++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      days.push({
        date: `${year}-${mStr}-${dStr}`,
        dayNum: i,
        isCurrentMonth: true,
        fullDateObj: new Date(year, month, i),
      });
    }

    // Preenche dias do próximo mês para completar 42 células (6 linhas de 7 dias)
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextMonthObj = new Date(year, month + 1, i);
      const yStr = nextMonthObj.getFullYear();
      const mStr = String(nextMonthObj.getMonth() + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      days.push({
        date: `${yStr}-${mStr}-${dStr}`,
        dayNum: i,
        isCurrentMonth: false,
        fullDateObj: nextMonthObj,
      });
    }

    return days;
  }, [year, month]);

  // Agrupa tarefas pelas datas de entrega/dueDate
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (task.dueDate) {
        if (!map[task.dueDate]) {
          map[task.dueDate] = [];
        }
        map[task.dueDate].push(task);
      }
    }
    return map;
  }, [tasks]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getPriorityDotColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'Alta': return 'bg-rose-500';
      case 'Média': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  const getTaskStatusStyle = (status: string) => {
    switch (status) {
      case 'done':
        return 'line-through text-slate-400 bg-slate-50/50 border-slate-100';
      case 'inprogress':
        return 'text-sky-700 bg-sky-50 border-sky-100 hover:bg-sky-100/80';
      case 'inreview':
        return 'text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100/80';
      default:
        return 'text-slate-800 bg-slate-50 border-slate-200 hover:bg-slate-100/50';
    }
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const target = new Date(dateStr + 'T12:00:00'); // evita fusos horarios
    return today.getFullYear() === target.getFullYear() &&
           today.getMonth() === target.getMonth() &&
           today.getDate() === target.getDate();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50/10 overflow-hidden" id="calendar-view">
      {/* Calendar Header Control Toolbar */}
      <div className="px-8 py-4.5 bg-white border-b border-slate-105 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-650" />
          <h2 className="text-sm font-bold font-sans text-slate-900 tracking-tight">
            {monthNames[month]} {year}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 border border-slate-200 hover:border-slate-800 bg-white rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            id="btn-calendar-today"
          >
            Hoje
          </button>
          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-50 text-slate-600 border-r border-slate-200 cursor-pointer"
              title="Mês Anterior"
              id="btn-calendar-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Próximo Mês"
              id="btn-calendar-next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekdays Headers */}
      <div className="grid grid-cols-7 border-b border-slate-150 bg-slate-50/50 select-none text-center py-2.5">
        {weekdayNames.map((day) => (
          <span key={day} className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
            {day}
          </span>
        ))}
      </div>

      {/* Monthly Grid */}
      <div className="flex-1 grid grid-cols-7 bg-slate-100 gap-[1px]" id="calendar-grid">
        {calendarDays.map((day) => {
          const dayTasks = tasksByDate[day.date] || [];
          const currentDayIsToday = isToday(day.date);

          return (
            <div
              key={day.date}
              className={`min-h-[105px] bg-white flex flex-col p-2.5 group transition-all relative ${
                day.isCurrentMonth ? 'text-slate-900' : 'text-slate-300 bg-slate-50/30'
              }`}
              id={`calendar-cell-${day.date}`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between select-none mb-1">
                <span className={`text-[11px] font-bold font-mono py-0.5 px-2 rounded-full ${
                  currentDayIsToday 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : day.isCurrentMonth ? 'text-slate-800' : 'text-slate-300'
                }`}>
                  {day.dayNum}
                </span>

                {/* Instant Create Button inside day on hover */}
                <button
                  onClick={() => onAddTaskClick(undefined, day.date)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-105 rounded text-slate-600 transition-opacity cursor-pointer"
                  title="Criar tarefa para este dia"
                  id={`btn-add-date-${day.date}`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Day's Tasks list */}
              <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[85px] scrollbar-none">
                {dayTasks.map((task) => {
                  const project = projects.find(p => p.id === task.projectId);
                  const projectDotColor = project ? (
                    project.color === 'indigo' ? 'bg-indigo-500' :
                    project.color === 'emerald' ? 'bg-emerald-500' :
                    project.color === 'sky' ? 'bg-sky-500' :
                    project.color === 'amber' ? 'bg-amber-500' :
                    project.color === 'rose' ? 'bg-rose-500' : 'bg-slate-500'
                  ) : '';

                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`px-2 py-1 text-[11px] rounded border font-semibold transition-all cursor-pointer flex flex-col truncate ${getTaskStatusStyle(task.status)}`}
                      id={`calendar-task-${task.id}`}
                      title={`${task.title} (${task.priority})${project ? ` - Projeto: ${project.name}` : ''}`}
                    >
                      <div className="flex items-center gap-1.5 truncate justify-between w-full">
                        <div className="flex items-center gap-1.5 truncate flex-1">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getPriorityDotColor(task.priority)}`} />
                          <span className="truncate">{task.title}</span>
                        </div>
                        {project && (
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${projectDotColor}`} title={`Projeto: ${project.name}`} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
