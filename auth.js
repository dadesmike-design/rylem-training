(function () {
  'use strict';

  var STORAGE_KEY = 'rylem_auth_token';
  var CORRECT_CODE = 'rylem2026';
  var EXPIRY_DAYS = 30;

  function isAuthenticated() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (!data || !data.expires) return false;
      return Date.now() < data.expires;
    } catch (e) {
      return false;
    }
  }

  function setAuthenticated() {
    var expires = Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ expires: expires }));
  }

  function buildOverlay() {
    var style = document.createElement('style');
    style.textContent = [
      '#rylem-auth-overlay {',
      '  position: fixed; top: 0; left: 0; width: 100%; height: 100%;',
      '  background: #0a0a1a; z-index: 999999;',
      '  display: flex; align-items: center; justify-content: center;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '}',
      '#rylem-auth-card {',
      '  background: #1a1a2e; border: 1px solid #2a2a4a;',
      '  border-radius: 16px; padding: 48px 40px; width: 100%; max-width: 380px;',
      '  box-shadow: 0 24px 80px rgba(0,0,0,0.6); text-align: center;',
      '}',
      '#rylem-auth-logo {',
      '  width: 64px; height: 64px; border-radius: 16px;',
      '  background: linear-gradient(135deg, #00d4aa, #0080ff);',
      '  display: flex; align-items: center; justify-content: center;',
      '  margin: 0 auto 24px; font-size: 28px; font-weight: 800; color: #fff;',
      '  letter-spacing: -1px;',
      '}',
      '#rylem-auth-card h2 {',
      '  color: #eaf1fa; font-size: 22px; font-weight: 700;',
      '  margin: 0 0 6px; letter-spacing: -0.3px;',
      '}',
      '#rylem-auth-card p {',
      '  color: #6b8099; font-size: 14px; margin: 0 0 28px;',
      '}',
      '#rylem-auth-input {',
      '  width: 100%; box-sizing: border-box;',
      '  background: #0d0d1f; border: 1.5px solid #2a2a4a;',
      '  border-radius: 10px; padding: 14px 16px;',
      '  color: #eaf1fa; font-size: 16px; letter-spacing: 2px;',
      '  text-align: center; outline: none; transition: border-color 0.2s;',
      '  margin-bottom: 12px;',
      '}',
      '#rylem-auth-input:focus { border-color: #00d4aa; }',
      '#rylem-auth-btn {',
      '  width: 100%; padding: 14px;',
      '  background: linear-gradient(135deg, #00d4aa, #0080ff);',
      '  border: none; border-radius: 10px; color: #fff;',
      '  font-size: 15px; font-weight: 700; cursor: pointer;',
      '  transition: opacity 0.2s; letter-spacing: 0.3px;',
      '}',
      '#rylem-auth-btn:hover { opacity: 0.88; }',
      '#rylem-auth-error {',
      '  color: #ef4444; font-size: 13px; margin-top: 10px;',
      '  min-height: 18px; display: none;',
      '}',
      '@keyframes rylem-shake {',
      '  0%,100%{transform:translateX(0)}',
      '  15%{transform:translateX(-8px)}',
      '  45%{transform:translateX(8px)}',
      '  70%{transform:translateX(-5px)}',
      '  85%{transform:translateX(5px)}',
      '}',
      '.rylem-shake { animation: rylem-shake 0.4s ease; }',
    ].join('\n');
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.id = 'rylem-auth-overlay';
    overlay.innerHTML = [
      '<div id="rylem-auth-card">',
      '  <div id="rylem-auth-logo">R</div>',
      '  <h2>Rylem Internal</h2>',
      '  <p>Enter your access code to continue</p>',
      '  <input id="rylem-auth-input" type="password" placeholder="Access code" autocomplete="off" />',
      '  <button id="rylem-auth-btn">Enter</button>',
      '  <div id="rylem-auth-error">Incorrect code — try again</div>',
      '</div>',
    ].join('');

    document.body.appendChild(overlay);

    var input = document.getElementById('rylem-auth-input');
    var btn = document.getElementById('rylem-auth-btn');
    var errMsg = document.getElementById('rylem-auth-error');
    var card = document.getElementById('rylem-auth-card');

    function attempt() {
      if (input.value.trim() === CORRECT_CODE) {
        setAuthenticated();
        overlay.style.transition = 'opacity 0.3s';
        overlay.style.opacity = '0';
        setTimeout(function () { overlay.remove(); }, 300);
      } else {
        errMsg.style.display = 'block';
        card.classList.remove('rylem-shake');
        void card.offsetWidth; // reflow to restart animation
        card.classList.add('rylem-shake');
        input.value = '';
        input.focus();
      }
    }

    btn.addEventListener('click', attempt);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') attempt();
    });

    setTimeout(function () { input.focus(); }, 50);
  }

  function init() {
    if (isAuthenticated()) return;
    // Hide body content until auth
    document.documentElement.style.overflow = 'hidden';
    if (document.body) {
      buildOverlay();
    } else {
      document.addEventListener('DOMContentLoaded', buildOverlay);
    }
  }

  init();
})();
