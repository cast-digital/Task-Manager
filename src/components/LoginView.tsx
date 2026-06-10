/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Shield, LogIn, ChevronRight } from 'lucide-react';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar login.');
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4 select-none" id="login-layout-container">
      {/* Decorative grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none" />
      
      {/* Visual glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-150 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-150 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse pointer-events-none" />

      <div className="w-full max-w-[440px] z-10" id="login-form-box">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-slate-900 text-white mb-4 shadow-md shadow-slate-950/10">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800 font-sans">
            Kanban Colaborativo
          </h1>
          <p className="text-xs text-slate-450 mt-1.5 font-medium">
            Acesse o painel para gerenciar seus projetos e tarefas
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl shadow-slate-200/60">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 font-sans">
            Acessar Conta
          </h2>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-150 rounded-xl p-3.5 mb-5 flex items-start gap-2 text-[11px] text-rose-600 font-semibold leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                Endereço de E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="exemplo@dominio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all font-sans"
                  id="input-login-email"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans flex justify-between items-center">
                <span>Senha de Acesso</span>
                <span className="text-[9px] lowercase font-semibold text-slate-450 hover:text-slate-600 cursor-pointer">Esqueceu?</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all font-sans"
                  id="input-login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-55 cursor-pointer mt-6"
              id="btn-login-submit"
            >
              {isLoading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <LogIn className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Credentials hints panel */}
        <div className="mt-6 bg-slate-100/60 border border-slate-200/50 rounded-xl p-4 text-slate-500 text-[10px]">
          <p className="font-bold text-slate-700 uppercase tracking-wider mb-2 font-sans flex items-center gap-1">
            💡 Contas de Teste Integradas:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/40">
              <span className="block font-bold text-slate-600">Administrador:</span>
              <span className="text-[9.5px] text-slate-500 font-mono select-all select-text block mt-0.5">admin@example.com</span>
              <span className="text-[9.5px] text-slate-450 font-mono block">senha: admin123</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/40">
              <span className="block font-bold text-slate-600">Membro Comum:</span>
              <span className="text-[9.5px] text-slate-500 font-mono select-all select-text block mt-0.5">member@example.com</span>
              <span className="text-[9.5px] text-slate-450 font-mono block">senha: member123</span>
            </div>
          </div>
        </div>

        <p className="text-center text-[9.5px] text-slate-400 mt-8 font-medium">
          Kanban Hostinger Pro &copy; 2026. Feito com rigor estético.
        </p>
      </div>
    </div>
  );
}
