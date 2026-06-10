/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

(function () {
  console.log('%c[Kanban WhatsApp Integration] Content Script carregado!', 'color: #10b981; font-weight: bold; font-size: 13px;');

  // Injeta estilos CSS customizados para as checkboxes, painel flutuante e modo inspetor
  const styles = `
    .kanban-checkbox-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
      margin-left: 4px;
      vertical-align: middle;
      cursor: pointer;
      user-select: none;
      z-index: 99;
    }
    .kanban-checkbox {
      appearance: none;
      -webkit-appearance: none;
      width: 17px;
      height: 17px;
      border: 2px solid #a0aec0;
      border-radius: 4px;
      outline: none;
      transition: all 0.2s ease;
      cursor: pointer;
      display: inline-block;
      vertical-align: middle;
      background-color: #ffffff;
      position: relative;
    }
    .kanban-checkbox:checked {
      background-color: #075e54;
      border-color: #075e54;
    }
    .kanban-checkbox:checked::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 1px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
    .message-in, .message-out {
      position: relative;
    }
    
    /* Botão flutuante indicador - Sempre visível para abrir o painel manualmente */
    #kanban-indicator-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      background: #075e54;
      color: #ffffff;
      border-radius: 50%;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2), 0 2px 5px rgba(0, 0, 0, 0.1);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      border: 3px solid #ffffff;
    }
    #kanban-indicator-btn:hover {
      background: #128c7e;
      transform: scale(1.08);
    }
    /* Contador de mensagens selecionadas */
    #kanban-indicator-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: bold;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: none;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    /* Painel flutuante de criação */
    #kanban-floating-panel {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 320px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
      display: none;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .kanban-panel-header {
      background: #075e54;
      color: #ffffff;
      padding: 12px 16px;
      font-size: 13px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .kanban-panel-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }
    .kanban-input-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .kanban-input-label {
      font-size: 10px;
      font-weight: 700;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kanban-input {
      padding: 8px 12px;
      font-size: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      outline: none;
      color: #1e293b;
    }
    .kanban-input:focus {
      border-color: #075e54;
    }
    .kanban-textarea {
      min-height: 60px;
      resize: vertical;
    }
    .kanban-select {
      background: white;
      cursor: pointer;
    }
    .kanban-btn-submit {
      background: #075e54;
      color: white;
      border: none;
      padding: 10px 14px;
      font-size: 12px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .kanban-btn-submit:hover {
      background: #128c7e;
    }
    .kanban-btn-inspect {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      transition: all 0.2s;
    }
    .kanban-btn-inspect:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .kanban-btn-inspect.active {
      background: #ef4444;
      color: #ffffff;
      border-color: #ef4444;
    }
    .kanban-btn-cancel {
      background: transparent;
      color: #4a5568;
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      text-align: center;
    }
    .kanban-btn-cancel:hover {
      background: #f7fafc;
    }
    
    /* Modo Inspetor Overlay */
    .kanban-inspect-hover {
      outline: 2px dashed #075e54 !important;
      outline-offset: 2px !important;
      cursor: crosshair !important;
      background-color: rgba(7, 94, 84, 0.08) !important;
    }
    
    /* Notificação Toast */
    .kanban-toast {
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: #1e293b;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      opacity: 0;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .kanban-toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.innerHTML = styles;
  document.head.appendChild(styleEl);

  // Armazena as mensagens atualmente selecionadas
  let selectedMessages = new Set();
  let defaultApiUrl = 'https://lightslategray-mantis-593401.hostingersite.com';
  let inspectModeActive = false;
  let hoveredElement = null;

  // Carrega configurações persistidas do chrome extension storage
  function getSettings(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['apiUrl', 'priority', 'projectId'], function (result) {
        callback({
          apiUrl: result.apiUrl || defaultApiUrl,
          priority: result.priority || 'Média',
          projectId: result.projectId || 'all'
        });
      });
    } else {
      callback({
        apiUrl: defaultApiUrl,
        priority: 'Média',
        projectId: 'all'
      });
    }
  }

  // Cria e posiciona o botão indicador circular
  function createIndicatorButton() {
    if (document.getElementById('kanban-indicator-btn')) return;

    const btn = document.createElement('div');
    btn.id = 'kanban-indicator-btn';
    btn.title = 'Abrir Painel Kanban CastTaskManager';
    btn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <div id="kanban-indicator-badge">0</div>
    `;

    btn.addEventListener('click', function() {
      const panel = document.getElementById('kanban-floating-panel');
      if (panel) {
        if (panel.style.display === 'flex') {
          hidePanel();
        } else {
          showPanel();
        }
      }
    });

    document.body.appendChild(btn);
  }

  // Cria e posiciona o painel flutuante no body
  function createFloatingPanel() {
    if (document.getElementById('kanban-floating-panel')) return;

    const panelEl = document.createElement('div');
    panelEl.id = 'kanban-floating-panel';
    panelEl.innerHTML = `
      <div class="kanban-panel-header">
        <span>Criar Tarefa no Kanban</span>
        <span id="kanban-panel-close" style="cursor:pointer;font-size:16px;">&times;</span>
      </div>
      <div class="kanban-panel-body">
        <button id="kanban-inspect-btn" class="kanban-btn-inspect">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span id="kanban-inspect-btn-text">Selecionar por Clique (Fácil)</span>
        </button>

        <div class="kanban-input-group">
          <label class="kanban-input-label">Título da Tarefa</label>
          <input type="text" id="kanban-task-title" class="kanban-input" placeholder="Ex: Resolver pendência de frete">
        </div>
        <div class="kanban-input-group">
          <label class="kanban-input-label">Conteúdo da Tarefa</label>
          <textarea id="kanban-task-desc" class="kanban-input kanban-textarea" placeholder="Selecione mensagens ou escreva aqui..."></textarea>
        </div>
        <div class="kanban-input-group">
          <label class="kanban-input-label">Remetente</label>
          <input type="text" id="kanban-task-sender" class="kanban-input" placeholder="Ex: Cliente WhatsApp">
        </div>
        <div class="kanban-input-group">
          <label class="kanban-input-label">Prioridade</label>
          <select id="kanban-task-priority" class="kanban-input kanban-select">
            <option value="Baixa">Baixa</option>
            <option value="Média" selected>Média</option>
            <option value="Alta">Alta</option>
          </select>
        </div>
        <button id="kanban-submit-btn" class="kanban-btn-submit">
          <span>Criar Tarefa</span> &rarr;
        </button>
        <button id="kanban-clear-btn" class="kanban-btn-cancel">Cancelar / Limpar</button>
      </div>
    `;

    document.body.appendChild(panelEl);

    // Eventos do painel
    document.getElementById('kanban-panel-close').addEventListener('click', hidePanel);
    document.getElementById('kanban-clear-btn').addEventListener('click', clearSelections);
    document.getElementById('kanban-submit-btn').addEventListener('click', submitTask);
    document.getElementById('kanban-inspect-btn').addEventListener('click', toggleInspectMode);
  }

  // Exibe um toast para avisar o usuário
  function showToast(text, isError = false) {
    let toast = document.getElementById('kanban-toast-notice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'kanban-toast-notice';
      toast.className = 'kanban-toast';
      document.body.appendChild(toast);
    }
    toast.style.borderLeft = isError ? '4px solid #ef4444' : '4px solid #10b981';
    toast.innerHTML = isError ? `❌ ${text}` : `✔️ ${text}`;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  function showPanel() {
    createFloatingPanel();
    const panel = document.getElementById('kanban-floating-panel');
    panel.style.display = 'flex';

    updatePanelForm();
  }

  function updatePanelForm() {
    const sortedMessages = Array.from(selectedMessages);
    const fullText = sortedMessages.map(m => m.text).join('\n---\n');
    const sender = sortedMessages[0]?.sender || 'Cliente WhatsApp';

    const descEl = document.getElementById('kanban-task-desc');
    const senderEl = document.getElementById('kanban-task-sender');
    const titleEl = document.getElementById('kanban-task-title');

    if (descEl) descEl.value = fullText;
    if (senderEl) senderEl.value = sender;

    if (titleEl && !titleEl.value && sortedMessages.length > 0) {
      const shortSnippet = sortedMessages[0]?.text ? sortedMessages[0].text.slice(0, 30) + '...' : 'WhatsApp';
      titleEl.value = `Chamado: ${sender} (${shortSnippet})`;
    }

    // Atualiza o badge de contagem
    const badge = document.getElementById('kanban-indicator-badge');
    if (badge) {
      badge.innerText = sortedMessages.length;
      badge.style.display = sortedMessages.length > 0 ? 'flex' : 'none';
    }
  }

  function hidePanel() {
    const panel = document.getElementById('kanban-floating-panel');
    if (panel) {
      panel.style.display = 'none';
    }
    if (inspectModeActive) {
      disableInspectMode();
    }
  }

  function clearSelections() {
    selectedMessages.clear();
    const checkboxes = document.querySelectorAll('.kanban-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    
    const titleEl = document.getElementById('kanban-task-title');
    if (titleEl) titleEl.value = '';
    
    updatePanelForm();
    hidePanel();
  }

  function submitTask() {
    const titleEl = document.getElementById('kanban-task-title');
    const descEl = document.getElementById('kanban-task-desc');
    const senderEl = document.getElementById('kanban-task-sender');
    const priorityEl = document.getElementById('kanban-task-priority');

    const title = titleEl ? titleEl.value.trim() : '';
    const text = descEl ? descEl.value.trim() : '';
    const sender = senderEl ? senderEl.value.trim() : 'WhatsApp';
    const priority = priorityEl ? priorityEl.value : 'Média';

    if (!title || !text) {
      showToast('Preencha pelo menos o título e conteúdo da tarefa!', true);
      return;
    }

    const submitBtn = document.getElementById('kanban-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Criando tarefa...';

    getSettings(function (settings) {
      const payload = {
        title: title,
        text: text,
        sender: sender,
        priority: priority,
        projectId: settings.projectId !== 'all' ? settings.projectId : null
      };

      fetch(`${settings.apiUrl}/api/integration/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(async response => {
        const isJson = response.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await response.json() : null;

        if (!response.ok) {
          throw new Error(data?.error || `Erro HTTP ${response.status}`);
        }
        return data;
      })
      .then(data => {
        showToast('Tarefa inserida com sucesso no Kanban!');
        if (titleEl) titleEl.value = '';
        clearSelections();
      })
      .catch(err => {
        console.error('Task registration failed:', err);
        showToast(`Falha: ${err.message}. Verifique a URL do painel no Popup!`, true);
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Criar Tarefa';
        }
      });
    });
  }

  // Alterna o modo de inspeção (seleção direta de texto)
  function toggleInspectMode() {
    if (inspectModeActive) {
      disableInspectMode();
    } else {
      enableInspectMode();
    }
  }

  function enableInspectMode() {
    inspectModeActive = true;
    const btn = document.getElementById('kanban-inspect-btn');
    const btnText = document.getElementById('kanban-inspect-btn-text');
    
    if (btn) btn.classList.add('active');
    if (btnText) btnText.innerText = 'Modo Clique Ativo! Selecione um texto';
    
    showToast('Modo Inspetor Ativado! Passe o mouse sobre qualquer mensagem e clique para selecionar.');

    // Adiciona ouvintes de eventos para hover e clique no documento
    document.addEventListener('mouseover', handleInspectMouseOver, true);
    document.addEventListener('mouseout', handleInspectMouseOut, true);
    document.addEventListener('click', handleInspectClick, true);
  }

  function disableInspectMode() {
    inspectModeActive = false;
    const btn = document.getElementById('kanban-inspect-btn');
    const btnText = document.getElementById('kanban-inspect-btn-text');
    
    if (btn) btn.classList.remove('active');
    if (btnText) btnText.innerText = 'Selecionar por Clique (Fácil)';

    if (hoveredElement) {
      hoveredElement.classList.remove('kanban-inspect-hover');
      hoveredElement = null;
    }

    // Remove ouvintes de eventos
    document.removeEventListener('mouseover', handleInspectMouseOver, true);
    document.removeEventListener('mouseout', handleInspectMouseOut, true);
    document.removeEventListener('click', handleInspectClick, true);
  }

  function handleInspectMouseOver(e) {
    if (!inspectModeActive) return;
    
    // Evita destacar elementos do nosso próprio painel flutuante
    if (e.target.closest('#kanban-floating-panel') || e.target.closest('#kanban-indicator-btn') || e.target.closest('#kanban-toast-notice')) {
      return;
    }

    if (hoveredElement) {
      hoveredElement.classList.remove('kanban-inspect-hover');
    }

    // Preferencialmente destaca elementos de texto ou bolhas
    hoveredElement = e.target;
    hoveredElement.classList.add('kanban-inspect-hover');
  }

  function handleInspectMouseOut(e) {
    if (hoveredElement) {
      hoveredElement.classList.remove('kanban-inspect-hover');
      hoveredElement = null;
    }
  }

  function handleInspectClick(e) {
    if (!inspectModeActive) return;

    // Se estiver clicando em nosso próprio painel, deixa passar
    if (e.target.closest('#kanban-floating-panel') || e.target.closest('#kanban-indicator-btn') || e.target.closest('#kanban-toast-notice')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const clickedEl = e.target;
    const messageText = (clickedEl.innerText || clickedEl.textContent || '').trim();

    if (messageText.length > 0) {
      // Tenta inferir o remetente subindo a árvore do DOM até a bolha
      let bubble = clickedEl.closest('div.message-in, div.message-out, div[class*="message-in"], div[class*="message-out"], div[data-id], [role="row"]');
      let senderName = 'WhatsApp';
      if (bubble) {
        senderName = extractSenderFromBubble(bubble);
      } else {
        senderName = getActiveChatName() || 'Contato WhatsApp';
      }

      const msgObject = {
        element: clickedEl,
        text: messageText,
        sender: senderName
      };

      // Adiciona às selecionadas
      selectedMessages.add(msgObject);
      updatePanelForm();
      showToast(`Mensagem de "${senderName}" adicionada à lista!`);
    }

    // Desativa o inspetor depois de selecionar (para usabilidade fluída)
    disableInspectMode();
  }

  function getActiveChatName() {
    try {
      const header = document.querySelector('header');
      if (header) {
        // Encontra o título ou span de texto no header do chat ativo
        const titleEl = header.querySelector('span[title], div[title], span[dir="auto"]');
        if (titleEl) {
          const name = titleEl.getAttribute('title') || titleEl.innerText;
          if (name && name.trim().length > 0) {
            return name.trim();
          }
        }
      }
    } catch(e) {}
    return null;
  }

  // Tenta extrair o remetente pelo cabeçalho do WhatsApp
  function extractSenderFromBubble(messageBubble) {
    try {
      // Se for mensagem de saída (nossa), retorna "Eu"
      if (messageBubble.classList.contains('message-out') || messageBubble.className.includes('message-out')) {
        return 'Eu';
      }

      // 1. Procura por container do cabeçalho que tenha o nome
      const headerEl = messageBubble.querySelector('.copyable-text[data-pre-plain-text]');
      if (headerEl) {
        const preText = headerEl.getAttribute('data-pre-plain-text'); // Formato: "[Hora, Data] Nome:"
        const parts = preText.split(']');
        if (parts.length > 1) {
          return parts[1].replace(':', '').trim();
        }
      }

      // 2. Busca por spans estilizados de nome
      const nameSpan = messageBubble.querySelector('span[dir="auto"]');
      if (nameSpan && nameSpan.innerText && nameSpan.innerText.length > 1 && !nameSpan.innerText.includes(':') && !nameSpan.innerText.match(/^\d{2}:\d{2}$/)) {
        return nameSpan.innerText.trim();
      }
    } catch (e) {
      // silence
    }
    
    // Fallback: nome do contato ativo no topo do chat
    const activeContactName = getActiveChatName();
    if (activeContactName) return activeContactName;

    return 'Contato WhatsApp';
  }

  // Insere as checkboxes nas bolhas de mensagem do WhatsApp Web de forma super-resiliente
  function injectCheckboxes() {
    // Busca ampla de potenciais contêineres de texto de mensagem
    const selectors = [
      'span.selectable-text', 
      '.selectable-text', 
      '[class*="selectable-text"]', 
      '.copyable-text span', 
      'span[dir="ltr"]', 
      'div[data-id] span[dir="auto"]'
    ];

    let foundElements = [];
    selectors.forEach(sel => {
      try {
        const els = document.querySelectorAll(sel);
        els.forEach(el => {
          if (!foundElements.includes(el)) {
            foundElements.push(el);
          }
        });
      } catch(e){}
    });

    foundElements.forEach(textContainer => {
      // Se já tiver injetado diretamente, pula
      if (textContainer.getAttribute('data-kanban-injected') === 'true' || textContainer.querySelector('.kanban-checkbox-container')) return;

      // Encontra a bolha ou container de mensagem subindo o DOM
      let bubble = textContainer.closest('div.message-in, div.message-out, div[class*="message-in"], div[class*="message-out"], div[data-id], [role="row"], .copyable-text');
      
      // Se a bolha já tiver uma checkbox regulamentar, pula para evitar duplicados na mesma bolha
      if (bubble && (bubble.querySelector('.kanban-checkbox-container') || bubble.getAttribute('data-kanban-injected') === 'true')) {
        textContainer.setAttribute('data-kanban-injected', 'true');
        return;
      }

      // Se o pai imediato já tiver a checkbox, pula
      if (textContainer.parentElement && (textContainer.parentElement.querySelector('.kanban-checkbox-container') || textContainer.parentElement.getAttribute('data-kanban-injected') === 'true')) {
        textContainer.setAttribute('data-kanban-injected', 'true');
        return;
      }

      // Ignora elementos vazios, curtos, botões ou componentes do painel/inspetor
      const messageText = (textContainer.innerText || textContainer.textContent || '').trim();
      if (!messageText || messageText.length < 2) return;
      if (textContainer.closest('#kanban-floating-panel') || textContainer.closest('#kanban-indicator-btn') || textContainer.closest('#kanban-toast-notice')) return;
      
      // Ignora timestamps óbvios (ex: 12:45 ou 09:12 ou PM/AM)
      if (messageText.match(/^\d{1,2}:\d{2}(\s?[APMapm]{2})?$/)) return;

      let senderName = 'WhatsApp';
      if (bubble) {
        senderName = extractSenderFromBubble(bubble);
      } else {
        senderName = getActiveChatName() || 'WhatsApp';
      }

      // Cria a Checkbox estilizada
      const container = document.createElement('label');
      container.className = 'kanban-checkbox-container';
      container.title = 'Selecionar para criar tarefa no Kanban';
      container.addEventListener('click', function(e) {
        e.stopPropagation();
      });

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'kanban-checkbox';

      checkbox.addEventListener('change', function (e) {
        e.stopPropagation();
        const msgObject = {
          element: textContainer,
          text: messageText,
          sender: senderName
        };

        if (this.checked) {
          selectedMessages.add(msgObject);
          showPanel();
        } else {
          // Remove objeto equivalente
          let toRemove = null;
          selectedMessages.forEach(item => {
            if (item.text === messageText && item.sender === senderName) {
              toRemove = item;
            }
          });
          if (toRemove) selectedMessages.delete(toRemove);

          updatePanelForm();
          if (selectedMessages.size === 0) {
            hidePanel();
          }
        }
      });

      container.appendChild(checkbox);

      // Insere à frente do texto da mensagem
      try {
        textContainer.parentNode.insertBefore(container, textContainer);
        textContainer.setAttribute('data-kanban-injected', 'true');
        if (bubble) {
          bubble.setAttribute('data-kanban-injected', 'true');
        }
      } catch(e){}
    });
  }

  // Observer inteligente para injetar checkboxes na rolagem e cliques do WhatsApp Web
  const observer = new MutationObserver((mutations) => {
    let shouldInject = false;
    for (let mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldInject = true;
        break;
      }
    }
    if (shouldInject) {
      injectCheckboxes();
    }
  });

  // Começa a observar assim que carrega
  function initialize() {
    createIndicatorButton();
    createFloatingPanel();
    injectCheckboxes();

    const mainChatContainer = document.getElementById('app') || document.body;
    observer.observe(mainChatContainer, {
      childList: true,
      subtree: true
    });

    // Tenta re-injetar periodicamente como redundância
    setInterval(injectCheckboxes, 1500);
  }

  // Aguarda o carregamento inicial do WhatsApp Web
  const checkInterval = setInterval(() => {
    const isReady = document.getElementById('app') || document.querySelector('.message-in, .message-out, span.selectable-text, .selectable-text');
    if (isReady) {
      clearInterval(checkInterval);
      initialize();
    }
  }, 1000);

})();
