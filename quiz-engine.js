/**
 * Rylem Academy Quiz Engine
 * Injects a "Knowledge Check" quiz section into the page.
 * Quiz data is defined via window.RYLEM_QUIZ before this script loads.
 */
(function () {
  'use strict';

  // ── Styles ──────────────────────────────────────────────────────────────
  const CSS = `
    .rylem-quiz-section {
      margin: 40px 0 32px;
    }
    .rylem-quiz-heading {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text, #e8e8e8);
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .rylem-quiz-q {
      background: var(--card-bg, #1a1a2e);
      border: 1px solid var(--border, #2a2a4a);
      border-radius: 10px;
      padding: 20px 22px;
      margin-bottom: 18px;
      transition: border-color 0.2s;
    }
    .rylem-quiz-q.answered { border-color: var(--border, #2a2a4a); }
    .rylem-quiz-q-text {
      font-size: 0.97rem;
      font-weight: 600;
      color: var(--text, #e8e8e8);
      margin-bottom: 14px;
      line-height: 1.5;
    }
    .rylem-quiz-q-num {
      display: inline-block;
      background: var(--purple, #6b5ce7);
      color: #fff;
      border-radius: 50%;
      width: 26px;
      height: 26px;
      line-height: 26px;
      text-align: center;
      font-size: 0.8rem;
      font-weight: 700;
      margin-right: 10px;
      flex-shrink: 0;
    }
    .rylem-quiz-options {
      display: grid;
      gap: 9px;
    }
    .rylem-quiz-option {
      background: var(--bg, #0f0f23);
      border: 1.5px solid var(--border, #2a2a4a);
      border-radius: 8px;
      padding: 11px 16px;
      cursor: pointer;
      color: var(--text, #e8e8e8);
      font-size: 0.9rem;
      text-align: left;
      transition: background 0.15s, border-color 0.15s, transform 0.1s;
      width: 100%;
      font-family: inherit;
    }
    .rylem-quiz-option:hover:not(:disabled) {
      background: rgba(107,92,231,0.12);
      border-color: var(--purple, #6b5ce7);
      transform: translateX(3px);
    }
    .rylem-quiz-option.correct {
      background: rgba(0,200,100,0.12);
      border-color: #00c864;
      color: #00e87a;
    }
    .rylem-quiz-option.wrong {
      background: rgba(220,50,50,0.12);
      border-color: #dc3232;
      color: #ff6b6b;
    }
    .rylem-quiz-option.reveal-correct {
      background: rgba(0,200,100,0.08);
      border-color: #00c864;
      color: #00e87a;
    }
    .rylem-quiz-option:disabled { cursor: default; transform: none; }
    .rylem-quiz-feedback {
      margin-top: 11px;
      font-size: 0.85rem;
      color: var(--text-muted, #8888aa);
      line-height: 1.5;
      padding: 8px 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 6px;
      display: none;
    }
    .rylem-quiz-feedback.visible { display: block; }
    .rylem-quiz-score {
      text-align: center;
      padding: 28px 20px;
      background: var(--card-bg, #1a1a2e);
      border: 1px solid var(--border, #2a2a4a);
      border-radius: 12px;
      margin-top: 24px;
      display: none;
    }
    .rylem-quiz-score.visible { display: block; }
    .rylem-quiz-score-num {
      font-size: 2.8rem;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 8px;
    }
    .rylem-quiz-score-num.green { color: #00c864; }
    .rylem-quiz-score-num.yellow { color: #f5c518; }
    .rylem-quiz-score-num.red { color: #dc3232; }
    .rylem-quiz-score-label {
      font-size: 1rem;
      color: var(--text-muted, #8888aa);
      margin-bottom: 6px;
    }
    .rylem-quiz-score-badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      margin-top: 8px;
    }
    .rylem-quiz-score-badge.green { background: rgba(0,200,100,0.15); color: #00c864; }
    .rylem-quiz-score-badge.yellow { background: rgba(245,197,24,0.15); color: #f5c518; }
    .rylem-quiz-score-badge.red { background: rgba(220,50,50,0.15); color: #dc3232; }
    .rylem-quiz-retry-btn {
      margin-top: 16px;
      background: var(--purple, #6b5ce7);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 24px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.2s;
    }
    .rylem-quiz-retry-btn:hover { opacity: 0.85; }
    .rylem-quiz-saved-note {
      font-size: 0.78rem;
      color: #00c864;
      margin-top: 10px;
    }
    @media (max-width: 600px) {
      .rylem-quiz-score-num { font-size: 2rem; }
    }
  `;

  function injectStyles() {
    if (document.getElementById('rylem-quiz-styles')) return;
    const style = document.createElement('style');
    style.id = 'rylem-quiz-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function getPageKey() {
    const path = window.location.pathname;
    const file = path.split('/').pop().replace('.html', '') || 'index';
    return 'rylem_quiz_' + file;
  }

  function saveCompletion(score, total) {
    try {
      const key = getPageKey();
      localStorage.setItem(key, JSON.stringify({
        score,
        total,
        passed: score >= Math.ceil(total * 0.8),
        ts: Date.now()
      }));
    } catch (e) { /* localStorage unavailable */ }
  }

  function buildQuiz(questions) {
    const section = document.createElement('div');
    section.className = 'rylem-quiz-section';

    const heading = document.createElement('div');
    heading.className = 'rylem-quiz-heading';
    heading.innerHTML = '🧠 Knowledge Check';
    section.appendChild(heading);

    let answered = 0;
    let correct = 0;
    const total = questions.length;

    const scoreEl = document.createElement('div');
    scoreEl.className = 'rylem-quiz-score';

    questions.forEach((q, idx) => {
      const qEl = document.createElement('div');
      qEl.className = 'rylem-quiz-q';

      const qText = document.createElement('div');
      qText.className = 'rylem-quiz-q-text';
      qText.innerHTML = `<span class="rylem-quiz-q-num">${idx + 1}</span>${q.question}`;
      qEl.appendChild(qText);

      const optWrap = document.createElement('div');
      optWrap.className = 'rylem-quiz-options';

      const feedback = document.createElement('div');
      feedback.className = 'rylem-quiz-feedback';

      q.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'rylem-quiz-option';
        btn.textContent = opt;
        btn.addEventListener('click', function () {
          if (qEl.classList.contains('answered')) return;
          qEl.classList.add('answered');

          // Disable all options
          optWrap.querySelectorAll('.rylem-quiz-option').forEach(b => b.disabled = true);

          const isCorrect = opt === q.answer;
          if (isCorrect) {
            btn.classList.add('correct');
            btn.textContent = '✅ ' + opt;
            correct++;
          } else {
            btn.classList.add('wrong');
            btn.textContent = '❌ ' + opt;
            // Highlight correct
            optWrap.querySelectorAll('.rylem-quiz-option').forEach(b => {
              if (b.textContent === q.answer || b.dataset.answer === 'true') {
                b.classList.add('reveal-correct');
                b.textContent = '✅ ' + q.answer;
              }
            });
          }

          feedback.innerHTML = `<strong>${isCorrect ? '✓ Correct!' : '✗ Not quite.'}</strong> ${q.explanation || ''}`;
          feedback.classList.add('visible');

          answered++;
          if (answered === total) {
            showScore();
          }
        });
        // Tag correct option for reveal
        if (opt === q.answer) btn.dataset.answer = 'true';
        optWrap.appendChild(btn);
      });

      qEl.appendChild(optWrap);
      qEl.appendChild(feedback);
      section.appendChild(qEl);
    });

    // Score display
    const scoreNum = document.createElement('div');
    scoreNum.className = 'rylem-quiz-score-num';

    const scoreLabel = document.createElement('div');
    scoreLabel.className = 'rylem-quiz-score-label';

    const scoreBadge = document.createElement('div');
    scoreBadge.className = 'rylem-quiz-score-badge';

    const savedNote = document.createElement('div');
    savedNote.className = 'rylem-quiz-saved-note';

    const retryBtn = document.createElement('button');
    retryBtn.className = 'rylem-quiz-retry-btn';
    retryBtn.textContent = '↩ Retake Quiz';
    retryBtn.addEventListener('click', () => {
      section.parentNode.replaceChild(buildQuiz(questions), section);
    });

    function showScore() {
      const pct = Math.round((correct / total) * 100);
      const colorClass = pct >= 80 ? 'green' : pct >= 60 ? 'yellow' : 'red';
      const msg = pct >= 80 ? 'Module Passed 🎉' : pct >= 60 ? 'Keep Practicing' : 'Review & Retry';

      scoreNum.textContent = `${correct}/${total}`;
      scoreNum.className = `rylem-quiz-score-num ${colorClass}`;
      scoreLabel.textContent = `${pct}% — ${msg}`;
      scoreBadge.textContent = pct >= 80 ? '✅ Completed' : '⚠️ Not Passed';
      scoreBadge.className = `rylem-quiz-score-badge ${colorClass}`;

      if (pct >= 80) {
        saveCompletion(correct, total);
        savedNote.textContent = '✓ Progress saved';
      } else {
        savedNote.textContent = 'Score 80%+ to mark module complete';
        savedNote.style.color = '#f5c518';
      }

      scoreEl.appendChild(scoreNum);
      scoreEl.appendChild(scoreLabel);
      scoreEl.appendChild(scoreBadge);
      scoreEl.appendChild(savedNote);
      scoreEl.appendChild(retryBtn);
      scoreEl.classList.add('visible');

      // Notify progress tracker if loaded
      if (window.RylemProgressTracker && window.RylemProgressTracker.refresh) {
        window.RylemProgressTracker.refresh();
      }
    }

    section.appendChild(scoreEl);
    return section;
  }

  function init() {
    if (!window.RYLEM_QUIZ || !Array.isArray(window.RYLEM_QUIZ) || window.RYLEM_QUIZ.length === 0) {
      return; // No quiz data defined — silently skip
    }

    injectStyles();

    // Find insertion point: before .nav-buttons, or before milestone-section, or before </section>
    const milestoneEl = document.querySelector('.milestone-section');
    const navEl = document.querySelector('.nav-buttons');
    const insertBefore = navEl || milestoneEl;

    if (!insertBefore) {
      // Fallback: append to main content area
      const content = document.querySelector('.content-section, main, .container, section');
      if (content) content.appendChild(buildQuiz(window.RYLEM_QUIZ));
      return;
    }

    const parent = insertBefore.parentNode;
    parent.insertBefore(buildQuiz(window.RYLEM_QUIZ), insertBefore);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
