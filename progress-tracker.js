/**
 * Rylem Academy Progress Tracker
 * Floating pill widget showing overall Academy progress.
 */
(function () {
  'use strict';

  const MODULES = [
    { key: 'rylem_quiz_recruiter-foundation',        label: 'Foundation' },
    { key: 'rylem_quiz_recruiter-execution',          label: 'Execution' },
    { key: 'rylem_quiz_recruiter-acceleration',       label: 'Acceleration' },
    { key: 'rylem_quiz_recruiter-tech-overview',      label: 'Tech Overview' },
    { key: 'rylem_quiz_recruiter-advanced-sourcing',  label: 'Advanced Sourcing' },
  ];

  const CSS = `
    #rylem-pt-widget {
      position: fixed;
      top: 70px;
      right: 16px;
      z-index: 9999;
      font-family: inherit;
      font-size: 0.82rem;
      user-select: none;
    }
    #rylem-pt-pill {
      display: flex;
      align-items: center;
      gap: 7px;
      background: #1a1a2e;
      border: 1.5px solid #2a2a4a;
      border-radius: 20px;
      padding: 6px 14px 6px 10px;
      cursor: pointer;
      color: #e8e8e8;
      transition: border-color 0.2s, box-shadow 0.2s;
      white-space: nowrap;
      box-shadow: 0 2px 12px rgba(0,0,0,0.35);
    }
    #rylem-pt-pill:hover {
      border-color: var(--green, #00c864);
      box-shadow: 0 2px 16px rgba(0,200,100,0.15);
    }
    #rylem-pt-icon { font-size: 1rem; }
    #rylem-pt-text { font-weight: 600; font-size: 0.8rem; }
    #rylem-pt-bar-wrap {
      width: 56px;
      height: 5px;
      background: #2a2a4a;
      border-radius: 3px;
      overflow: hidden;
    }
    #rylem-pt-bar {
      height: 100%;
      background: var(--green, #00c864);
      border-radius: 3px;
      transition: width 0.4s ease;
    }
    #rylem-pt-dropdown {
      display: none;
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: #1a1a2e;
      border: 1px solid #2a2a4a;
      border-radius: 10px;
      padding: 12px 14px;
      min-width: 210px;
      box-shadow: 0 6px 24px rgba(0,0,0,0.45);
    }
    #rylem-pt-dropdown.open { display: block; }
    .rylem-pt-header {
      font-weight: 700;
      font-size: 0.82rem;
      color: #8888aa;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
    }
    .rylem-pt-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #22223a;
      font-size: 0.83rem;
      color: #e8e8e8;
      gap: 10px;
    }
    .rylem-pt-row:last-child { border-bottom: none; }
    .rylem-pt-row-label { flex: 1; }
    .rylem-pt-status-done { color: #00c864; font-weight: 600; }
    .rylem-pt-status-pending { color: #555577; }
    .rylem-pt-overall {
      margin-top: 10px;
      text-align: center;
      font-size: 0.78rem;
      color: #8888aa;
    }
    @media (max-width: 480px) {
      #rylem-pt-widget { top: auto; bottom: 80px; right: 12px; }
      #rylem-pt-bar-wrap { width: 40px; }
    }
  `;

  function getCompletions() {
    const result = {};
    MODULES.forEach(m => {
      try {
        const raw = localStorage.getItem(m.key);
        if (raw) {
          const data = JSON.parse(raw);
          result[m.key] = data.passed === true;
        } else {
          result[m.key] = false;
        }
      } catch (e) {
        result[m.key] = false;
      }
    });
    return result;
  }

  function injectStyles() {
    if (document.getElementById('rylem-pt-styles')) return;
    const style = document.createElement('style');
    style.id = 'rylem-pt-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function render(pillText, barEl, completions, dropdownEl) {
    const done = Object.values(completions).filter(Boolean).length;
    const total = MODULES.length;
    const pct = Math.round((done / total) * 100);

    pillText.textContent = `${done}/${total} modules`;
    barEl.style.width = pct + '%';
    barEl.style.background = done === total ? 'var(--green, #00c864)' : done >= 3 ? '#f5c518' : 'var(--green, #00c864)';

    // Rebuild dropdown rows
    dropdownEl.innerHTML = `<div class="rylem-pt-header">Academy Progress</div>`;
    MODULES.forEach(m => {
      const row = document.createElement('div');
      row.className = 'rylem-pt-row';
      const passed = completions[m.key];
      row.innerHTML = `
        <span class="rylem-pt-row-label">${m.label}</span>
        <span class="${passed ? 'rylem-pt-status-done' : 'rylem-pt-status-pending'}">${passed ? '✅ Done' : '○ Pending'}</span>
      `;
      dropdownEl.appendChild(row);
    });

    const overall = document.createElement('div');
    overall.className = 'rylem-pt-overall';
    overall.textContent = `${pct}% complete`;
    dropdownEl.appendChild(overall);
  }

  function init() {
    injectStyles();

    const widget = document.createElement('div');
    widget.id = 'rylem-pt-widget';

    const pill = document.createElement('div');
    pill.id = 'rylem-pt-pill';

    const icon = document.createElement('span');
    icon.id = 'rylem-pt-icon';
    icon.textContent = '📊';

    const pillText = document.createElement('span');
    pillText.id = 'rylem-pt-text';

    const barWrap = document.createElement('div');
    barWrap.id = 'rylem-pt-bar-wrap';
    const barEl = document.createElement('div');
    barEl.id = 'rylem-pt-bar';
    barWrap.appendChild(barEl);

    pill.appendChild(icon);
    pill.appendChild(pillText);
    pill.appendChild(barWrap);

    const dropdown = document.createElement('div');
    dropdown.id = 'rylem-pt-dropdown';

    widget.appendChild(pill);
    widget.appendChild(dropdown);
    document.body.appendChild(widget);

    // Initial render
    const completions = getCompletions();
    render(pillText, barEl, completions, dropdown);

    // Toggle dropdown
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
    });

    // Public API for quiz engine to call
    window.RylemProgressTracker = {
      refresh: function () {
        const c = getCompletions();
        render(pillText, barEl, c, dropdown);
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
