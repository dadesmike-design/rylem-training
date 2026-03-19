(function () {
  'use strict';

  // ── Config (can be overridden via window.RYLEM_CHAT_* before script loads) ──
  const MODE        = window.RYLEM_CHAT_MODE        || 'training';
  const LABEL       = window.RYLEM_CHAT_LABEL       || (MODE === 'pipeline' ? 'Ask about pipeline' : 'Ask Rylem AI');
  const HEADER      = window.RYLEM_CHAT_HEADER      || (MODE === 'pipeline' ? 'Pipeline AI' : 'Rylem Academy AI');
  const PLACEHOLDER = window.RYLEM_CHAT_PLACEHOLDER || (MODE === 'pipeline' ? 'e.g. How many active clients do we have?' : 'Ask about tech, sales, recruiting...');
  const WORKER_URL  = 'https://rylem-ai-chat.rylem-ai.workers.dev';

  // ── Styles ──────────────────────────────────────────────────────────────────
  const css = `
    #rylem-chat-widget * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

    #rylem-chat-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99998;
      display: flex;
      align-items: center;
      gap: 10px;
      background: #4f46e5;
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 14px 20px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(79,70,229,0.5);
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.02em;
      transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
      white-space: nowrap;
    }
    #rylem-chat-btn:hover { background: #4338ca; transform: translateY(-2px); box-shadow: 0 6px 24px rgba(79,70,229,0.6); }
    #rylem-chat-btn svg { flex-shrink: 0; }

    #rylem-chat-window {
      position: fixed;
      bottom: 90px;
      right: 24px;
      z-index: 99999;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 520px;
      max-height: calc(100vh - 110px);
      background: #1a1a2e;
      border: 1px solid #2d2d50;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 12px 48px rgba(0,0,0,0.5);
      transform: scale(0.92) translateY(16px);
      transform-origin: bottom right;
      opacity: 0;
      pointer-events: none;
      transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease;
    }
    #rylem-chat-window.rylem-open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    #rylem-chat-header {
      background: #16213e;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #2d2d50;
      flex-shrink: 0;
    }
    #rylem-chat-header-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #e2e8f0;
      font-weight: 700;
      font-size: 15px;
    }
    .rylem-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: rylem-pulse 2s infinite; }
    @keyframes rylem-pulse { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }

    #rylem-chat-close {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      transition: color 0.15s, background 0.15s;
    }
    #rylem-chat-close:hover { color: #e2e8f0; background: rgba(255,255,255,0.08); }

    #rylem-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }
    #rylem-chat-messages::-webkit-scrollbar { width: 4px; }
    #rylem-chat-messages::-webkit-scrollbar-track { background: transparent; }
    #rylem-chat-messages::-webkit-scrollbar-thumb { background: #3d3d6b; border-radius: 4px; }

    .rylem-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.5;
      word-wrap: break-word;
      animation: rylem-fadein 0.2s ease;
    }
    @keyframes rylem-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

    .rylem-msg-user {
      background: #4f46e5;
      color: #fff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .rylem-msg-ai {
      background: #232346;
      color: #e2e8f0;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      border: 1px solid #2d2d50;
    }

    .rylem-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 10px 14px;
      background: #232346;
      border: 1px solid #2d2d50;
      border-radius: 14px;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
    }
    .rylem-typing span {
      width: 7px; height: 7px;
      background: #6366f1;
      border-radius: 50%;
      animation: rylem-bounce 1.2s infinite;
    }
    .rylem-typing span:nth-child(2) { animation-delay: 0.2s; }
    .rylem-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes rylem-bounce { 0%,60%,100%{ transform:translateY(0); } 30%{ transform:translateY(-6px); } }

    #rylem-chat-form {
      padding: 12px;
      border-top: 1px solid #2d2d50;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
      background: #16213e;
    }
    #rylem-chat-input {
      flex: 1;
      background: #1e1e3a;
      border: 1px solid #3d3d6b;
      border-radius: 10px;
      color: #e2e8f0;
      padding: 10px 14px;
      font-size: 13.5px;
      outline: none;
      resize: none;
      transition: border-color 0.15s;
    }
    #rylem-chat-input::placeholder { color: #64748b; }
    #rylem-chat-input:focus { border-color: #4f46e5; }

    #rylem-chat-send {
      background: #4f46e5;
      border: none;
      border-radius: 10px;
      color: #fff;
      cursor: pointer;
      padding: 0 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, transform 0.1s;
    }
    #rylem-chat-send:hover { background: #4338ca; }
    #rylem-chat-send:active { transform: scale(0.95); }
    #rylem-chat-send:disabled { background: #2d2d50; cursor: not-allowed; }

    @media (max-width: 480px) {
      #rylem-chat-window { right: 16px; bottom: 80px; width: calc(100vw - 32px); height: 70vh; }
      #rylem-chat-btn { right: 16px; bottom: 16px; padding: 12px 16px; font-size: 13px; }
    }
  `;

  // ── HTML ─────────────────────────────────────────────────────────────────────
  const html = `
    <style>${css}</style>
    <div id="rylem-chat-widget">
      <button id="rylem-chat-btn" aria-label="Open chat">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        ${LABEL}
      </button>

      <div id="rylem-chat-window" role="dialog" aria-label="${HEADER}">
        <div id="rylem-chat-header">
          <div id="rylem-chat-header-title">
            <div class="rylem-dot"></div>
            ${HEADER}
          </div>
          <button id="rylem-chat-close" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div id="rylem-chat-messages"></div>

        <form id="rylem-chat-form" autocomplete="off">
          <textarea
            id="rylem-chat-input"
            rows="1"
            placeholder="${PLACEHOLDER}"
            maxlength="2000"
          ></textarea>
          <button type="submit" id="rylem-chat-send" aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  `;

  // ── Mount ────────────────────────────────────────────────────────────────────
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  const btn      = document.getElementById('rylem-chat-btn');
  const win      = document.getElementById('rylem-chat-window');
  const closeBtn = document.getElementById('rylem-chat-close');
  const messages = document.getElementById('rylem-chat-messages');
  const form     = document.getElementById('rylem-chat-form');
  const input    = document.getElementById('rylem-chat-input');
  const sendBtn  = document.getElementById('rylem-chat-send');

  let isOpen = false;

  function toggleChat() {
    isOpen = !isOpen;
    win.classList.toggle('rylem-open', isOpen);
    if (isOpen) { input.focus(); scrollToBottom(); }
  }

  btn.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) toggleChat();
  });

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function appendMessage(role, text) {
    const el = document.createElement('div');
    el.className = 'rylem-msg ' + (role === 'user' ? 'rylem-msg-user' : 'rylem-msg-ai');
    el.textContent = text;
    messages.appendChild(el);
    scrollToBottom();
    return el;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'rylem-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(el);
    scrollToBottom();
    return el;
  }

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  // Send on Enter (Shift+Enter = newline)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event('submit'));
    }
  });

  async function fetchContext() {
    if (MODE !== 'pipeline') return '';
    try {
      const [contextRes, leadsRes] = await Promise.all([
        fetch('/data/pipeline-context.json').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/data/leads.json').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      const parts = [];
      if (contextRes) parts.push('BUSINESS DATA: ' + JSON.stringify(contextRes));
      if (leadsRes)   parts.push('PIPELINE LEADS: ' + JSON.stringify(leadsRes));
      return parts.join('\n\n');
    } catch (e) {
      return '';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    appendMessage('user', text);
    const typingEl = showTyping();

    try {
      const context = await fetchContext();
      const body = { message: text, mode: MODE };
      if (context) body.context = context;

      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      typingEl.remove();

      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      appendMessage('ai', data.reply || '(No response)');
    } catch (err) {
      typingEl.remove();
      appendMessage('ai', 'Sorry, something went wrong. Please try again.');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  });

})();
