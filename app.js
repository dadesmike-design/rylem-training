/* ============================================================
   RYLEM Training Portal — Shared JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ── Highlight active nav link ──────────────────────────────
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav a').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ── Mobile hamburger ───────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (hamburger && sidebar && overlay) {
    hamburger.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });
    overlay.addEventListener('click', function () {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // ── Collapsible sections ───────────────────────────────────
  document.querySelectorAll('.collapsible-header').forEach(function (header) {
    header.addEventListener('click', function () {
      const parent = header.closest('.collapsible');
      parent.classList.toggle('open');
    });
  });

  // ── Checkbox persistence (localStorage) ───────────────────
  document.querySelectorAll('.checklist input[type="checkbox"]').forEach(function (cb) {
    const key = 'cb_' + window.location.pathname + '_' + cb.id;
    // Restore
    if (localStorage.getItem(key) === 'checked') {
      cb.checked = true;
    }
    // Save on change
    cb.addEventListener('change', function () {
      if (cb.checked) {
        localStorage.setItem(key, 'checked');
      } else {
        localStorage.removeItem(key);
      }
    });
  });

  // ── Progress bar for milestone checklists ─────────────────
  document.querySelectorAll('.milestone-section').forEach(function (section) {
    const boxes = section.querySelectorAll('input[type="checkbox"]');
    const bar = section.querySelector('.progress-bar-fill');
    const counter = section.querySelector('.milestone-counter');

    function updateProgress() {
      const checked = section.querySelectorAll('input[type="checkbox"]:checked').length;
      const total = boxes.length;
      const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
      if (bar) bar.style.width = pct + '%';
      if (counter) counter.textContent = checked + ' / ' + total + ' completed';
    }

    boxes.forEach(function (cb) {
      cb.addEventListener('change', updateProgress);
    });

    updateProgress();
  });

});
