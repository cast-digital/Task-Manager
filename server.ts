/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Column, Task, ActivityLog, Project, User } from './src/types.js';

// Carrega variáveis do arquivo .env
dotenv.config();

const app = express();
const PORT = 3000;

// Configuração manual de cabeçalhos de CORS para permitir requisições seguras da extensão (WhatsApp Web)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// Diretorios de arquivos locais para fallback JSON
const DATA_DIR = path.join(process.cwd(), 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const COLUMNS_FILE = path.join(DATA_DIR, 'columns.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Garante que o diretorio de dados existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Inicializa arquivos locais padrão se não existirem
const DEFAULT_COLUMNS: Column[] = [
  { id: 'todo', name: 'A Fazer', position: 0 },
  { id: 'inprogress', name: 'Em Andamento', position: 1 },
  { id: 'inreview', name: 'Em Revisão', position: 2 },
  { id: 'done', name: 'Concluído', position: 3 }
];

const DEFAULT_PROJECTS: Project[] = [
  { id: 'proj-1', name: 'Projeto Alpha', description: 'Banco de dados e Dashboard principal', color: 'indigo', createdAt: new Date().toISOString() },
  { id: 'proj-2', name: 'Internal QA', description: 'Atividades de testes internos', color: 'emerald', createdAt: new Date().toISOString() }
];

const DEFAULT_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Modelagem do Banco de Dados MySQL',
    description: 'Criar scripts de tabelas para kanban, tarefas e logs para hospedar na Hostinger.',
    status: 'inprogress',
    priority: 'Alta',
    startDate: '2026-06-09',
    dueDate: '2026-06-12',
    assignee: 'Carlos Silva',
    position: 0,
    projectId: 'proj-1'
  },
  {
    id: 'task-2',
    title: 'Design UI Minimalista',
    description: 'Estilizar painel sóbrio com Tailwind CSS e Lucide-react.',
    status: 'todo',
    priority: 'Média',
    startDate: '2026-06-09',
    dueDate: '2026-06-10',
    assignee: 'Carlos Silva',
    position: 0,
    projectId: 'proj-1'
  },
  {
    id: 'task-3',
    title: 'Integração de Agenda/Visualização Mensal',
    description: 'Dessenhar calendário interativo para gerenciar cronograma de tarefas.',
    status: 'todo',
    priority: 'Média',
    startDate: '2026-06-13',
    dueDate: '2026-06-15',
    assignee: 'Mariana Costa',
    position: 1,
    projectId: 'proj-2'
  }
];

const DEFAULT_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    taskId: 'task-1',
    taskTitle: 'Modelagem do Banco de Dados',
    action: 'Iniciou a tarefa "Modelagem do Banco de Dados MySQL"',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_USERS: User[] = [
  { id: 'user-1', name: 'Administrador', email: 'admin@example.com', role: 'admin', password: 'admin123', createdAt: new Date().toISOString() },
  { id: 'user-2', name: 'Carlos Silva', email: 'member@example.com', role: 'membro', password: 'member123', createdAt: new Date().toISOString() },
  { id: 'user-3', name: 'Mariana Costa', email: 'mariana@example.com', role: 'membro', password: 'password123', createdAt: new Date().toISOString() }
];

