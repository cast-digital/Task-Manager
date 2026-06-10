/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Server, Terminal, HelpCircle, HardDrive, Check, Copy, AlertTriangle } from 'lucide-react';
import { DBConfigStatus } from '../types';

interface DbStatusWidgetProps {
  dbStatus: DBConfigStatus | null;
}

export default function DbStatusWidget({ dbStatus }: DbStatusWidgetProps) {
  const [copied, setCopied] = useState(false);

  const mysqlSchemaSql = `-- SCRIPT DE CRIAÇÃO DAS TABELAS (MYSQL / HOSPEDAGEM HOSTINGER)
-- Pode ser executado diretamente no painel "phpMyAdmin" da Hostinger.

CREATE TABLE IF NOT EXISTS \`columns\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`position\` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`tasks\` (
  \`id\` VARCHAR(36) PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT,
  \`status\` VARCHAR(50) NOT NULL,
  \`priority\` VARCHAR(20) NOT NULL,
  \`startDate\` VARCHAR(10),
  \`dueDate\` VARCHAR(10),
  \`assignee\` VARCHAR(255),
  \`position\` INT DEFAULT 0,
  \`createdAt\` VARCHAR(30)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`activity_logs\` (
  \`id\` VARCHAR(36) PRIMARY KEY,
  \`taskId\` VARCHAR(36),
  \`taskTitle\` VARCHAR(255),
  \`action\` TEXT NOT NULL,
  \`createdAt\` VARCHAR(30)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mysqlSchemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 p-6 space-y-6" id="db-widget-panel">
      {/* DB Connection Health Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2 font-sans">
          <Server className="w-4 h-4 text-zinc-500" />
          Status Clínico de Conexão (MySQL)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">Motor de Dados Atual</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-sm font-bold text-zinc-800">
                {dbStatus?.connected ? 'MySQL Remoto (Ativo)' : 'Fallback Local JSON'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed pt-1 select-none">
              {dbStatus?.connected 
                ? 'Conexão ativa e integrada diretamente com a base de dados MySQL especificada.' 
                : 'Rodando localmente em arquivos JSON seguros. Perfeito para testes de desenvolvimento rápidos!'
              }
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">Endereço de Host</span>
            <div className="flex items-center gap-1.5 text-zinc-800 font-mono text-sm">
              <Database className="w-3.5 h-3.5 text-zinc-400" />
              <span>{dbStatus?.host || 'localhost'}</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block pt-2">Database</span>
            <span className="text-xs font-mono text-zinc-700">{dbStatus?.database || 'Local data/ files'}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">Compatibilidade Hostinger</span>
            <div className="text-xs text-emerald-600 bg-emerald-50 rounded-lg p-2.5 border border-emerald-100 flex items-start gap-1.5 leading-relaxed">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>100% Homologado!</strong> O servidor compila para <strong>dist/server.cjs</strong>, lendo as variáveis globais perfeitamente na Hostinger.
              </span>
            </div>
          </div>
        </div>

        {dbStatus?.error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs flex items-start gap-2 leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <strong>Diagnóstico de Conexão:</strong> {dbStatus.error}
              <p className="mt-1 text-zinc-500 text-[11px]">
                Isto é normal se as variáveis MySQL não estiverem setadas localmente. O aplicativo continuará funcionando perfeitamente em modo de contingência local.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Guide to deploy on Hostinger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2 font-sans">
            <HelpCircle className="w-4 h-4 text-zinc-500" />
            Como configurar na Hostinger?
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Quando você hospedar esta aplicação no gerenciador de Node.js da <strong>Hostinger</strong>, você deve cadastrar as seguintes <strong>Variáveis de Ambiente</strong> nas configurações do seu site para ativar a sincronia MySQL:
          </p>

          <div className="space-y-2 bg-zinc-50 p-4 rounded-lg border border-zinc-150 font-mono text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-200/50">
              <span className="text-zinc-500">Variável</span>
              <span className="text-zinc-500 font-bold">Valor de Exemplo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-800 font-semibold">DB_HOST</span>
              <span className="text-zinc-650">mysql.hostinger.com.br</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-800 font-semibold">DB_PORT</span>
              <span className="text-zinc-650">3306</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-800 font-semibold">DB_USER</span>
              <span className="text-zinc-650">u123456_admin</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-800 font-semibold">DB_PASS</span>
              <span className="text-zinc-650">SuaSenhaSecretaAqui</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-800 font-semibold">DB_NAME</span>
              <span className="text-zinc-650">u123456_tarefas</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 italic">
            * O servidor detectará estas credenciais, fará o provisionamento automático das tabelas vazias e operará de forma transparente.
          </p>
        </div>

        {/* MySQL script to copy */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2 font-sans">
                <Terminal className="w-4 h-4 text-zinc-500" />
                Script SQL de Criação (MySQL)
              </h4>
              <button
                onClick={copyToClipboard}
                className="text-xs px-2.5 py-1 border border-zinc-200 hover:border-zinc-800 rounded bg-zinc-50 text-zinc-650 hover:text-zinc-900 cursor-pointer flex items-center gap-1 transition-all"
                title="Copiar código SQL"
                id="btn-copy-sql-schema"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copiar SQL
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              O backend é inteligente e criará tudo sozinho. Mas se você preferir criar as tabelas manualmente por questões de permissão, use o script de apoio abaixo:
            </p>
          </div>

          <div className="mt-4 flex-1">
            <textarea
              readOnly
              value={mysqlSchemaSql}
              className="w-full h-44 p-3 bg-zinc-950 text-zinc-300 font-mono text-[10.5px] rounded-lg border border-zinc-800 focus:outline-none resize-none select-all"
              id="mysql-schema-textarea"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
