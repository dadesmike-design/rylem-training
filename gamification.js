/**
 * Rylem Pipeline — Gamification System
 * Self-contained: injects all styles, reads/writes localStorage + gamification.json
 * DO NOT modify style.css — all styles are injected here
 */

(function() {
'use strict';

// ─── CONFIG ───────────────────────────────────────────
const POINTS = {
  call_logged: 5,
  email_sent: 3,
  meeting_booked: 25,
  submittal_made: 15,
  placement: 100,
  followup_completed: 5,
  new_lead: 2
};

const LEVELS = [
  { name: 'Rookie',    min: 0,    max: 499,  color: '#6b8099', bg: 'rgba(107,128,153,0.15)', border: 'rgba(107,128,153,0.3)' },
  { name: 'Hunter',   min: 500,  max: 1499, color: '#0080ff', bg: 'rgba(0,128,255,0.15)',   border: 'rgba(0,128,255,0.3)'   },
  { name: 'Closer',   min: 1500, max: 3999, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.3)'  },
  { name: 'Rainmaker',min: 4000, max: Infinity, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' }
];

const BADGES = {
  first_blood:   { emoji: '🎯', name: 'First Blood',   desc: 'First meeting booked' },
  dialer:        { emoji: '📞', name: 'Dialer',        desc: '10+ calls in a single day' },
  on_fire:       { emoji: '🔥', name: 'On Fire',       desc: '5-day activity streak' },
  closer:        { emoji: '💰', name: 'Closer',        desc: 'First placement' },
  pipeline_full: { emoji: '🏆', name: 'Pipeline Full', desc: '20+ active leads simultaneously' },
  perfect_week:  { emoji: '⭐', name: 'Perfect Week',  desc: 'Hit all daily targets Mon–Fri' },
  rainmaker:     { emoji: '🚀', name: 'Rainmaker',     desc: 'Reach Rainmaker level' },
  top_dog:       { emoji: '👑', name: 'Top Dog',       desc: '#1 on leaderboard for a full week' }
};

// ─── STATE ────────────────────────────────────────────
let gamData = {};       // full gamification.json data
let repData = {};       // current rep's data
let currentRep = 'mike';
let toastQueue = [];
let toastActive = false;

// ─── INJECT STYLES ────────────────────────────────────
function injectStyles() {
  if (document.getElementById('gamification-styles')) return;
  const style = document.createElement('style');
  style.id = 'gamification-styles';
  style.textContent = `
    /* ── Weekly Challenge Banner ── */
    #gam-challenge-banner {
      max-width: 1200px;
      margin: 16px auto 0;
      padding: 0 24px;
    }
    .gam-challenge {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 11px 18px;
      border-radius: 10px;
      border: 1px solid;
      font-size: 13px;
      transition: all 0.3s;
    }
    .gam-challenge-icon { font-size: 18px; flex-shrink: 0; }
    .gam-challenge-body { flex: 1; min-width: 0; }
    .gam-challenge-title {
      font-weight: 700;
      color: #eaf1fa;
      margin-bottom: 4px;
      font-size: 13px;
    }
    .gam-challenge-progress-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .gam-challenge-bar {
      flex: 1;
      height: 5px;
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
      overflow: hidden;
    }
    .gam-challenge-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.6s ease;
    }
    .gam-challenge-pct {
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }
    .gam-challenge-reward {
      font-size: 12px;
      font-weight: 600;
      color: #00d084;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .gam-challenge.on-track {
      background: rgba(0,208,132,0.07);
      border-color: rgba(0,208,132,0.25);
    }
    .gam-challenge.on-track .gam-challenge-fill { background: #00d084; }
    .gam-challenge.on-track .gam-challenge-pct { color: #00d084; }
    .gam-challenge.behind {
      background: rgba(245,158,11,0.07);
      border-color: rgba(245,158,11,0.25);
    }
    .gam-challenge.behind .gam-challenge-fill { background: #f59e0b; }
    .gam-challenge.behind .gam-challenge-pct { color: #f59e0b; }
    .gam-challenge.danger {
      background: rgba(239,68,68,0.07);
      border-color: rgba(239,68,68,0.25);
    }
    .gam-challenge.danger .gam-challenge-fill { background: #ef4444; }
    .gam-challenge.danger .gam-challenge-pct { color: #ef4444; }

    /* ── Rep header gamification strip ── */
    #gam-rep-strip {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: 8px;
    }
    .gam-level-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid;
      white-space: nowrap;
    }
    .gam-points {
      font-size: 12px;
      font-weight: 700;
      color: #00d084;
      white-space: nowrap;
    }
    .gam-streak {
      font-size: 12px;
      font-weight: 700;
      color: #f97316;
      white-space: nowrap;
    }
    .gam-progress-mini {
      width: 70px;
      height: 4px;
      background: rgba(255,255,255,0.1);
      border-radius: 2px;
      overflow: hidden;
    }
    .gam-progress-mini-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.6s ease;
    }
    .gam-badge-count {
      position: relative;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      color: #6b8099;
      padding: 2px 7px;
      border-radius: 6px;
      border: 1px solid #253344;
      background: rgba(255,255,255,0.04);
      transition: all 0.2s;
      white-space: nowrap;
    }
    .gam-badge-count:hover { background: rgba(255,255,255,0.08); color: #d4e0ef; }
    .gam-badge-tooltip {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: #1c2b3d;
      border: 1px solid #253344;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 12px;
      color: #d4e0ef;
      white-space: nowrap;
      z-index: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      min-width: 180px;
      display: none;
    }
    .gam-badge-tooltip.visible { display: block; }
    .gam-badge-tooltip-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      font-size: 12px;
    }
    .gam-badge-tooltip-item span:first-child { font-size: 16px; }
    .gam-badge-empty { color: #4a6278; font-size: 12px; padding: 4px 0; }

    /* ── Leaderboard ── */
    #gam-leaderboard {
      max-width: 1200px;
      margin: 0 auto 28px;
      padding: 0 24px;
    }
    .gam-lb-card {
      background: #162030;
      border: 1px solid #253344;
      border-radius: 14px;
      overflow: hidden;
    }
    .gam-lb-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: #1c2b3d;
      border-bottom: 1px solid #253344;
    }
    .gam-lb-title {
      font-size: 15px;
      font-weight: 700;
      color: #eaf1fa;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .gam-lb-toggle {
      display: flex;
      gap: 4px;
      background: #111d2e;
      border-radius: 8px;
      padding: 3px;
    }
    .gam-lb-toggle-btn {
      padding: 5px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      background: transparent;
      color: #6b8099;
      transition: all 0.15s;
    }
    .gam-lb-toggle-btn.active {
      background: #1c2b3d;
      color: #eaf1fa;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
    .gam-lb-table {
      width: 100%;
      border-collapse: collapse;
    }
    .gam-lb-table th {
      padding: 9px 20px;
      font-size: 10px;
      font-weight: 600;
      color: #6b8099;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
      background: #1c2b3d;
      border-bottom: 1px solid #253344;
    }
    .gam-lb-table td {
      padding: 13px 20px;
      font-size: 13px;
      color: #d4e0ef;
      border-bottom: 1px solid rgba(37,51,68,0.6);
    }
    .gam-lb-table tr:last-child td { border-bottom: none; }
    .gam-lb-table tr:hover td { background: rgba(31,50,72,0.5); }
    .gam-lb-row-1 td { background: rgba(245,158,11,0.06); }
    .gam-lb-row-2 td { background: rgba(107,128,153,0.05); }
    .gam-lb-row-3 td { background: rgba(249,115,22,0.05); }
    .gam-lb-rank {
      font-size: 14px;
      font-weight: 800;
      width: 40px;
      text-align: center;
    }
    .gam-lb-rep-name { font-weight: 700; color: #eaf1fa; }
    .gam-lb-points { font-weight: 700; color: #00d084; }
    .gam-lb-streak { color: #f97316; font-weight: 600; }
    .gam-lb-badges { color: #6b8099; font-size: 12px; }
    .gam-lb-empty {
      padding: 28px;
      text-align: center;
      color: #4a6278;
      font-size: 13px;
    }

    /* ── Achievement Toast (gamification) ── */
    #gam-toast-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }
    .gam-toast {
      background: linear-gradient(135deg, #1c2b3d, #1f3248);
      border: 1px solid #f59e0b;
      border-radius: 12px;
      padding: 14px 18px;
      min-width: 280px;
      max-width: 340px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.1);
      animation: gamSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1), gamFadeOut 0.35s ease 4.65s forwards;
    }
    .gam-toast-inner {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .gam-toast-emoji { font-size: 28px; }
    .gam-toast-body {}
    .gam-toast-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #f59e0b;
      margin-bottom: 2px;
    }
    .gam-toast-title {
      font-size: 14px;
      font-weight: 700;
      color: #eaf1fa;
    }
    .gam-toast-desc {
      font-size: 11px;
      color: #6b8099;
      margin-top: 1px;
    }
    @keyframes gamSlideIn {
      from { transform: translateX(60px) scale(0.9); opacity: 0; }
      to   { transform: translateX(0) scale(1); opacity: 1; }
    }
    @keyframes gamFadeOut {
      to { opacity: 0; transform: translateX(20px); }
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      #gam-challenge-banner { padding: 0 16px; }
      #gam-leaderboard { padding: 0 16px; }
      #gam-rep-strip { gap: 6px; }
      .gam-progress-mini { display: none; }
      .gam-lb-table th:nth-child(4),
      .gam-lb-table td:nth-child(4) { display: none; }
    }
    @media (max-width: 480px) {
      .gam-challenge-reward { display: none; }
      #gam-rep-strip .gam-badge-count { display: none; }
      .gam-lb-table th:nth-child(5),
      .gam-lb-table td:nth-child(5) { display: none; }
    }
  `;
  document.head.appendChild(style);
}

// ─── DATA HELPERS ─────────────────────────────────────
const LS_KEY = 'rylem_gam_data';

function loadGamData() {
  // First try fetching gamification.json
  // Then fallback to localStorage
  return fetch('/data/gamification.json')
    .then(r => r.ok ? r.json() : null)
    .catch(() => null)
    .then(remote => {
      // Try localStorage merge
      let local = null;
      try { local = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch(e) {}

      if (remote && local) {
        // Use local if it's newer (has more events)
        gamData = mergeGamData(remote, local);
      } else if (local) {
        gamData = local;
      } else if (remote) {
        gamData = remote;
      } else {
        gamData = getDefaultGamData();
      }

      ensureRepExists(gamData, 'mike');
      ensureRepExists(gamData, 'julia');
      ensureRepExists(gamData, 'april');
      return gamData;
    });
}

function getDefaultGamData() {
  return {
    lastUpdated: new Date().toISOString(),
    reps: {
      mike:  { points: 0, level: 'Rookie', streak: 0, badges: [], weeklyPoints: 0, history: [] },
      julia: { points: 0, level: 'Rookie', streak: 0, badges: [], weeklyPoints: 0, history: [] },
      april: { points: 0, level: 'Rookie', streak: 0, badges: [], weeklyPoints: 0, history: [] }
    },
    weeklyChallenge: {
      title: 'Launch Week',
      description: 'Log 20 calls this week',
      target: 20,
      metric: 'calls',
      bonusPoints: 50,
      startsAt: '2026-03-17',
      endsAt: '2026-03-23'
    }
  };
}

function ensureRepExists(data, rep) {
  if (!data.reps) data.reps = {};
  if (!data.reps[rep]) {
    data.reps[rep] = { points: 0, level: 'Rookie', streak: 0, badges: [], weeklyPoints: 0, history: [] };
  }
}

function mergeGamData(remote, local) {
  // Prefer local rep data (more events) but keep remote challenge
  const merged = Object.assign({}, remote);
  merged.reps = Object.assign({}, remote.reps);
  Object.keys(local.reps || {}).forEach(rep => {
    const lr = local.reps[rep];
    const rr = remote.reps[rep] || {};
    // Use whichever has more points (more activity recorded)
    if ((lr.points || 0) >= (rr.points || 0)) {
      merged.reps[rep] = lr;
    } else {
      merged.reps[rep] = rr;
    }
  });
  return merged;
}

function saveGamData() {
  gamData.lastUpdated = new Date().toISOString();
  localStorage.setItem(LS_KEY, JSON.stringify(gamData));
}

// ─── LEVEL HELPERS ────────────────────────────────────
function getLevelInfo(points) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

function getNextLevel(points) {
  for (let i = 0; i < LEVELS.length - 1; i++) {
    if (points < LEVELS[i].max) {
      return LEVELS[i + 1];
    }
  }
  return null; // Rainmaker — maxed out
}

function getLevelProgress(points) {
  const cur = getLevelInfo(points);
  const next = getNextLevel(points);
  if (!next) return 100;
  const range = cur.max - cur.min + 1;
  const progress = points - cur.min;
  return Math.min(100, Math.round((progress / range) * 100));
}

// ─── STREAK CALCULATION ───────────────────────────────
function calcStreak(history) {
  // history: [{date: 'YYYY-MM-DD', calls: N, meetings: N}, ...]
  if (!history || history.length === 0) return 0;

  const today = todayDateStr();
  let streak = 0;
  let checkDate = new Date();

  // Walk back day by day (skip weekends)
  for (let d = 0; d < 365; d++) {
    const dateStr = dateToStr(checkDate);
    const dayOfWeek = checkDate.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    // Don't require today to count (streak is earned)
    if (dateStr === today && d === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    const dayRecord = history.find(h => h.date === dateStr);
    const qualified = dayRecord && ((dayRecord.calls || 0) >= 5 || (dayRecord.meetings || 0) >= 3);

    if (qualified) {
      streak++;
    } else {
      break;
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

function todayDateStr() {
  return dateToStr(new Date());
}

function dateToStr(d) {
  return d.toISOString().split('T')[0];
}

function getWeekStart() {
  const d = new Date();
  // Monday as week start
  const day = d.getDay();
  const diff = (day === 0) ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

// ─── POINTS AWARD ─────────────────────────────────────
function awardPoints(rep, action, metadata) {
  if (!gamData.reps[rep]) ensureRepExists(gamData, rep);
  const rd = gamData.reps[rep];
  const pts = POINTS[action] || 0;
  if (pts === 0) return;

  const prevLevel = getLevelInfo(rd.points).name;
  rd.points += pts;
  rd.weeklyPoints = (rd.weeklyPoints || 0) + pts;
  rd.level = getLevelInfo(rd.points).name;

  // Update history
  const today = todayDateStr();
  let dayRec = rd.history.find(h => h.date === today);
  if (!dayRec) {
    dayRec = { date: today, calls: 0, emails: 0, meetings: 0, submittals: 0, placements: 0, followups: 0, leads: 0 };
    rd.history.push(dayRec);
  }

  const actionMap = {
    call_logged: 'calls',
    email_sent: 'emails',
    meeting_booked: 'meetings',
    submittal_made: 'submittals',
    placement: 'placements',
    followup_completed: 'followups',
    new_lead: 'leads'
  };
  if (actionMap[action]) dayRec[actionMap[action]] = (dayRec[actionMap[action]] || 0) + 1;

  // Recalc streak
  rd.streak = calcStreak(rd.history);

  // Check badges
  const newBadges = checkBadges(rep, rd, gamData);
  newBadges.forEach(badge => {
    if (!rd.badges.includes(badge)) {
      rd.badges.push(badge);
      showAchievementToast(BADGES[badge].emoji, BADGES[badge].name, BADGES[badge].desc);
    }
  });

  // Level up?
  const newLevel = getLevelInfo(rd.points).name;
  if (newLevel !== prevLevel) {
    const lvl = getLevelInfo(rd.points);
    showAchievementToast('🎉', `Level Up! ${newLevel}`, `You've reached ${newLevel} with ${rd.points} points!`);
    // Check rainmaker badge
    if (newLevel === 'Rainmaker' && !rd.badges.includes('rainmaker')) {
      rd.badges.push('rainmaker');
      setTimeout(() => showAchievementToast('🚀', 'Rainmaker', BADGES.rainmaker.desc), 1200);
    }
  }

  saveGamData();
  renderRepStrip();
  renderChallengeBanner();
}

function checkBadges(rep, rd, data) {
  const newBadges = [];
  const today = todayDateStr();
  const dayRec = rd.history.find(h => h.date === today) || {};

  // First Blood — first meeting booked
  if (!rd.badges.includes('first_blood') && rd.history.some(h => (h.meetings || 0) >= 1)) {
    newBadges.push('first_blood');
  }

  // Dialer — 10+ calls in a single day
  if (!rd.badges.includes('dialer') && (dayRec.calls || 0) >= 10) {
    newBadges.push('dialer');
  }

  // On Fire — 5-day streak
  if (!rd.badges.includes('on_fire') && rd.streak >= 5) {
    newBadges.push('on_fire');
  }

  // Closer — first placement
  if (!rd.badges.includes('closer') && rd.history.some(h => (h.placements || 0) >= 1)) {
    newBadges.push('closer');
  }

  // Rainmaker — covered in awardPoints level-up check

  return newBadges;
}

// ─── RENDER: REP STRIP ────────────────────────────────
function renderRepStrip() {
  const rep = window.currentRep || 'mike';
  const rd = gamData.reps[rep] || { points: 0, level: 'Rookie', streak: 0, badges: [] };
  const lvl = getLevelInfo(rd.points);
  const progress = getLevelProgress(rd.points);
  const nextLvl = getNextLevel(rd.points);
  const ptsToNext = nextLvl ? `${nextLvl.min - rd.points} pts to ${nextLvl.name}` : 'MAX LEVEL';
  const badgeCount = (rd.badges || []).length;
  const badgeList = (rd.badges || []).map(b => {
    const info = BADGES[b];
    return info ? `<div class="gam-badge-tooltip-item"><span>${info.emoji}</span><span>${info.name}</span></div>` : '';
  }).join('');

  let existing = document.getElementById('gam-rep-strip');

  const html = `
    <span class="gam-level-badge" style="color:${lvl.color};background:${lvl.bg};border-color:${lvl.border}" title="${ptsToNext}">
      ${lvl.name}
    </span>
    <span class="gam-points">⚡ ${rd.points.toLocaleString()} pts</span>
    ${rd.streak > 0 ? `<span class="gam-streak">🔥 ${rd.streak}-day streak</span>` : ''}
    <div class="gam-progress-mini" title="${ptsToNext}">
      <div class="gam-progress-mini-fill" style="width:${progress}%;background:${lvl.color}"></div>
    </div>
    <div class="gam-badge-count" onclick="window.GAM.toggleBadgeTooltip(this)">
      🏅 ${badgeCount}
      <div class="gam-badge-tooltip">
        ${badgeCount === 0
          ? '<div class="gam-badge-empty">No badges yet — keep going!</div>'
          : badgeList
        }
      </div>
    </div>
  `;

  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'gam-rep-strip';
    const repInfo = document.querySelector('.rep-info');
    if (repInfo) {
      repInfo.parentNode.insertBefore(existing, repInfo);
    }
  }
  existing.innerHTML = html;
}

// ─── RENDER: CHALLENGE BANNER ─────────────────────────
function renderChallengeBanner() {
  const challenge = gamData.weeklyChallenge;
  if (!challenge) return;

  const rep = window.currentRep || 'mike';
  const rd = gamData.reps[rep] || {};

  // Calculate progress for this rep based on history
  const weekStart = getWeekStart();
  const weekHistory = (rd.history || []).filter(h => new Date(h.date) >= weekStart);

  let progress = 0;
  const metric = challenge.metric;
  const metricMap = { calls: 'calls', emails: 'emails', meetings: 'meetings', placements: 'placements' };
  const field = metricMap[metric] || 'calls';
  weekHistory.forEach(h => { progress += (h[field] || 0); });

  const pct = Math.min(100, Math.round((progress / challenge.target) * 100));

  // Determine urgency
  const now = new Date();
  const end = new Date(challenge.endsAt);
  const daysLeft = Math.ceil((end - now) / 86400000);
  const totalDays = Math.ceil((end - new Date(challenge.startsAt)) / 86400000);
  const timeElapsed = 1 - (daysLeft / totalDays);

  let status = 'on-track';
  if (pct < timeElapsed * 100 - 15) status = 'behind';
  if (daysLeft <= 2 && pct < 60) status = 'danger';

  const statusLabels = { 'on-track': '🟢 On Track', 'behind': '🟡 Behind', 'danger': '🔴 At Risk' };

  let container = document.getElementById('gam-challenge-banner');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gam-challenge-banner';
    const mainEl = document.querySelector('.main') || document.getElementById('main-content');
    if (mainEl) mainEl.parentNode.insertBefore(container, mainEl);
  }

  container.innerHTML = `
    <div class="gam-challenge ${status}">
      <div class="gam-challenge-icon">🏆</div>
      <div class="gam-challenge-body">
        <div class="gam-challenge-title">${challenge.title}: ${challenge.description}</div>
        <div class="gam-challenge-progress-row">
          <div class="gam-challenge-bar">
            <div class="gam-challenge-fill" style="width:${pct}%"></div>
          </div>
          <span class="gam-challenge-pct">${progress}/${challenge.target} (${pct}%)</span>
        </div>
      </div>
      <div class="gam-challenge-reward">+${challenge.bonusPoints} pts</div>
    </div>
  `;
}

// ─── RENDER: LEADERBOARD ─────────────────────────────
function renderLeaderboard(mode) {
  mode = mode || 'weekly';

  const REP_DISPLAY = { mike: 'Mike Dades', julia: 'Julia Dusseau', april: 'April Thompson' };

  const rows = Object.entries(gamData.reps || {})
    .map(([rep, rd]) => {
      const pts = mode === 'weekly' ? (rd.weeklyPoints || 0) : (rd.points || 0);
      return { rep, name: REP_DISPLAY[rep] || rep, pts, rd };
    })
    .sort((a, b) => b.pts - a.pts);

  const rankEmojis = ['👑', '🥈', '🥉'];
  const rowClasses = ['gam-lb-row-1', 'gam-lb-row-2', 'gam-lb-row-3'];

  const tableRows = rows.map((r, i) => {
    const lvl = getLevelInfo(r.rd.points || 0);
    const rankDisplay = i < 3 ? rankEmojis[i] : `${i + 1}`;
    const isCurrentRep = r.rep === (window.currentRep || 'mike');
    return `
      <tr class="${rowClasses[i] || ''}" ${isCurrentRep ? 'style="font-weight:600;"' : ''}>
        <td class="gam-lb-rank">${rankDisplay}</td>
        <td>
          <div class="gam-lb-rep-name">${r.name}${isCurrentRep ? ' <span style="color:#6b8099;font-size:11px;">(you)</span>' : ''}</div>
        </td>
        <td>
          <span class="gam-level-badge" style="color:${lvl.color};background:${lvl.bg};border-color:${lvl.border}">
            ${lvl.name}
          </span>
        </td>
        <td class="gam-lb-points">${r.pts.toLocaleString()}</td>
        <td class="gam-lb-streak">${(r.rd.streak || 0) > 0 ? `🔥 ${r.rd.streak}` : '—'}</td>
        <td class="gam-lb-badges">🏅 ${(r.rd.badges || []).length}</td>
      </tr>
    `;
  }).join('');

  const container = document.getElementById('gam-leaderboard');
  if (!container) return;

  container.innerHTML = `
    <div class="gam-lb-card">
      <div class="gam-lb-header">
        <div class="gam-lb-title">🏆 Leaderboard</div>
        <div class="gam-lb-toggle">
          <button class="gam-lb-toggle-btn ${mode === 'weekly' ? 'active' : ''}"
            onclick="window.GAM.toggleLeaderboard('weekly')">This Week</button>
          <button class="gam-lb-toggle-btn ${mode === 'alltime' ? 'active' : ''}"
            onclick="window.GAM.toggleLeaderboard('alltime')">All Time</button>
        </div>
      </div>
      <table class="gam-lb-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Rep</th>
            <th>Level</th>
            <th>Points</th>
            <th>Streak</th>
            <th>Badges</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length === 0
            ? `<tr><td colspan="6" class="gam-lb-empty">No data yet — start logging activity!</td></tr>`
            : tableRows
          }
        </tbody>
      </table>
    </div>
  `;
}

// ─── ACHIEVEMENT TOAST ────────────────────────────────
function showAchievementToast(emoji, title, desc) {
  toastQueue.push({ emoji, title, desc });
  if (!toastActive) processToastQueue();
}

function processToastQueue() {
  if (toastQueue.length === 0) { toastActive = false; return; }
  toastActive = true;
  const { emoji, title, desc } = toastQueue.shift();

  let container = document.getElementById('gam-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gam-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'gam-toast';
  toast.innerHTML = `
    <div class="gam-toast-inner">
      <div class="gam-toast-emoji">${emoji}</div>
      <div class="gam-toast-body">
        <div class="gam-toast-label">Achievement Unlocked</div>
        <div class="gam-toast-title">${title}</div>
        ${desc ? `<div class="gam-toast-desc">${desc}</div>` : ''}
      </div>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
    setTimeout(processToastQueue, 200);
  }, 5000);
}

// ─── HOOK INTO PIPELINE ACTIVITY ─────────────────────
function hookPipelineActivity() {
  // Intercept the existing logOutcome function
  const originalLogOutcome = window.logOutcome;
  if (originalLogOutcome) {
    window.logOutcome = function(outcome) {
      originalLogOutcome.call(this, outcome);
      const rep = window.currentRep || 'mike';
      if (rep === 'demo') return; // no gamification in demo mode

      // Map outcomes to gamification actions
      if (outcome === 'Got Reply' || outcome === 'Left Voicemail' || outcome === 'No Answer') {
        awardPoints(rep, 'call_logged');
      } else if (outcome === 'Booked Meeting') {
        awardPoints(rep, 'meeting_booked');
      } else if (outcome === 'Email Sent') {
        awardPoints(rep, 'email_sent');
      }

      // Re-render leaderboard
      renderLeaderboard(window.GAM._lbMode || 'weekly');
    };
  }
}

// ─── BADGE TOOLTIP TOGGLE ─────────────────────────────
function toggleBadgeTooltip(el) {
  const tooltip = el.querySelector('.gam-badge-tooltip');
  if (!tooltip) return;
  const isVisible = tooltip.classList.contains('visible');
  // Close all others
  document.querySelectorAll('.gam-badge-tooltip.visible').forEach(t => t.classList.remove('visible'));
  if (!isVisible) tooltip.classList.add('visible');
}

// Close badge tooltips when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.gam-badge-count')) {
    document.querySelectorAll('.gam-badge-tooltip.visible').forEach(t => t.classList.remove('visible'));
  }
});

// ─── MAIN INIT ────────────────────────────────────────
function init() {
  injectStyles();

  // Wait for the pipeline to init, then layer on gamification
  loadGamData().then(() => {
    currentRep = window.currentRep || 'mike';
    repData = gamData.reps[currentRep] || {};

    // Inject leaderboard placeholder (after main content area)
    const mainEl = document.querySelector('.main') || document.getElementById('main-content');
    if (mainEl && !document.getElementById('gam-leaderboard')) {
      const lbDiv = document.createElement('div');
      lbDiv.id = 'gam-leaderboard';
      mainEl.parentNode.insertBefore(lbDiv, mainEl.nextSibling);
    }

    renderRepStrip();
    renderChallengeBanner();
    renderLeaderboard('weekly');
    hookPipelineActivity();

    // Re-hook when rep changes (override switchRep)
    const originalSwitchRep = window.switchRep;
    if (originalSwitchRep) {
      window.switchRep = function(rep) {
        originalSwitchRep.call(this, rep);
        setTimeout(() => {
          currentRep = rep;
          window.GAM.repChanged();
        }, 200);
      };
    }

    // Observe main content for re-renders (pipeline re-renders main-content on each logOutcome)
    const observer = new MutationObserver(() => {
      // Re-render challenge banner position if main content changed
      renderChallengeBanner();
    });
    if (document.getElementById('main-content')) {
      observer.observe(document.getElementById('main-content'), { childList: true, subtree: false });
    }
  });
}

// ─── PUBLIC API ───────────────────────────────────────
window.GAM = {
  _lbMode: 'weekly',
  toggleLeaderboard: function(mode) {
    window.GAM._lbMode = mode;
    renderLeaderboard(mode);
  },
  toggleBadgeTooltip,
  repChanged: function() {
    const rep = window.currentRep || 'mike';
    ensureRepExists(gamData, rep);
    renderRepStrip();
    renderChallengeBanner();
    renderLeaderboard(window.GAM._lbMode || 'weekly');
    // Re-hook logOutcome (pipeline recreates it on rep switch sometimes)
    setTimeout(hookPipelineActivity, 300);
  },
  awardPoints,
  data: () => gamData
};

// Kick off after page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // Wait a tick for pipeline.html to set up its state (currentRep, etc.)
  setTimeout(init, 100);
}

})();
