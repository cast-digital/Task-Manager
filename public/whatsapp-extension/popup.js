/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

document.addEventListener('DOMContentLoaded', function () {
  const apiUrlInput = document.getElementById('apiUrl');
  const prioritySelect = document.getElementById('priority');
  const btnSave = document.getElementById('btnSave');
  const btnTest = document.getElementById('btnTest');
  const statusBadge = document.getElementById('statusBadge');

  // Carrega as configurações anteriormente armazenadas localmente na extensão
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['apiUrl', 'priority'], function (result) {
      if (result.apiUrl) {
        apiUrlInput.value = result.apiUrl;
      }
      if (result.priority) {
        prioritySelect.value = result.priority;
      }
    });
  }

  // Testa conectividade com a API da Hospedagem do usuário
  btnTest.addEventListener('click', function () {
    const rawUrl = apiUrlInput.value.trim();
    if (!rawUrl) {
      showStatus('Por favor, preencha o campo do endereço do Kanban primeiro.', false);
      return;
    }

    const cleanUrl = rawUrl.replace(/\/+$/, '');
    statusBadge.style.display = 'block';
    statusBadge.className = 'status-badge';
    statusBadge.innerText = 'Testando resposta do servidor...';

    fetch(`${cleanUrl}/api/db-status`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        showStatus('Perfeito! Comunicação estabelecida com o seu Kanban.', true);
      })
      .catch(err => {
        console.error(err);
        showStatus(`Falhou: ${err.message}. Verifique se a URL está correta e suporta conexão https clara.`, false);
      });
  });

  // Salva no storage local do navegador
  btnSave.addEventListener('click', function () {
    const url = apiUrlInput.value.trim().replace(/\/+$/, '');
    const priority = prioritySelect.value;

    if (!url) {
      showStatus('Preencha a URL antes de salvar.', false);
      return;
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ apiUrl: url, priority: priority }, function () {
        showStatus('Configurações gravadas! Recarregue a página do WhatsApp Web.', true);
      });
    } else {
      // Fallback para desenvolvimento fora de ambiente de extensão empacotada
      showStatus('Modo Simulação local: Configurações gravadas com êxito.', true);
    }
  });

  function showStatus(message, isSuccess) {
    statusBadge.style.display = 'block';
    statusBadge.className = `status-badge ${isSuccess ? 'status-success' : 'status-error'}`;
    statusBadge.innerText = message;
  }
});
