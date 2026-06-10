/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, Shield, Calendar, Key, Mail, User as UserIcon, X, Check, ShieldAlert } from 'lucide-react';
import { User } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface UsersViewProps {
  currentUser: User;
}

export default function UsersView({ currentUser }: UsersViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'membro'>('membro');
  const [formPassword, setFormPassword] = useState('');

  // Delete State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        throw new Error('Erro ao listar usuários do sistema.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('membro');
    setFormPassword('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormPassword(''); // Empty by default for editing
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formRole) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!editingUser && !formPassword) {
      setErrorMessage('A senha é obrigatória para criar um novo usuário.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const isEdit = !!editingUser;
      const url = isEdit ? `/api/users/${editingUser.id}` : '/api/users';
      const method = isEdit ? 'PUT' : 'POST';

      const bodyData: any = {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
      };

      if (formPassword) {
        bodyData.password = formPassword;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar alterações.');
      }

      setSuccessMessage(isEdit ? 'Usuário modificado com sucesso!' : 'Novo usuário cadastrado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro de rede ou permissão.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    // Impede o usuário de deletar a si mesmo
    if (deletingUser.id === currentUser.id) {
      alert('Você não pode excluir sua própria conta conectada.');
      setDeletingUser(null);
      return;
    }

    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Falha ao deletar o usuário do banco de dados.');
      }

      setSuccessMessage(`Conta de "${deletingUser.name}" removida com sucesso.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Erro inesperado.');
    } finally {
      setDeletingUser(null);
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const terms = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(terms) ||
      u.email.toLowerCase().includes(terms) ||
      u.role.toLowerCase().includes(terms)
    );
  });

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 select-none" id="users-view-root">
      {/* Messages toast/alert banner */}
      {successMessage && (
        <div className="mb-5 bg-emerald-50 border border-emerald-150 rounded-xl p-4 flex items-center justify-between text-emerald-700 font-semibold text-xs animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Screen Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200/50">
        <div>
          <h2 className="text-sm font-sub font-black text-slate-800 uppercase tracking-widest font-sans flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-700" />
            Cadastro de Integrantes & Equipe
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium max-w-[500px]">
            {isAdmin 
              ? 'Gerencie os usuários autorizados a acessar seu Kanban. Defina funções de Administrador ou Membro.'
              : 'Lista de integrantes da equipe cadastrados no sistema em modo visualização.'
            }
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm active:ring-1 active:ring-slate-900"
            id="btn-add-user"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Novo Integrante
          </button>
        )}
      </div>

      {/* Team info banner for non-admin */}
      {!isAdmin && (
        <div className="mb-6 bg-slate-100 border border-slate-200/60 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600 font-medium">
          <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-700 block mb-0.5">Permissões Restritas</span>
            <span>Como <strong>membro</strong>, você dispõe apenas de leitura do diretório. Apenas administradores do sistema podem criar, modificar e deletar usuários.</span>
          </div>
        </div>
      )}

      {/* Filter and stats row */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, e-mail ou cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 transition-all font-sans"
            id="search-users-input"
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold tracking-wider font-sans uppercase shrink-0">
          💼 Total da Equipe: <span className="text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-extrabold">{filteredUsers.length} de {users.length}</span>
        </div>
      </div>

      {/* Grid View of Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="users-cards-grid">
        {filteredUsers.map((user) => {
          const initials = user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
          const isUserAdmin = user.role === 'admin';
          const isLoggedUser = user.id === currentUser.id;

          return (
            <div
              key={user.id}
              className={`bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md relative ${isLoggedUser ? 'ring-1 ring-slate-800' : ''}`}
            >
              {isLoggedUser && (
                <span className="absolute top-4 right-4 bg-slate-900 border border-slate-900 text-white font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-xs">
                  Você
                </span>
              )}

              <div className="flex items-start gap-4">
                {/* Initials avatar badge */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none border shadow-xs ${
                  isUserAdmin 
                    ? 'bg-indigo-50/80 text-indigo-700 border-indigo-150' 
                    : 'bg-emerald-50/80 text-emerald-700 border-emerald-150'
                }`}>
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-slate-800 truncate" title={user.name}>
                    {user.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5 truncate" title={user.email}>
                    <Mail className="w-3 h-3 shrink-0" />
                    {user.email}
                  </p>

                  <div className="flex items-center gap-2 mt-3.5 flex-wrap">
                    <span className={`text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-md border ${
                      isUserAdmin 
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-150' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-150'
                    }`}>
                      {user.role}
                    </span>

                    {user.createdAt && (
                      <span className="text-[9.5px] text-slate-450 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons footer for admins */}
              {isAdmin && (
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="p-1.5 hover:bg-slate-55 border border-transparent hover:border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Editar informações do integrante"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeletingUser(user)}
                    disabled={isLoggedUser}
                    className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-150 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                    title={isLoggedUser ? 'Não é possível remover sua própria conta logada' : 'Deletar integrante e remover acesso'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center font-sans">
            <UserIcon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-650">Nenhum integrante encontrado</p>
            <p className="text-[11px] text-slate-400 mt-1">Experimente alterar os filtros de pesquisa atuais.</p>
          </div>
        )}
      </div>

      {/* Details/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none" id="user-details-modal">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                {editingUser ? `Editar Integrante: ${editingUser.name}` : 'Cadastrar Novo Integrante'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-450 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="px-6 pt-4">
                <div className="bg-rose-50 border border-rose-150 rounded-xl p-3 text-[11px] text-rose-600 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Oliveira"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-xs text-slate-805 font-semibold font-sans"
                    id="user-form-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                  Endereço de E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Ex: carlos@empresa.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-xs text-slate-805 font-semibold font-sans"
                    id="user-form-email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                  Função / Permissão no Sistema
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-xs text-slate-805 font-bold cursor-pointer font-sans"
                    id="user-form-role"
                  >
                    <option value="membro">Membro (Visualização + Tarefas)</option>
                    <option value="admin">Administrador (Acesso Total)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                  Senha {editingUser ? '(deixe em branco se não deseja alterar)' : ''}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder={editingUser ? '••••••••' : 'Defina uma senha de acesso'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-xs text-slate-805 font-semibold font-sans"
                    id="user-form-password"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-150 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  id="user-form-submit"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <ConfirmDialog
          isOpen={!!deletingUser}
          title="Tem certeza que deseja excluir o integrante?"
          message={`Esta ação é irreversível e removerá permanentemente a conta de "${deletingUser.name}" (${deletingUser.email}). Ele não poderá mais acessar este painel Kanban.`}
          confirmText="Sim, remover integrante"
          cancelText="Pensei melhor, cancelar"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingUser(null)}
          isDanger={true}
        />
      )}
    </div>
  );
}
