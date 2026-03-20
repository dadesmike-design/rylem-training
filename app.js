/* ── Rylem Academy — Shared JavaScript ── */

(function() {
  'use strict';

  // ── Mobile Nav Toggle ──
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    // Close on link click (mobile)
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // ── Collapsible Sections ──
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('open');
    });
  });

  // ── localStorage key prefix ──
  const STORAGE_PREFIX = 'rylem_academy_';
  const pagePath = window.location.pathname.split('/').pop() || 'index';

  // ── Checkbox Persistence ──
  const checkboxes = document.querySelectorAll('.checklist input[type="checkbox"]');
  
  // Load saved state
  checkboxes.forEach(cb => {
    const key = STORAGE_PREFIX + pagePath + '_' + cb.id;
    const saved = localStorage.getItem(key);
    if (saved === 'true') cb.checked = true;
  });

  // Save on change + update progress
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const key = STORAGE_PREFIX + pagePath + '_' + cb.id;
      localStorage.setItem(key, cb.checked);
      updateProgress();
    });
  });

  // ── Progress Bar Updates ──
  function updateProgress() {
    document.querySelectorAll('.milestone-section, .card').forEach(section => {
      const checks = section.querySelectorAll('.checklist input[type="checkbox"]');
      if (checks.length === 0) return;
      
      const checked = Array.from(checks).filter(c => c.checked).length;
      const total = checks.length;
      const pct = Math.round((checked / total) * 100);

      const counter = section.querySelector('.milestone-counter');
      if (counter) counter.textContent = checked + ' / ' + total + ' completed';

      const bar = section.querySelector('.progress-bar-fill');
      if (bar) bar.style.width = pct + '%';
    });
  }

  // Initial progress calculation
  updateProgress();

  // ── Active Nav Highlighting ──
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .sub-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ── Smooth Scroll for hash links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