function initLocalFiles() {
  if (!fs.existsSync(COLUMNS_FILE)) {
    fs.writeFileSync(COLUMNS_FILE, JSON.stringify(DEFAULT_COLUMNS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(DEFAULT_PROJECTS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(DEFAULT_TASKS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(DEFAULT_LOGS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), 'utf-8');
  }
}

// Configuração do Pool MySQL (Prevenido para falhar silenciosamente com fallback)
let dbPool: any = null;
let usingMySQL = false;
let dbErrorStr: string | null = null;

if (process.env.DB_HOST) {
  try {
    dbPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASS || process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000 // 5 segundos para fail-fast
    });
  } catch (err: any) {
    dbErrorStr = err.message || String(err);
    console.error('Erro na criação do pool MySQL:', dbErrorStr);
  }
}

async function startDatabase() {
  initLocalFiles();
  
  if (!dbPool) {
    console.log('Ambiente sem configuração MySQL completa. Modo LOCAL ativado.');
    return;
  }

  try {
    // Tenta uma conexão inicial rápida
    const conn = await dbPool.getConnection();
    console.log('Conectado ao MySQL com sucesso!');
    conn.release();
    usingMySQL = true;

    // Criação das tabelas no MySQL se não existirem
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS \`columns\` (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        position INT DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS \`tasks\` (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        priority VARCHAR(20) NOT NULL,
        startDate VARCHAR(10),
        dueDate VARCHAR(10),
        assignee VARCHAR(255),
        position INT DEFAULT 0,
        createdAt VARCHAR(30)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Adiciona campo projectId se não existir
    try {
      const [colsInfo]: any = await dbPool.query('SHOW COLUMNS FROM `tasks` LIKE "projectId"');
      if (colsInfo.length === 0) {
        await dbPool.query('ALTER TABLE `tasks` ADD COLUMN projectId VARCHAR(36) NULL');
      }
    } catch (err) {
      console.error('Erro ao adicionar coluna projectId à tabela tasks:', err);
    }

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS \`projects\` (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(50),
        createdAt VARCHAR(30)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS \`activity_logs\` (
        id VARCHAR(36) PRIMARY KEY,
        taskId VARCHAR(36),
        taskTitle VARCHAR(255),
        action TEXT NOT NULL,
        createdAt VARCHAR(30)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        createdAt VARCHAR(30)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Semeia colunas básicas no MySQL se estiver vazio
    const [existingCols]: any = await dbPool.query('SELECT COUNT(*) as count FROM \`columns\`');
    if (existingCols[0].count === 0) {
      for (const col of DEFAULT_COLUMNS) {
        await dbPool.query('INSERT INTO \`columns\` (id, name, position) VALUES (?, ?, ?)', [col.id, col.name, col.position]);
      }
    }

    // Semeia projetos básicos no MySQL se estiver vazio
    const [existingProjs]: any = await dbPool.query('SELECT COUNT(*) as count FROM \`projects\`');
    if (existingProjs[0].count === 0) {
      for (const proj of DEFAULT_PROJECTS) {
        await dbPool.query(
          'INSERT INTO \`projects\` (id, name, description, color, createdAt) VALUES (?, ?, ?, ?, ?)',
          [proj.id, proj.name, proj.description || '', proj.color || 'indigo', proj.createdAt]
        );
      }
    }

    // Semeia usuários básicos no MySQL se estiver vazio
    const [existingUsers]: any = await dbPool.query('SELECT COUNT(*) as count FROM \`users\`');
    if (existingUsers[0].count === 0) {
      for (const u of DEFAULT_USERS) {
        await dbPool.query(
          'INSERT INTO \`users\` (id, name, email, role, password, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
          [u.id, u.name, u.email, u.role, u.password || 'password123', u.createdAt || new Date().toISOString()]
        );
      }
    }

    // Semeia tarefas básicas no MySQL se estiver vazio
    const [existingTasks]: any = await dbPool.query('SELECT COUNT(*) as count FROM \`tasks\`');
    if (existingTasks[0].count === 0) {
      for (const task of DEFAULT_TASKS) {
        await dbPool.query(
          'INSERT INTO \`tasks\` (id, title, description, status, priority, startDate, dueDate, assignee, position, createdAt, projectId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [task.id, task.title, task.description, task.status, task.priority, task.startDate || null, task.dueDate || null, task.assignee || null, task.position, new Date().toISOString(), task.projectId || null]
        );
      }
    }
  } catch (err: any) {
    dbErrorStr = err.message || String(err);
    console.error('Falha de conexão ou inicialização de tabelas no MySQL. Ativando fallback LOCAL (JSON). Erro:', dbErrorStr);
    usingMySQL = false;
  }
}

// ============================================
// HELPER METHODS PARA OPERAÇÕES DE DADOS (MYSQL / JSON fallback)
// ============================================

async function getColumns(): Promise<Column[]> {
  if (usingMySQL) {
    try {
      const [rows]: any = await dbPool.query('SELECT * FROM \`columns\` ORDER BY position ASC');
      return rows;
    } catch (e) {
      console.error('MySQL Error Column Fetch, falling back to local JSON', e);
    }
  }
  const data = fs.readFileSync(COLUMNS_FILE, 'utf-8');
  return JSON.parse(data);
}

async function saveColumns(columns: Column[]) {
  if (usingMySQL) {
    try {
      // Limpa antigas e insere novas
      await dbPool.query('DELETE FROM \`columns\`');
      for (const col of columns) {
        await dbPool.query('INSERT INTO \`columns\` (id, name, position) VALUES (?, ?, ?)', [col.id, col.name, col.position]);
      }
      return;
    } catch (e) {
      console.error('MySQL Error Column Save', e);
    }
  }
  fs.writeFileSync(COLUMNS_FILE, JSON.stringify(columns, null, 2), 'utf-8');
}

async function getTasks(): Promise<Task[]> {
  if (usingMySQL) {
    try {
      const [rows]: any = await dbPool.query('SELECT * FROM \`tasks\` ORDER BY position ASC');
      // Converte snake_case do MySQL se necessário, ou formata strings de datas
      return rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description || '',
        status: r.status,
        priority: r.priority,
        startDate: r.startDate || undefined,
        dueDate: r.dueDate || undefined,
        assignee: r.assignee || undefined,
        position: r.position,
        createdAt: r.createdAt,
        projectId: r.projectId || undefined
      }));
    } catch (e) {
      console.error('MySQL Error Task Fetch, falling back to local JSON', e);
    }
  }
  const data = fs.readFileSync(TASKS_FILE, 'utf-8');
  return JSON.parse(data);
}

async function saveTasks(tasks: Task[]) {
  if (usingMySQL) {
    try {
      // Limpa e reinsere
      await dbPool.query('DELETE FROM \`tasks\`');
      for (const t of tasks) {
        await dbPool.query(
          'INSERT INTO \`tasks\` (id, title, description, status, priority, startDate, dueDate, assignee, position, createdAt, projectId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [t.id, t.title, t.description || '', t.status, t.priority, t.startDate || null, t.dueDate || null, t.assignee || null, t.position, t.createdAt || new Date().toISOString(), t.projectId || null]
        );
      }
      return;
    } catch (e) {
      console.error('MySQL Error Task Bulk Save', e);
    }
  }
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

async function getProjects(): Promise<Project[]> {
  if (usingMySQL) {
    try {
      const [rows]: any = await dbPool.query('SELECT * FROM \`projects\` ORDER BY createdAt ASC');
      return rows;
    } catch (e) {
      console.error('MySQL Error Projects Fetch, falling back to local JSON', e);
    }
  }
  const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
  return JSON.parse(data);
}

async function saveProjects(projects: Project[]) {
  if (usingMySQL) {
    try {
      await dbPool.query('DELETE FROM \`projects\`');
      for (const p of projects) {
        await dbPool.query(
          'INSERT INTO \`projects\` (id, name, description, color, createdAt) VALUES (?, ?, ?, ?, ?)',
          [p.id, p.name, p.description || '', p.color || 'indigo', p.createdAt || new Date().toISOString()]
        );
      }
      return;
    } catch (e) {
      console.error('MySQL Error Projects Save', e);
    }
  }
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
}

async function getUsers(): Promise<User[]> {
  if (usingMySQL) {
    try {
      const [rows]: any = await dbPool.query('SELECT * FROM \`users\` ORDER BY createdAt ASC');
      return rows;
    } catch (e) {
      console.error('MySQL Error Users Fetch, falling back to local JSON', e);
    }
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), 'utf-8');
  }
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

async function saveUsers(users: User[]) {
  if (usingMySQL) {
    try {
      await dbPool.query('DELETE FROM \`users\`');
      for (const u of users) {
        await dbPool.query(
          'INSERT INTO \`users\` (id, name, email, role, password, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
          [u.id, u.name, u.email, u.role, u.password || 'password123', u.createdAt || new Date().toISOString()]
        );
      }
      return;
    } catch (e) {
      console.error('MySQL Error Users Save', e);
    }
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

async function getLogs(): Promise<ActivityLog[]> {
  if (usingMySQL) {
    try {
      const [rows]: any = await dbPool.query('SELECT * FROM \`activity_logs\` ORDER BY createdAt DESC LIMIT 80');
      return rows;
    } catch (e) {
      console.error('MySQL Error Logs Fetch', e);
    }
  }
  const data = fs.readFileSync(LOGS_FILE, 'utf-8');
  return JSON.parse(data);
}

async function addLog(log: Omit<ActivityLog, 'id' | 'createdAt'>) {
  const newLog: ActivityLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    taskId: log.taskId,
    taskTitle: log.taskTitle,
    action: log.action,
    createdAt: new Date().toISOString()
  };

  if (usingMySQL) {
    try {
      await dbPool.query(
        'INSERT INTO \`activity_logs\` (id, taskId, taskTitle, action, createdAt) VALUES (?, ?, ?, ?, ?)',
        [newLog.id, newLog.taskId || null, newLog.taskTitle || null, newLog.action, newLog.createdAt]
      );
      return;
    } catch (e) {
      console.error('MySQL Error Logs Add', e);
    }
  }

  const logs = await getLogs();
  logs.unshift(newLog); // mais recente primeiro
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs.slice(0, 100), null, 2), 'utf-8'); // guarda ultimos 100 logs
}

// ============================================
// API ENDPOINTS
// ============================================

// Auth & User Management Endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }
    const users = await getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsers();
    const safeUsers = users.map(({ password: _, ...user }) => user);
    res.json(safeUsers);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'Nome, E-mail, Função e Senha são obrigatórios.' });
    }
    const users = await getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Este e-mail já está sendo utilizado por outro usuário.' });
    }
    
    const newId = 'user-' + Date.now();
    const newUser: User = {
      id: newId,
      name,
      email: email.toLowerCase(),
      role,
      password,
      createdAt: new Date().toISOString()
    };

    if (usingMySQL) {
      await dbPool.query(
        'INSERT INTO `users` (id, name, email, role, password, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [newUser.id, newUser.name, newUser.email, newUser.role, newUser.password, newUser.createdAt]
      );
    } else {
      users.push(newUser);
      await saveUsers(users);
    }

    await addLog({
      action: `Cadastrou o usuário "${name}" (${role})`
    });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;
    
    const users = await getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (email && email.toLowerCase() !== users[index].email.toLowerCase()) {
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ error: 'Este e-mail já está em uso.' });
      }
    }

    const updatedUser = {
      ...users[index],
      name: name !== undefined ? name : users[index].name,
      email: email !== undefined ? email.toLowerCase() : users[index].email,
      role: role !== undefined ? role : users[index].role,
      password: password ? password : users[index].password
    };

    if (usingMySQL) {
      await dbPool.query(
        'UPDATE `users` SET name = ?, email = ?, role = ?, password = ? WHERE id = ?',
        [updatedUser.name, updatedUser.email, updatedUser.role, updatedUser.password, id]
      );
    } else {
      users[index] = updatedUser;
      await saveUsers(users);
    }

    await addLog({
      action: `Atualizou o cadastro do usuário "${updatedUser.name}"`
    });

    const { password: _, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const users = await getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const userName = users[index].name;

    if (usingMySQL) {
      await dbPool.query('DELETE FROM `users` WHERE id = ?', [id]);
    } else {
      const filtered = users.filter(u => u.id !== id);
      await saveUsers(filtered);
    }

    await addLog({
      action: `Excluiu o usuário "${userName}"`
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Status do Banco de Dados
app.get('/api/db-status', (req, res) => {
  res.json({
    usingMySQL,
    host: process.env.DB_HOST || 'Não Declarado',
    database: process.env.DB_NAME || 'Não Declarado',
    connected: usingMySQL,
    error: dbErrorStr
  });
});

// Kanban Columns
app.get('/api/columns', async (req, res) => {
  try {
    const cols = await getColumns();
    res.json(cols);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/columns', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'O nome da coluna é obrigatório' });
    }
    const cols = await getColumns();
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
    const newCol: Column = {
      id,
      name,
      position: cols.length
    };
    cols.push(newCol);
    await saveColumns(cols);
    res.status(201).json(newCol);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/columns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cols = await getColumns();
    const tasks = await getTasks();

    // Impede deletar colunas se houver tarefas nelas, ou lida movendo-as
    const colsFiltered = cols.filter(c => c.id !== id);
    if (colsFiltered.length === cols.length) {
      return res.status(404).json({ error: 'Coluna não encontrada.' });
    }

    // Se houver tarefas nessa coluna, coloca-as na primeira coluna restante
    if (colsFiltered.length > 0) {
      const fallbackColId = colsFiltered[0].id;
      let movedCount = 0;
      const updatedTasks = tasks.map(t => {
        if (t.status === id) {
          movedCount++;
          return { ...t, status: fallbackColId };
        }
        return t;
      });
      if (movedCount > 0) {
        await saveTasks(updatedTasks);
        await addLog({
          action: `Deletou coluna "${id}". Moveu ${movedCount} tarefa(s) para "${colsFiltered[0].name}"`
        });
      }
    } else {
      // Sem colunas restantes, não deixa apagar
      return res.status(400).json({ error: 'Não é possível deletar a única coluna existente.' });
    }

    await saveColumns(colsFiltered);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Projects API routes
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await getProjects();
    res.json(projects);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome do projeto é obrigatório.' });
    }
    const projects = await getProjects();
    const newId = 'proj-' + Date.now();
    const newProject: Project = {
      id: newId,
      name,
      description: description || '',
      color: color || 'indigo',
      createdAt: new Date().toISOString()
    };
    
    if (usingMySQL) {
      await dbPool.query(
        'INSERT INTO `projects` (id, name, description, color, createdAt) VALUES (?, ?, ?, ?, ?)',
        [newProject.id, newProject.name, newProject.description, newProject.color, newProject.createdAt]
      );
    } else {
      projects.push(newProject);
      await saveProjects(projects);
    }
    
    await addLog({
      action: `Criou o projeto "${name}"`
    });
    
    res.status(201).json(newProject);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    
    const projects = await getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    
    const updated = {
      ...projects[index],
      name: name !== undefined ? name : projects[index].name,
      description: description !== undefined ? description : projects[index].description,
      color: color !== undefined ? color : projects[index].color
    };
    
    if (usingMySQL) {
      await dbPool.query(
        'UPDATE `projects` SET name = ?, description = ?, color = ? WHERE id = ?',
        [updated.name, updated.description, updated.color, id]
      );
    } else {
      projects[index] = updated;
      await saveProjects(projects);
    }
    
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projects = await getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    
    const name = projects[index].name;
    
    if (usingMySQL) {
      await dbPool.query('DELETE FROM `projects` WHERE id = ?', [id]);
      // Also reset any associated tasks to null or unassigned
      await dbPool.query('UPDATE `tasks` SET projectId = NULL WHERE projectId = ?', [id]);
    } else {
      const filtered = projects.filter(p => p.id !== id);
      await saveProjects(filtered);
      
      const tasks = await getTasks();
      const updatedTasks = tasks.map(t => t.projectId === id ? { ...t, projectId: undefined } : t);
      await saveTasks(updatedTasks);
    }
    
    await addLog({
      action: `Excluiu o projeto "${name}"`
    });
    
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await getTasks();
    res.json(tasks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, status, priority, startDate, dueDate, assignee, projectId } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório.' });
    }

    const newId = 'task-' + Date.now();
    const createdAt = new Date().toISOString();
    let position = 0;

    if (usingMySQL) {
      const [rows]: any = await dbPool.query('SELECT COUNT(*) as count FROM `tasks` WHERE status = ?', [status || 'todo']);
      position = rows[0].count;

      await dbPool.query(
        'INSERT INTO `tasks` (id, title, description, status, priority, startDate, dueDate, assignee, position, createdAt, projectId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, title, description || '', status || 'todo', priority || 'Média', startDate || null, dueDate || null, assignee || null, position, createdAt, projectId || null]
      );
    } else {
      const tasks = await getTasks();
      position = tasks.filter(t => t.status === (status || 'todo')).length;
      const newTask: Task = {
        id: newId,
        title,
        description: description || '',
        status: status || 'todo',
        priority: priority || 'Média',
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        assignee: assignee || undefined,
        position,
        createdAt,
        projectId: projectId || undefined
      };
      tasks.push(newTask);
      await saveTasks(tasks);
    }

    // Registra log
    await addLog({
      taskId: newId,
      taskTitle: title,
      action: `Criou a tarefa "${title}"`
    });

    res.status(201).json({
      id: newId,
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'Média',
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      assignee: assignee || undefined,
      position,
      createdAt,
      projectId: projectId || undefined
    });
  } catch (e: any) {
    console.error('Erro ao cadastrar tarefa:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/integration/whatsapp', async (req, res) => {
  try {
    const { title, text, sender, projectId, priority } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'O texto da mensagem é obrigatório.' });
    }

    const cols = await getColumns();
    const defaultStatus = cols.length > 0 ? cols[0].id : 'todo';

    const cleanTitle = title || (text.slice(0, 50) + (text.length > 50 ? '...' : ''));
    const sourceDescription = text;
    const taskAssignee = sender ? sender.slice(0, 50) : 'WhatsApp Web';

    const newId = 'task-' + Date.now();
    const createdAt = new Date().toISOString();
    let position = 0;

    if (usingMySQL) {
      const [rows]: any = await dbPool.query('SELECT COUNT(*) as count FROM `tasks` WHERE status = ?', [defaultStatus]);
      position = rows[0].count;

      await dbPool.query(
        'INSERT INTO `tasks` (id, title, description, status, priority, startDate, dueDate, assignee, position, createdAt, projectId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          newId, 
          cleanTitle, 
          sourceDescription, 
          defaultStatus, 
          priority || 'Média', 
          null, 
          null, 
          taskAssignee, 
          position, 
          createdAt, 
          projectId || null
        ]
      );
    } else {
      const tasks = await getTasks();
      position = tasks.filter(t => t.status === defaultStatus).length;
      const newTask: Task = {
        id: newId,
        title: cleanTitle,
        description: sourceDescription,
        status: defaultStatus,
        priority: priority || 'Média',
        assignee: taskAssignee,
        position,
        createdAt,
        projectId: projectId || undefined
      };
      tasks.push(newTask);
      await saveTasks(tasks);
    }

    await addLog({
      taskId: newId,
      taskTitle: cleanTitle,
      action: `Tarefa importada via WhatsApp Web: "${cleanTitle}"`
    });

    res.status(201).json({ success: true, id: newId, title: cleanTitle });
  } catch (e: any) {
    console.error('Erro na integração do WhatsApp:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let oldTask: Task | null = null;
    if (usingMySQL) {
      const [rows]: any = await dbPool.query('SELECT * FROM `tasks` WHERE id = ?', [id]);
      if (rows.length > 0) {
        const r = rows[0];
        oldTask = {
          id: r.id,
          title: r.title,
          description: r.description || '',
          status: r.status,
          priority: r.priority,
          startDate: r.startDate || undefined,
          dueDate: r.dueDate || undefined,
          assignee: r.assignee || undefined,
          position: r.position,
          createdAt: r.createdAt,
          projectId: r.projectId || undefined
        };
      }
    } else {
      const tasks = await getTasks();
      const found = tasks.find(t => t.id === id);
      if (found) {
        oldTask = found;
      }
    }

    if (!oldTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    let logAction = `Atualizou a tarefa "${oldTask.title}"`;

    // Se mudou de coluna
    if (updates.status !== undefined && updates.status !== oldTask.status) {
      const cols = await getColumns();
      const colOrigem = cols.find(c => c.id === oldTask.status)?.name || oldTask.status;
      const colDestino = cols.find(c => c.id === updates.status)?.name || updates.status;
      logAction = `Moveu "${oldTask.title}" de [${colOrigem}] para [${colDestino}]`;
    } else if (updates.title && updates.title !== oldTask.title) {
      logAction = `Renomeou "${oldTask.title}" para "${updates.title}"`;
    }

    const updatedTask = {
      ...oldTask,
      ...updates
    };

    if (usingMySQL) {
      await dbPool.query(
        'UPDATE `tasks` SET title = ?, description = ?, status = ?, priority = ?, startDate = ?, dueDate = ?, assignee = ?, position = ?, projectId = ? WHERE id = ?',
        [
          updatedTask.title,
          updatedTask.description || '',
          updatedTask.status,
          updatedTask.priority,
          updatedTask.startDate || null,
          updatedTask.dueDate || null,
          updatedTask.assignee || null,
          updatedTask.position,
          updatedTask.projectId || null,
          id
        ]
      );
    } else {
      const tasks = await getTasks();
      const taskIndex = tasks.findIndex(t => t.id === id);
      tasks[taskIndex] = updatedTask;
      await saveTasks(tasks);
    }

    await addLog({
      taskId: id,
      taskTitle: updatedTask.title,
      action: logAction
    });

    res.json(updatedTask);
  } catch (e: any) {
    console.error('Erro ao atualizar tarefa:', e);
    res.status(500).json({ error: e.message });
  }
});

// Reordena colunas ou tarefas via drag-and-drop
app.post('/api/tasks/reorder', async (req, res) => {
  try {
    const { tasks: reorderedTasks } = req.body;
    if (!Array.isArray(reorderedTasks)) {
      return res.status(400).json({ error: 'Dados de reordenação inválidos.' });
    }

    if (usingMySQL) {
      for (const t of reorderedTasks) {
        await dbPool.query(
          'UPDATE `tasks` SET status = ?, position = ? WHERE id = ?',
          [t.status, t.position, t.id]
        );
      }
    } else {
      const tasks = await getTasks();
      const reorderedMap = new Map<string, any>(reorderedTasks.map(t => [t.id, t]));
      const finalTasks = tasks.map(t => {
        if (reorderedMap.has(t.id)) {
          return {
            ...t,
            status: reorderedMap.get(t.id)!.status,
            position: reorderedMap.get(t.id)!.position
          };
        }
        return t;
      });
      await saveTasks(finalTasks);
    }

    res.json({ success: true });
  } catch (e: any) {
    console.error('Erro ao reordenar tarefas:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (usingMySQL) {
      // Busca a tarefa para obter o título e registrar o log
      const [rows]: any = await dbPool.query('SELECT title FROM `tasks` WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Tarefa não encontrada.' });
      }
      const title = rows[0].title;

      // Desvincula logs correlacionados (removendo constrangimentos de chave estrangeira)
      await dbPool.query('UPDATE `activity_logs` SET taskId = NULL WHERE taskId = ?', [id]);

      // Deleta a tarefa de forma direta e segura
      await dbPool.query('DELETE FROM `tasks` WHERE id = ?', [id]);

      await addLog({
        action: `Deletou a tarefa "${title}"`
      });

      return res.json({ success: true });
    }

    const tasks = await getTasks();
    const taskToDelete = tasks.find(t => t.id === id);

    if (!taskToDelete) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    const filtered = tasks.filter(t => t.id !== id);
    await saveTasks(filtered);

    await addLog({
      action: `Deletou a tarefa "${taskToDelete.title}"`
    });

    res.json({ success: true });
  } catch (e: any) {
    console.error('Erro ao excluir tarefa:', e);
    res.status(500).json({ error: e.message });
  }
});

// Logs de Atividades
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Serve o applet
async function setupApp() {
  await startDatabase();

  // Vite ou arquivos estáticos
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA Fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Gerenciador de Tarefas] Rodando na porta ${PORT}`);
  });
}

setupApp();
