/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Column {
  id: string;
  name: string;
  position: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string; // Tailwind color class or hex, e.g. 'indigo', 'emerald', 'amber', 'rose'
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string; // matches column id
  priority: 'Baixa' | 'Média' | 'Alta';
  startDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  assignee?: string;
  position: number;
  createdAt?: string;
  projectId?: string; // optional association
}

export interface ActivityLog {
  id: string;
  taskId?: string;
  taskTitle?: string;
  action: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'membro';
  password?: string;
  createdAt?: string;
}

export interface DBConfigStatus {
  usingMySQL: boolean;
  host?: string;
  database?: string;
  connected: boolean;
  error?: string;
}
