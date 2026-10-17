/* Steadfast — purpose & relationship planner (local prototype) */

(() => {
  'use strict';

  // ─── Build marker ────────────────────────────────────────────
  // Bump this (and the ?v= query in index.html) when shipping changes.
  // Verify the browser loaded the latest file by checking this in the console.
  const APP_VERSION = '1.0.0';
  window.STEADFAST_BUILD = APP_VERSION;
  console.info(`Steadfast app.js v${APP_VERSION} loaded`);

  // ─── Constants ───────────────────────────────────────────────
  const STORAGE_KEYS = {
    events: 'steadfast-events-v2',
    people: 'steadfast-people-v2',
    goals: 'steadfast-goals-v2',
    followUps: 'steadfast-followups-v2',
    reviews: 'steadfast-reviews-v2',
    prefs: 'steadfast-prefs-v2',
  };

  const CATEGORIES = [
    { id: 'Personal', color: 'blue', label: 'Personal' },
    { id: 'Relationships', color: 'mint', label: 'Relationships' },
    { id: 'Career', color: 'purple', label: 'Career' },
    { id: 'Service', color: 'gold', label: 'Service' },
    { id: 'Spiritual', color: 'gold', label: 'Spiritual' },
  ];

  const STATUS = {
    planned: { label: 'Planned', icon: '○' },
    completed: { label: 'Completed', icon: '✓' },
    skipped: { label: 'Skipped', icon: '–' },
  };

  // Map legacy statuses from earlier versions onto the current set.
  function normalizeStatus(status) {
    if (STATUS[status]) return status;
    if (status === 'missed' || status === 'canceled') return 'skipped';
    return 'planned';
  }

  const RECURRENCE = [
    { id: 'none', label: 'Does not repeat' },
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
  ];

  const HOUR_START = 6;
  const HOUR_END = 22;
  const PX_PER_HOUR = 56;

  // ─── Seed data (never written over user data) ────────────────
  const seedEvents = [
    {
      id: 'evt-seed-1',
      title: 'Weekly planning',
      date: '2026-10-17',
      startTime: '09:00',
      endTime: '10:00',
      allDay: false,
      category: 'Personal',
      color: 'blue',
      description: 'Review goals and set the week’s intentions.',
      location: '',
      personIds: [],
      goalIds: ['goal-seed-1', 'goal-seed-2'],
      followUp: '',
      status: 'planned',
      recurrence: 'weekly',
      createdAt: '2026-10-10T12:00:00.000Z',
      updatedAt: '2026-10-10T12:00:00.000Z',
      isSeed: true,
    },
    {
      id: 'evt-seed-2',
      title: 'Lunch with Alex',
      date: '2026-10-17',
      startTime: '12:00',
      endTime: '13:00',
      allDay: false,
      category: 'Relationships',
      color: 'mint',
      description: 'Catch up and ask about outdoor plans.',
      location: 'Campus café',
      personIds: ['per-seed-1'],
      goalIds: ['goal-seed-1'],
      followUp: 'Send thank-you text',
      status: 'planned',
      recurrence: 'none',
      createdAt: '2026-10-10T12:00:00.000Z',
      updatedAt: '2026-10-10T12:00:00.000Z',
      isSeed: true,
    },
    {
      id: 'evt-seed-3',
      title: 'Service project',
      date: '2026-10-18',
      startTime: '18:30',
      endTime: '20:00',
      allDay: false,
      category: 'Service',
      color: 'gold',
      description: '',
      location: '',
      personIds: [],
      goalIds: ['goal-seed-3'],
      followUp: '',
      status: 'planned',
      recurrence: 'none',
      createdAt: '2026-10-10T12:00:00.000Z',
      updatedAt: '2026-10-10T12:00:00.000Z',
      isSeed: true,
    },
    {
      id: 'evt-seed-4',
      title: 'Portfolio work block',
      date: '2026-10-20',
      startTime: '14:00',
      endTime: '16:00',
      allDay: false,
      category: 'Career',
      color: 'purple',
      description: 'Ship one case study section.',
      location: '',
      personIds: [],
      goalIds: ['goal-seed-2'],
      followUp: '',
      status: 'planned',
      recurrence: 'none',
      createdAt: '2026-10-10T12:00:00.000Z',
      updatedAt: '2026-10-10T12:00:00.000Z',
      isSeed: true,
    },
    {
      id: 'evt-seed-5',
      title: 'Morning study',
      date: '2026-10-17',
      startTime: '07:00',
      endTime: '08:00',
      allDay: false,
      category: 'Spiritual',
      color: 'gold',
      description: '',
      location: '',
      personIds: [],
      goalIds: ['goal-seed-3'],
      followUp: '',
      status: 'completed',
      recurrence: 'daily',
      createdAt: '2026-10-10T12:00:00.000Z',
      updatedAt: '2026-10-17T08:00:00.000Z',
      isSeed: true,
    },
  ];

  const seedPeople = [
    {
      id: 'per-seed-1',
      name: 'Alex Chen',
      type: 'Friend',
      detail: 'Met at the career fair',
      phone: '555-0101',
      email: 'alex@example.com',
      note: 'Interested in AI and outdoor activities.',
      isSeed: true,
    },
    {
      id: 'per-seed-2',
      name: 'Dr. Maya Patel',
      type: 'Professor',
      detail: 'Math 425',
      phone: '',
      email: 'maya.patel@example.edu',
      note: 'Ask about research opportunities.',
      isSeed: true,
    },
    {
      id: 'per-seed-3',
      name: 'Summit Labs',
      type: 'Business',
      detail: 'Potential employer',
      phone: '',
      email: 'hello@summitlabs.example',
      note: 'Follow up after sending portfolio.',
      isSeed: true,
    },
  ];

  const seedGoals = [
    {
      id: 'goal-seed-1',
      title: 'Strengthen meaningful relationships',
      reason: 'Stay connected with people who matter.',
      progress: 3,
      target: 5,
      period: 'This week',
      color: 'mint',
      status: 'active',
      isSeed: true,
    },
    {
      id: 'goal-seed-2',
      title: 'Make steady career progress',
      reason: 'Build skills and opportunities each week.',
      progress: 2,
      target: 4,
      period: 'This week',
      color: 'purple',
      status: 'active',
      isSeed: true,
    },
    {
      id: 'goal-seed-3',
      title: 'Keep a consistent spiritual routine',
      reason: 'Protect time for what grounds me.',
      progress: 4,
      target: 7,
      period: 'This week',
      color: 'gold',
      status: 'active',
      isSeed: true,
    },
  ];

  const seedFollowUps = [
    {
      id: 'fu-seed-1',
      description: 'Text Alex about weekend hike',
      dueDate: '2026-10-17',
      personId: 'per-seed-1',
      eventId: 'evt-seed-2',
      goalId: 'goal-seed-1',
      priority: 'normal',
      status: 'open',
      isSeed: true,
    },
    {
      id: 'fu-seed-2',
      description: 'Email Dr. Patel about office hours',
      dueDate: '2026-10-19',
      personId: 'per-seed-2',
      eventId: null,
      goalId: 'goal-seed-2',
      priority: 'high',
      status: 'open',
      isSeed: true,
    },
  ];

  // ─── Utilities ───────────────────────────────────────────────
  const pad = (n) => String(n).padStart(2, '0');

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function parseISODate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function toISODate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function addDays(iso, n) {
    const d = parseISODate(iso);
    d.setDate(d.getDate() + n);
    return toISODate(d);
  }

  function startOfWeek(iso) {
    const d = parseISODate(iso);
    d.setDate(d.getDate() - d.getDay());
    return toISODate(d);
  }

  function formatLongDate(iso) {
    return parseISODate(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatShortDate(iso) {
    return parseISODate(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
  }

  function formatWeekday(iso) {
    return parseISODate(iso).toLocaleDateString('en-US', { weekday: 'long' });
  }

  function formatTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = ((h + 11) % 12) + 1;
    return `${hour}:${pad(m)} ${ampm}`;
  }

  function formatTimeRange(event) {
    if (event.allDay) return 'All day';
    if (!event.startTime) return '';
    const start = formatTime(event.startTime);
    const end = event.endTime ? formatTime(event.endTime) : '';
    return end ? `${start} – ${end}` : start;
  }

  function timeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function categoryColor(category) {
    return CATEGORIES.find((c) => c.id === category)?.color || 'blue';
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const icon = (name) =>
    ({
      calendar: '▦',
      users: '♧',
      target: '◎',
      plus: '+',
      left: '‹',
      right: '›',
      check: '✓',
      close: '×',
      phone: '⌕',
      mail: '✉',
      missed: '!',
      skip: '–',
      repeat: '⇄',
      location: '⌖',
      note: '✎',
      follow: '→',
      review: '◷',
      more: '···',
      day: '☰',
      week: '▤',
      month: '▦',
    }[name] || '•');

  // ─── Safe persistence ────────────────────────────────────────
  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) || (parsed && typeof parsed === 'object') ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('Steadfast: could not save', key, err);
    }
  }

  function migrateLegacyEvents(list, peopleList) {
    if (!Array.isArray(list)) return [];
    return list.map((e) => {
      if (e.startTime || e.allDay != null) return normalizeEvent(e);
      return normalizeEvent({
        id: e.id != null ? String(e.id) : uid('evt'),
        title: e.title || 'Untitled',
        date: e.date,
        startTime: e.time || '09:00',
        endTime: e.time ? addHour(e.time) : '10:00',
        allDay: false,
        category: e.category || 'Personal',
        color: e.color === 'green' ? 'mint' : e.color || categoryColor(e.category),
        description: '',
        location: '',
        personIds: e.person
          ? (peopleList || [])
              .filter((p) => p.name === e.person)
              .map((p) => p.id)
          : [],
        goalIds: [],
        followUp: '',
        status: 'planned',
        recurrence: 'none',
        isSeed: false,
      });
    });
  }

  function addHour(time) {
    const mins = timeToMinutes(time) + 60;
    return `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;
  }

  function normalizeEvent(e) {
    const category = e.category || 'Personal';
    return {
      id: String(e.id || uid('evt')),
      title: e.title || 'Untitled',
      date: e.date || todayISO(),
      startTime: e.allDay ? null : e.startTime || e.time || '09:00',
      endTime: e.allDay ? null : e.endTime || addHour(e.startTime || e.time || '09:00'),
      allDay: !!e.allDay,
      category,
      color: e.color === 'green' ? 'mint' : e.color || categoryColor(category),
      description: e.description || '',
      location: e.location || '',
      personIds: Array.isArray(e.personIds) ? e.personIds.map(String) : [],
      goalIds: Array.isArray(e.goalIds) ? e.goalIds.map(String) : [],
      followUp: e.followUp || '',
      status: normalizeStatus(e.status),
      recurrence: e.recurrence || 'none',
      createdAt: e.createdAt || new Date().toISOString(),
      updatedAt: e.updatedAt || new Date().toISOString(),
      isSeed: !!e.isSeed,
    };
  }

  function normalizePerson(p) {
    return {
      id: String(p.id || uid('per')),
      name: p.name || 'Unnamed',
      type: p.type || 'Friend',
      detail: p.detail || '',
      phone: p.phone || '',
      email: p.email || '',
      note: p.note || '',
      isSeed: !!p.isSeed,
    };
  }

  function normalizeGoal(g) {
    return {
      id: String(g.id || uid('goal')),
      title: g.title || 'Untitled goal',
      reason: g.reason || '',
      progress: Number(g.progress) || 0,
      target: Number(g.target) || 1,
      period: g.period || 'This week',
      color: g.color === 'green' ? 'mint' : g.color || 'blue',
      status: g.status || 'active',
      isSeed: !!g.isSeed,
    };
  }

  function normalizeFollowUp(f) {
    return {
      id: String(f.id || uid('fu')),
      description: f.description || '',
      dueDate: f.dueDate || todayISO(),
      personId: f.personId || null,
      eventId: f.eventId || null,
      goalId: f.goalId || null,
      priority: f.priority || 'normal',
      status: f.status || 'open',
      isSeed: !!f.isSeed,
    };
  }

  // Load: prefer v2; fall back to legacy keys without overwriting user data
  function loadCollection(v2Key, legacyKey, seed, normalizer, migrator) {
    const v2 = loadJSON(v2Key, null);
    if (Array.isArray(v2)) return v2.map(normalizer);

    const legacy = loadJSON(legacyKey, null);
    if (Array.isArray(legacy) && legacy.length) {
      const migrated = (migrator ? migrator(legacy) : legacy.map(normalizer));
      saveJSON(v2Key, migrated);
      return migrated;
    }

    return seed.map(normalizer);
  }

  let people = loadCollection(STORAGE_KEYS.people, 'steadfast-people', seedPeople, normalizePerson);
  let goals = loadCollection(STORAGE_KEYS.goals, 'steadfast-goals', seedGoals, normalizeGoal);
  let followUps = loadCollection(
    STORAGE_KEYS.followUps,
    null,
    seedFollowUps,
    normalizeFollowUp
  );
  let events = (() => {
    const v2 = loadJSON(STORAGE_KEYS.events, null);
    if (Array.isArray(v2)) return v2.map(normalizeEvent);
    const legacy = loadJSON('steadfast-events', null);
    if (Array.isArray(legacy) && legacy.length) {
      const migrated = migrateLegacyEvents(legacy, people);
      saveJSON(STORAGE_KEYS.events, migrated);
      return migrated;
    }
    return seedEvents.map(normalizeEvent);
  })();
  let reviews = loadJSON(STORAGE_KEYS.reviews, []);

  const prefs = {
    view: 'month',
    ...loadJSON(STORAGE_KEYS.prefs, {}),
  };

  function persistAll() {
    saveJSON(STORAGE_KEYS.events, events);
    saveJSON(STORAGE_KEYS.people, people);
    saveJSON(STORAGE_KEYS.goals, goals);
    saveJSON(STORAGE_KEYS.followUps, followUps);
    saveJSON(STORAGE_KEYS.reviews, reviews);
    saveJSON(STORAGE_KEYS.prefs, prefs);
  }

  // ─── App state ───────────────────────────────────────────────
  let activeTab = 'Planner';
  let calendarView = prefs.view === 'week' || prefs.view === 'day' ? prefs.view : 'month';
  let selectedDate = todayISO();
  let cursor = parseISODate(selectedDate);
  let month = cursor.getMonth();
  let year = cursor.getFullYear();
  let openEventId = null;
  let mobileNavOpen = false;

  // Sync cursor when selectedDate changes
  function setSelectedDate(iso) {
    selectedDate = iso;
    const d = parseISODate(iso);
    month = d.getMonth();
    year = d.getFullYear();
  }

  function setCalendarView(view) {
    calendarView = view;
    prefs.view = view;
    saveJSON(STORAGE_KEYS.prefs, prefs);
  }

  function goToday() {
    setSelectedDate(todayISO());
    render();
  }

  function navigate(delta) {
    if (calendarView === 'month') {
      const next = new Date(year, month + delta, 1);
      month = next.getMonth();
      year = next.getFullYear();
      const day = Math.min(parseISODate(selectedDate).getDate(), new Date(year, month + 1, 0).getDate());
      selectedDate = `${year}-${pad(month + 1)}-${pad(day)}`;
    } else if (calendarView === 'week') {
      setSelectedDate(addDays(selectedDate, delta * 7));
    } else {
      setSelectedDate(addDays(selectedDate, delta));
    }
    render();
  }

  // ─── Event queries ───────────────────────────────────────────
  function eventOccursOn(event, iso) {
    if (event.date === iso) return true;
    if (!event.recurrence || event.recurrence === 'none') return false;
    const start = parseISODate(event.date);
    const target = parseISODate(iso);
    if (target < start) return false;
    if (event.recurrence === 'daily') return true;
    if (event.recurrence === 'weekly') return start.getDay() === target.getDay();
    if (event.recurrence === 'monthly') return start.getDate() === target.getDate();
    return false;
  }

  function eventsForDate(iso) {
    return events
      .filter((e) => eventOccursOn(e, iso))
      .map((e) => ({ ...e, occurrenceDate: iso }))
      .sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
  }

  function peopleForDate(iso) {
    const ids = new Set();
    eventsForDate(iso).forEach((e) => e.personIds.forEach((id) => ids.add(id)));
    return people.filter((p) => ids.has(p.id));
  }

  function goalsForDate(iso) {
    const ids = new Set();
    eventsForDate(iso).forEach((e) => e.goalIds.forEach((id) => ids.add(id)));
    return goals.filter((g) => ids.has(g.id));
  }

  function followUpsForDate(iso) {
    return followUps.filter((f) => f.dueDate === iso && f.status === 'open');
  }

  function getPerson(id) {
    return people.find((p) => p.id === id);
  }

  function getGoal(id) {
    return goals.find((g) => g.id === id);
  }

  function getEvent(id) {
    return events.find((e) => e.id === id);
  }

  // Layout overlapping timed events for day/week columns
  function layoutTimedEvents(dayEvents) {
    const timed = dayEvents.filter((e) => !e.allDay && e.startTime);
    const columns = [];
    const placed = timed.map((event) => {
      const start = timeToMinutes(event.startTime);
      const end = Math.max(start + 30, timeToMinutes(event.endTime || addHour(event.startTime)));
      let col = 0;
      while (columns[col]?.some((r) => start < r.end && end > r.start)) col += 1;
      if (!columns[col]) columns[col] = [];
      columns[col].push({ start, end });
      return { event, start, end, col };
    });
    const totalCols = Math.max(1, columns.length);
    return placed.map((p) => ({
      ...p,
      widthPct: 100 / totalCols,
      leftPct: (p.col * 100) / totalCols,
    }));
  }

  // ─── Render shell ────────────────────────────────────────────
  function render() {
    const root = document.querySelector('#root');
    const todayLabel = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).toUpperCase();

    root.innerHTML = `
      <div class="app-shell ${mobileNavOpen ? 'nav-open' : ''}">
        <div class="nav-scrim" data-action="close-nav" hidden${!mobileNavOpen ? '' : ''}></div>
        <aside class="sidebar" aria-label="Primary">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true">S</div>
            <div>
              <strong>steadfast</strong>
              <span>Live with purpose</span>
            </div>
          </div>
          <nav>
            ${[['Planner', 'calendar'], ['People', 'users'], ['Goals', 'target']]
              .map(
                ([label, i]) => `
              <button type="button" class="nav-item ${activeTab === label ? 'active' : ''}" data-tab="${label}"${activeTab === label ? ' aria-current="page"' : ''}>
                <span aria-hidden="true">${icon(i)}</span>${label}
              </button>`
              )
              .join('')}
          </nav>
          <div class="sidebar-bottom">
            <div class="mini-card">
              <span class="eyebrow">THIS WEEK</span>
              <strong>Make room for what matters.</strong>
              <div class="progress" role="progressbar" aria-valuenow="${weekProgress()}" aria-valuemin="0" aria-valuemax="100">
                <i style="width:${weekProgress()}%"></i>
              </div>
              <small>${weekProgress()}% of planned intentions completed</small>
            </div>
            <div class="profile">
              <span class="avatar">D</span>
              <span><strong>Dallas</strong><small>Personal space</small></span>
            </div>
          </div>
        </aside>
        <main class="main-content">
          <header class="topbar">
            <button type="button" class="mobile-menu" data-action="toggle-nav" aria-label="Open menu">☰</button>
            <div>
              <span class="eyebrow">${todayLabel}</span>
              <h1>${activeTab === 'Planner' ? 'Your week, intentionally.' : activeTab}</h1>
            </div>
            <button type="button" class="today-button" id="today">Today</button>
          </header>
          ${activeTab === 'Planner' ? plannerView() : activeTab === 'People' ? peopleView() : goalsView()}
        </main>
        ${activeTab === 'Planner' ? `<button type="button" class="fab" id="fab-add" aria-label="Add to plan">${icon('plus')}</button>` : ''}
      </div>
    `;

    bindShellEvents();
  }

  function weekProgress() {
    const start = startOfWeek(todayISO());
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const weekEvents = days.flatMap((d) => eventsForDate(d));
    if (!weekEvents.length) return 0;
    const done = weekEvents.filter((e) => e.status === 'completed').length;
    return Math.round((done / weekEvents.length) * 100);
  }

  function bindShellEvents() {
    document.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.onclick = () => {
        activeTab = btn.dataset.tab;
        mobileNavOpen = false;
        render();
      };
    });
    document.querySelector('#today')?.addEventListener('click', goToday);
    document.querySelector('[data-action="toggle-nav"]')?.addEventListener('click', () => {
      mobileNavOpen = !mobileNavOpen;
      render();
    });
    document.querySelector('[data-action="close-nav"]')?.addEventListener('click', () => {
      mobileNavOpen = false;
      render();
    });
    document.querySelector('#fab-add')?.addEventListener('click', () => openEventForm());
    document.querySelectorAll('#add-event, #empty-add, [data-add-event]').forEach((btn) => {
      btn.addEventListener('click', () => openEventForm());
    });
    document.querySelectorAll('#weekly-review, #weekly-review-btn, [data-action="weekly-review"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openWeeklyReview();
      });
    });
    document.querySelectorAll('#add-person').forEach((btn) => {
      btn.addEventListener('click', () => openPersonForm());
    });
    document.querySelectorAll('#add-goal').forEach((btn) => {
      btn.addEventListener('click', () => openGoalForm());
    });

    // Calendar controls
    document.querySelectorAll('[data-view]').forEach((btn) => {
      btn.onclick = () => {
        setCalendarView(btn.dataset.view);
        render();
      };
    });
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.onclick = () => navigate(Number(btn.dataset.nav));
    });
    document.querySelectorAll('[data-date]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const date = btn.dataset.date;
        if (!date) return;
        setSelectedDate(date);
        if (btn.dataset.openDay === '1') setCalendarView('day');
        render();
      };
    });
    document.querySelectorAll('[data-event-id]').forEach((el) => {
      el.onclick = (e) => {
        e.stopPropagation();
        openEventDetail(el.dataset.eventId);
      };
      el.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEventDetail(el.dataset.eventId);
        }
      };
    });
    document.querySelectorAll('[data-status-quick]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        setEventStatus(btn.dataset.statusQuick, btn.dataset.statusValue);
      };
    });
    document.querySelectorAll('[data-open-person]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        activeTab = 'People';
        render();
      };
    });
    document.querySelectorAll('[data-open-goal]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        activeTab = 'Goals';
        render();
      };
    });
    document.querySelectorAll('[data-complete-fu]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        completeFollowUp(btn.dataset.completeFu);
      };
    });

    // Keyboard: arrow keys navigate days when focus is in calendar
    const cal = document.querySelector('.calendar-panel');
    if (cal && !cal.dataset.keyBound) {
      cal.dataset.keyBound = '1';
      cal.tabIndex = 0;
      cal.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          e.preventDefault();
          const delta =
            e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' ? -7 : 7;
          setSelectedDate(addDays(selectedDate, delta));
          render();
          document.querySelector('.calendar-panel')?.focus();
        }
      });
    }
  }

  // ─── Planner ─────────────────────────────────────────────────
  function plannerView() {
    const monthName = new Date(year, month, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    const heading =
      calendarView === 'month'
        ? monthName
        : calendarView === 'week'
          ? `Week of ${formatShortDate(startOfWeek(selectedDate))}`
          : formatLongDate(selectedDate);

    return `
      <section class="planner-layout">
        <div class="calendar-panel panel" aria-label="Calendar">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">PLANNER</span>
              <h2>${escapeHtml(heading)}</h2>
            </div>
            <div class="calendar-toolbar">
              <div class="view-switch" role="tablist" aria-label="Calendar view">
                ${['month', 'week', 'day']
                  .map(
                    (v) => `
                  <button type="button" role="tab" class="${calendarView === v ? 'active' : ''}" data-view="${v}" aria-selected="${calendarView === v}">
                    ${v[0].toUpperCase() + v.slice(1)}
                  </button>`
                  )
                  .join('')}
              </div>
              <div class="month-controls">
                <button type="button" data-nav="-1" aria-label="Previous ${calendarView}">${icon('left')}</button>
                <button type="button" data-nav="1" aria-label="Next ${calendarView}">${icon('right')}</button>
              </div>
              <button type="button" class="primary-button toolbar-add" data-add-event>${icon('plus')} Add activity</button>
            </div>
          </div>
          ${calendarView === 'month' ? monthView() : calendarView === 'week' ? weekView() : dayView()}
        </div>
        ${dayPanel()}
      </section>
    `;
  }

  function monthView() {
    const first = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const days = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
    const today = todayISO();

    return `
      <div class="weekdays" aria-hidden="true">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        .map((d) => `<span>${d}</span>`)
        .join('')}</div>
      <div class="calendar-grid" role="grid" aria-label="${new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}">
        ${days
          .map((day) => {
            if (!day) return `<div class="calendar-day blank" role="gridcell"></div>`;
            const date = `${year}-${pad(month + 1)}-${pad(day)}`;
            const dayEvents = eventsForDate(date);
            const visible = dayEvents.slice(0, 3);
            const more = dayEvents.length - visible.length;
            return `
              <button type="button" class="calendar-day ${selectedDate === date ? 'selected' : ''} ${date === today ? 'current' : ''}" data-date="${date}" role="gridcell" aria-label="${formatLongDate(date)}${dayEvents.length ? `, ${dayEvents.length} plans` : ''}" aria-pressed="${selectedDate === date}">
                <span class="day-number">${day}</span>
                <div class="day-event-chips">
                  ${visible
                    .map(
                      (e) => `
                    <span class="event-chip ${e.color} status-${e.status}" title="${escapeHtml(e.title)}">
                      <i class="chip-bar"></i>${escapeHtml(e.title)}
                    </span>`
                    )
                    .join('')}
                  ${more > 0 ? `<span class="event-more">+${more} more</span>` : ''}
                </div>
              </button>`;
          })
          .join('')}
      </div>
    `;
  }

  function weekStrip(centerIso) {
    const start = startOfWeek(centerIso);
    const today = todayISO();
    return `
      <div class="date-strip" role="tablist" aria-label="Days of the week">
        ${Array.from({ length: 7 }, (_, i) => {
          const iso = addDays(start, i);
          const d = parseISODate(iso);
          const label = d.toLocaleDateString('en-US', { weekday: 'narrow' });
          return `
            <button type="button" class="strip-day ${selectedDate === iso ? 'selected' : ''} ${iso === today ? 'current' : ''}" data-date="${iso}" aria-selected="${selectedDate === iso}">
              <span class="strip-label">${label}</span>
              <span class="strip-num">${d.getDate()}</span>
            </button>`;
        }).join('')}
      </div>
    `;
  }

  function weekView() {
    const start = startOfWeek(selectedDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const today = todayISO();
    const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

    return `
      ${weekStrip(selectedDate)}
      <div class="week-scroll">
        <div class="all-day-row">
          <div class="time-gutter-label">All day</div>
          <div class="all-day-cols">
            ${days
              .map((iso) => {
                const allDay = eventsForDate(iso).filter((e) => e.allDay);
                return `
                  <div class="all-day-col ${iso === today ? 'is-today' : ''} ${iso === selectedDate ? 'is-selected' : ''}" data-date="${iso}">
                    ${allDay
                      .map(
                        (e) => `
                      <button type="button" class="week-allday ${e.color}" data-event-id="${e.id}">${escapeHtml(e.title)}</button>`
                      )
                      .join('')}
                  </div>`;
              })
              .join('')}
          </div>
        </div>
        <div class="week-grid" style="--hours:${hours.length}; --px-hour:${PX_PER_HOUR}px">
          <div class="time-gutter">
            ${hours.map((h) => `<div class="hour-label">${formatHourLabel(h)}</div>`).join('')}
          </div>
          <div class="week-columns">
            ${days
              .map((iso) => {
                const dayEvents = eventsForDate(iso).filter((e) => !e.allDay);
                const laid = layoutTimedEvents(dayEvents);
                return `
                  <div class="week-col ${iso === today ? 'is-today' : ''} ${iso === selectedDate ? 'is-selected' : ''}" data-date="${iso}" data-open-day="1">
                    ${hours.map(() => `<div class="hour-line"></div>`).join('')}
                    ${laid
                      .map(({ event, start, end, widthPct, leftPct }) => {
                        const top = ((start - HOUR_START * 60) / 60) * PX_PER_HOUR;
                        const height = Math.max(22, ((end - start) / 60) * PX_PER_HOUR - 2);
                        return `
                          <button type="button" class="timed-event ${event.color} status-${event.status}" data-event-id="${event.id}"
                            style="top:${top}px;height:${height}px;left:calc(${leftPct}% + 2px);width:calc(${widthPct}% - 4px)">
                            <span class="te-title">${escapeHtml(event.title)}</span>
                            ${height > 36 ? `<span class="te-time">${formatTime(event.startTime)}</span>` : ''}
                            <span class="status-badge" aria-label="${STATUS[event.status].label}">${STATUS[event.status].icon}</span>
                          </button>`;
                      })
                      .join('')}
                  </div>`;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  function formatHourLabel(h) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = ((h + 11) % 12) + 1;
    return `${hour} ${ampm}`;
  }

  function dayView() {
    const dayEvents = eventsForDate(selectedDate);
    const allDay = dayEvents.filter((e) => e.allDay);
    const timed = dayEvents.filter((e) => !e.allDay);
    const laid = layoutTimedEvents(timed);
    const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

    return `
      ${weekStrip(selectedDate)}
      <p class="day-view-title">${escapeHtml(formatLongDate(selectedDate))}</p>
      ${
        allDay.length
          ? `<div class="day-allday">
              ${allDay
                .map(
                  (e) => `
                <button type="button" class="day-allday-chip ${e.color} status-${e.status}" data-event-id="${e.id}">
                  <i class="chip-bar"></i>
                  <strong>${escapeHtml(e.title)}</strong>
                  <span class="status-badge">${STATUS[e.status].icon}</span>
                </button>`
                )
                .join('')}
            </div>`
          : ''
      }
      <div class="day-timeline" style="--hours:${hours.length}; --px-hour:${PX_PER_HOUR}px">
        <div class="time-gutter">
          ${hours.map((h) => `<div class="hour-label">${formatHourLabel(h)}</div>`).join('')}
        </div>
        <div class="day-track">
          ${hours.map(() => `<div class="hour-line"></div>`).join('')}
          ${
            !timed.length
              ? `<div class="day-empty-hint"><p>No timed plans yet.</p><button type="button" class="text-link" id="empty-add">Add to plan</button></div>`
              : ''
          }
          ${laid
            .map(({ event, start, end, widthPct, leftPct }) => {
              const top = ((start - HOUR_START * 60) / 60) * PX_PER_HOUR;
              const height = Math.max(28, ((end - start) / 60) * PX_PER_HOUR - 3);
              const peopleIcons = event.personIds.length
                ? `<span class="te-people" aria-label="${event.personIds.length} people">${icon('users')}</span>`
                : '';
              return `
                <button type="button" class="timed-event day-block ${event.color} status-${event.status}" data-event-id="${event.id}"
                  style="top:${top}px;height:${height}px;left:calc(${leftPct}% + 4px);width:calc(${widthPct}% - 8px)">
                  <span class="te-row">
                    ${peopleIcons}
                    <span class="te-title">${escapeHtml(event.title)}</span>
                    ${event.recurrence !== 'none' ? `<span class="te-repeat" title="Repeats">${icon('repeat')}</span>` : ''}
                    <span class="status-badge" aria-label="${STATUS[event.status].label}">${STATUS[event.status].icon}</span>
                  </span>
                  <span class="te-time">${formatTimeRange(event)}</span>
                  ${
                    event.personIds.length && height > 50
                      ? `<span class="te-meta">${event.personIds
                          .map((id) => getPerson(id)?.name)
                          .filter(Boolean)
                          .join(', ')}</span>`
                      : ''
                  }
                </button>`;
            })
            .join('')}
        </div>
      </div>
      <div class="day-view-actions">
        <button type="button" class="primary-button" id="add-event">${icon('plus')} Add to plan</button>
      </div>
    `;
  }

  // ─── Day panel ───────────────────────────────────────────────
  function dayPanel() {
    const selectedEvents = eventsForDate(selectedDate);
    const dayPeople = peopleForDate(selectedDate);
    const dayGoals = goalsForDate(selectedDate);
    const dayFus = followUpsForDate(selectedDate);

    return `
      <aside class="day-panel" aria-label="Day plan for ${formatLongDate(selectedDate)}">
        <div class="day-heading">
          <div>
            <span class="eyebrow">${escapeHtml(formatWeekday(selectedDate).toUpperCase())}</span>
            <h2>${escapeHtml(formatShortDate(selectedDate))}</h2>
          </div>
          <button type="button" class="icon-button" id="weekly-review" title="Weekly review" aria-label="Weekly review">${icon('review')}</button>
        </div>
        <div class="day-actions">
          <button type="button" class="primary-button" id="add-event">${icon('plus')} Add to plan</button>
          <button type="button" class="secondary-button" id="weekly-review-btn" data-action="weekly-review">Weekly review</button>
        </div>
        <div class="section-label">TODAY’S PLAN <span>${selectedEvents.length}</span></div>
        <div class="event-list">
          ${
            selectedEvents.length
              ? selectedEvents.map((e) => dayEventCard(e)).join('')
              : `<div class="empty-state">Nothing planned yet.<br /><button type="button" id="empty-add">Add your first intention</button></div>`
          }
        </div>
        ${
          dayPeople.length
            ? `
          <div class="section-label goals-label">PEOPLE</div>
          <div class="panel-chips">
            ${dayPeople
              .map(
                (p) => `
              <button type="button" class="panel-chip" data-open-person="${p.id}">
                <span class="avatar tiny">${escapeHtml(p.name[0])}</span>${escapeHtml(p.name)}
              </button>`
              )
              .join('')}
          </div>`
            : ''
        }
        ${
          dayGoals.length
            ? `
          <div class="section-label goals-label">GOALS</div>
          <div class="goal-list">
            ${dayGoals
              .map(
                (g) => `
              <button type="button" class="goal-row linkish" data-open-goal="${g.id}">
                <span class="goal-icon ${g.color}">${icon('target')}</span>
                <div>
                  <strong>${escapeHtml(g.title)}</strong>
                  <small>${g.progress} of ${g.target} · ${escapeHtml(g.period)}</small>
                </div>
                <span aria-hidden="true">›</span>
              </button>`
              )
              .join('')}
          </div>`
            : `
          <div class="section-label goals-label">ACTIVE GOALS</div>
          <div class="goal-list">
            ${goals
              .filter((g) => g.status === 'active')
              .slice(0, 2)
              .map(
                (g) => `
              <button type="button" class="goal-row linkish" data-open-goal="${g.id}">
                <span class="goal-icon ${g.color}">${icon('target')}</span>
                <div>
                  <strong>${escapeHtml(g.title)}</strong>
                  <small>${g.progress} of ${g.target} · ${escapeHtml(g.period)}</small>
                </div>
                <span aria-hidden="true">›</span>
              </button>`
              )
              .join('')}
          </div>`
        }
        ${
          dayFus.length
            ? `
          <div class="section-label goals-label">FOLLOW-UPS DUE</div>
          <div class="fu-list">
            ${dayFus
              .map(
                (f) => `
              <div class="fu-row ${f.priority === 'high' ? 'high' : ''}">
                <div>
                  <strong>${escapeHtml(f.description)}</strong>
                  <small>${f.personId ? escapeHtml(getPerson(f.personId)?.name || '') : 'General'}</small>
                </div>
                <button type="button" class="check-button" data-complete-fu="${f.id}" aria-label="Complete follow-up">${icon('check')}</button>
              </div>`
              )
              .join('')}
          </div>`
            : ''
        }
      </aside>
    `;
  }

  function dayEventCard(event) {
    const peopleNames = event.personIds
      .map((id) => getPerson(id)?.name)
      .filter(Boolean)
      .join(', ');
    return `
      <div class="event-card ${event.color} status-${event.status}" data-event-id="${event.id}" role="button" tabindex="0">
        <div class="event-time">${event.allDay ? 'All day' : formatTime(event.startTime)}</div>
        <div class="event-main">
          <strong>${escapeHtml(event.title)}</strong>
          <span>${escapeHtml(event.category)}${peopleNames ? ` · ${escapeHtml(peopleNames)}` : ''}</span>
        </div>
        <div class="event-card-actions">
          ${
            event.status === 'planned'
              ? `
            <button type="button" class="check-button done" data-status-quick="${event.id}" data-status-value="completed" aria-label="Mark completed" title="Complete">${icon('check')}</button>
            <button type="button" class="check-button skip" data-status-quick="${event.id}" data-status-value="skipped" aria-label="Mark skipped" title="Skip">${icon('skip')}</button>`
              : `<span class="status-badge static" aria-label="${STATUS[event.status].label}">${STATUS[event.status].icon}</span>`
          }
        </div>
      </div>
    `;
  }

  // ─── People & Goals views ────────────────────────────────────
  function peopleView() {
    return `
      <section class="content-section">
        <div class="section-top">
          <div>
            <span class="eyebrow">PEOPLE</span>
            <h2>Keep people from slipping through the cracks.</h2>
          </div>
          <button type="button" class="primary-button" id="add-person">${icon('plus')} Add person</button>
        </div>
        ${
          people.length
            ? `<div class="people-grid">${people.map(personCard).join('')}</div>`
            : `<div class="empty-panel"><p>No people yet.</p><button type="button" class="primary-button" id="add-person">${icon('plus')} Add person</button></div>`
        }
      </section>
    `;
  }

  function personCard(p) {
    return `
      <article class="person-card">
        <div class="person-card-top">
          <span class="avatar large">${escapeHtml(p.name[0])}</span>
          <span class="relationship-tag">${escapeHtml(p.type)}</span>
        </div>
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.detail || '—')}</p>
        <div class="person-note">${escapeHtml(p.note || 'No note yet.')}</div>
        <div class="contact-actions">
          ${p.phone ? `<a href="tel:${escapeHtml(p.phone)}" aria-label="Call ${escapeHtml(p.name)}">${icon('phone')}</a>` : ''}
          ${p.email ? `<a href="mailto:${escapeHtml(p.email)}" aria-label="Email ${escapeHtml(p.name)}">${icon('mail')}</a>` : ''}
        </div>
      </article>
    `;
  }

  function goalsView() {
    return `
      <section class="content-section">
        <div class="section-top">
          <div>
            <span class="eyebrow">GOALS</span>
            <h2>Choose what your week is about.</h2>
          </div>
          <button type="button" class="primary-button" id="add-goal">${icon('plus')} Add goal</button>
        </div>
        ${
          goals.length
            ? `<div class="goals-grid">${goals.map(goalCard).join('')}</div>`
            : `<div class="empty-panel"><p>No goals yet.</p><button type="button" class="primary-button" id="add-goal">${icon('plus')} Add goal</button></div>`
        }
      </section>
    `;
  }

  function goalCard(g) {
    const pct = Math.min(100, Math.round((g.progress / Math.max(1, g.target)) * 100));
    return `
      <article class="full-goal-card">
        <div class="goal-icon ${g.color}">${icon('target')}</div>
        <div class="goal-copy">
          <span class="eyebrow">${escapeHtml(g.period)}</span>
          <h3>${escapeHtml(g.title)}</h3>
          ${g.reason ? `<p class="goal-reason">${escapeHtml(g.reason)}</p>` : ''}
          <div class="progress large-progress"><i class="${g.color}" style="width:${pct}%"></i></div>
          <small>${g.progress} of ${g.target} actions completed</small>
        </div>
      </article>
    `;
  }

  // ─── Event detail & form ─────────────────────────────────────
  function openEventDetail(id) {
    const event = getEvent(id);
    if (!event) return;
    openEventId = id;

    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'event-detail-title');

    const peopleList = event.personIds.map((pid) => getPerson(pid)).filter(Boolean);
    const goalList = event.goalIds.map((gid) => getGoal(gid)).filter(Boolean);

    overlay.innerHTML = `
      <div class="modal detail-modal">
        <div class="modal-heading">
          <div>
            <span class="eyebrow">${escapeHtml(event.category).toUpperCase()} · ${STATUS[event.status].label.toUpperCase()}</span>
            <h2 id="event-detail-title">${escapeHtml(event.title)}</h2>
          </div>
          <button type="button" class="icon-button" data-close aria-label="Close">${icon('close')}</button>
        </div>
        <dl class="detail-grid">
          <div><dt>When</dt><dd>${escapeHtml(formatLongDate(event.date))}<br />${escapeHtml(formatTimeRange(event))}</dd></div>
          ${event.location ? `<div><dt>Where</dt><dd>${escapeHtml(event.location)}</dd></div>` : ''}
          ${event.description ? `<div class="full"><dt>Notes</dt><dd>${escapeHtml(event.description)}</dd></div>` : ''}
          ${event.followUp ? `<div class="full"><dt>Follow-up</dt><dd>${escapeHtml(event.followUp)}</dd></div>` : ''}
          ${event.recurrence !== 'none' ? `<div><dt>Repeats</dt><dd>${escapeHtml(RECURRENCE.find((r) => r.id === event.recurrence)?.label || event.recurrence)}</dd></div>` : ''}
        </dl>
        ${
          peopleList.length
            ? `<div class="detail-section"><span class="section-label light">PEOPLE</span><div class="panel-chips light">${peopleList
                .map(
                  (p) =>
                    `<button type="button" class="panel-chip light" data-goto-person="${p.id}"><span class="avatar tiny">${escapeHtml(p.name[0])}</span>${escapeHtml(p.name)}</button>`
                )
                .join('')}</div></div>`
            : ''
        }
        ${
          goalList.length
            ? `<div class="detail-section"><span class="section-label light">GOALS</span><div class="panel-chips light">${goalList
                .map(
                  (g) =>
                    `<button type="button" class="panel-chip light" data-goto-goal="${g.id}">${escapeHtml(g.title)}</button>`
                )
                .join('')}</div></div>`
            : ''
        }
        <div class="detail-actions">
          ${
            event.status === 'planned'
              ? `
            <button type="button" class="primary-button" data-set-status="completed">${icon('check')} Complete</button>
            <button type="button" class="secondary-button" data-set-status="skipped">Skip</button>`
              : `<button type="button" class="secondary-button" data-set-status="planned">Mark planned</button>`
          }
          <button type="button" class="secondary-button" data-reschedule>Reschedule</button>
          <button type="button" class="secondary-button" data-followup>Follow-up</button>
          <button type="button" class="secondary-button" data-edit>Edit</button>
          <button type="button" class="danger-button" data-delete>Delete</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    const close = () => {
      overlay.remove();
      openEventId = null;
    };
    overlay.querySelector('[data-close]').onclick = close;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector('[data-edit]').onclick = () => {
      close();
      openEventForm(event);
    };
    overlay.querySelector('[data-delete]').onclick = () => {
      if (confirm('Delete this plan? This cannot be undone.')) {
        events = events.filter((e) => e.id !== event.id);
        persistAll();
        close();
        render();
      }
    };
    overlay.querySelectorAll('[data-set-status]').forEach((btn) => {
      btn.onclick = () => {
        setEventStatus(event.id, btn.dataset.setStatus);
        close();
      };
    });
    overlay.querySelector('[data-reschedule]').onclick = () => {
      close();
      openEventForm({ ...event, _reschedule: true });
    };
    overlay.querySelector('[data-followup]')?.addEventListener('click', () => {
      close();
      createFollowUpFromEvent(event);
    });
    overlay.querySelectorAll('[data-goto-person]').forEach((btn) => {
      btn.onclick = () => {
        close();
        activeTab = 'People';
        render();
      };
    });
    overlay.querySelectorAll('[data-goto-goal]').forEach((btn) => {
      btn.onclick = () => {
        close();
        activeTab = 'Goals';
        render();
      };
    });
    overlay.querySelector('[data-close]').focus();
  }

  function setEventStatus(id, status) {
    const idx = events.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const prev = events[idx].status;
    events[idx] = { ...events[idx], status, updatedAt: new Date().toISOString() };

    // Bump linked goal progress when completing
    if (status === 'completed' && prev !== 'completed') {
      events[idx].goalIds.forEach((gid) => {
        const gIdx = goals.findIndex((g) => g.id === gid);
        if (gIdx >= 0 && goals[gIdx].progress < goals[gIdx].target) {
          goals[gIdx] = { ...goals[gIdx], progress: goals[gIdx].progress + 1 };
        }
      });
    }
    if (prev === 'completed' && status !== 'completed') {
      events[idx].goalIds.forEach((gid) => {
        const gIdx = goals.findIndex((g) => g.id === gid);
        if (gIdx >= 0 && goals[gIdx].progress > 0) {
          goals[gIdx] = { ...goals[gIdx], progress: goals[gIdx].progress - 1 };
        }
      });
    }

    persistAll();
    render();
  }

  function createFollowUpFromEvent(event) {
    const description =
      event.followUp ||
      prompt('What needs to happen next?', `Follow up on ${event.title}`) ||
      '';
    if (!description.trim()) return;
    const due = addDays(event.date, 2);
    followUps = [
      ...followUps,
      normalizeFollowUp({
        id: uid('fu'),
        description: description.trim(),
        dueDate: due,
        personId: event.personIds[0] || null,
        eventId: event.id,
        goalId: event.goalIds[0] || null,
        priority: 'normal',
        status: 'open',
      }),
    ];
    persistAll();
    setSelectedDate(due);
    render();
  }

  function completeFollowUp(id) {
    followUps = followUps.map((f) =>
      f.id === id ? { ...f, status: 'done' } : f
    );
    persistAll();
    render();
  }

  function openEventForm(existing = null) {
    const isEdit = !!(existing && existing.id && !existing._reschedule);
    const isReschedule = !!(existing && existing._reschedule);
    const draft = existing
      ? { ...existing }
      : {
          title: '',
          date: selectedDate,
          startTime: '10:00',
          endTime: '11:00',
          allDay: false,
          category: 'Personal',
          description: '',
          location: '',
          personIds: [],
          goalIds: [],
          followUp: '',
          status: 'planned',
          recurrence: 'none',
        };

    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = `
      <form class="modal event-form" novalidate>
        <div class="modal-heading">
          <div>
            <span class="eyebrow">${isReschedule ? 'RESCHEDULE' : isEdit ? 'EDIT PLAN' : 'NEW PLAN'}</span>
            <h2>${isReschedule ? 'Pick a new time' : isEdit ? 'Update your plan' : 'Add to your day'}</h2>
          </div>
          <button type="button" class="icon-button" data-close aria-label="Close">${icon('close')}</button>
        </div>

        <label>What is planned?
          <input name="title" autofocus required placeholder="e.g. Call Mom, study block, coffee with Alex" value="${escapeHtml(draft.title)}" />
        </label>

        <div class="form-row">
          <label>Date
            <input type="date" name="date" required value="${escapeHtml(draft.date)}" />
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="allDay" ${draft.allDay ? 'checked' : ''} />
            All day
          </label>
        </div>

        <div class="form-row time-row ${draft.allDay ? 'is-hidden' : ''}">
          <label>Start
            <input type="time" name="startTime" value="${escapeHtml(draft.startTime || '10:00')}" />
          </label>
          <label>End
            <input type="time" name="endTime" value="${escapeHtml(draft.endTime || '11:00')}" />
          </label>
        </div>

        <label>Category
          <select name="category">
            ${CATEGORIES.map(
              (c) =>
                `<option value="${c.id}" ${draft.category === c.id ? 'selected' : ''}>${c.label}</option>`
            ).join('')}
          </select>
        </label>

        <details class="more-fields" ${draft.description || draft.location || draft.personIds.length || draft.goalIds.length || draft.followUp || draft.recurrence !== 'none' ? 'open' : ''}>
          <summary>More details — who, why, and what next</summary>

          <label>Location
            <input name="location" placeholder="Optional" value="${escapeHtml(draft.location || '')}" />
          </label>

          <label>Notes — why does it matter?
            <textarea name="description" rows="2" placeholder="Context, intention, or outcome">${escapeHtml(draft.description || '')}</textarea>
          </label>

          <label>People involved
            <select name="personIds" multiple size="${Math.min(4, Math.max(2, people.length || 2))}">
              ${
                people.length
                  ? people
                      .map(
                        (p) =>
                          `<option value="${p.id}" ${draft.personIds.includes(p.id) ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
                      )
                      .join('')
                  : '<option disabled>No people yet — add some from People</option>'
              }
            </select>
            <small class="field-hint">Hold Ctrl/Cmd to select more than one</small>
          </label>

          <label>Goals this supports
            <select name="goalIds" multiple size="${Math.min(4, Math.max(2, goals.length || 2))}">
              ${
                goals.length
                  ? goals
                      .map(
                        (g) =>
                          `<option value="${g.id}" ${draft.goalIds.includes(g.id) ? 'selected' : ''}>${escapeHtml(g.title)}</option>`
                      )
                      .join('')
                  : '<option disabled>No goals yet</option>'
              }
            </select>
          </label>

          <label>Follow-up (optional)
            <input name="followUp" placeholder="What needs to happen next?" value="${escapeHtml(draft.followUp || '')}" />
          </label>

          <div class="form-row">
            <label>Status
              <select name="status">
                ${Object.entries(STATUS)
                  .map(
                    ([id, s]) =>
                      `<option value="${id}" ${draft.status === id ? 'selected' : ''}>${s.label}</option>`
                  )
                  .join('')}
              </select>
            </label>
            <label>Repeats
              <select name="recurrence">
                ${RECURRENCE.map(
                  (r) =>
                    `<option value="${r.id}" ${draft.recurrence === r.id ? 'selected' : ''}>${r.label}</option>`
                ).join('')}
              </select>
            </label>
          </div>
        </details>

        <p class="form-error" data-error role="alert" hidden></p>

        <div class="form-footer">
          ${
            isEdit
              ? `<button type="button" class="danger-button" data-delete>Delete</button>`
              : '<span></span>'
          }
          <div class="form-footer-right">
            <button type="button" class="secondary-button" data-close>Cancel</button>
            <button type="submit" class="primary-button">${isEdit || isReschedule ? 'Save' : `${icon('plus')} Add to plan`}</button>
          </div>
        </div>
      </form>
    `;

    document.body.appendChild(overlay);
    const form = overlay.querySelector('form');
    const close = () => overlay.remove();

    overlay.querySelectorAll('[data-close]').forEach((b) => (b.onclick = close));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    const allDayInput = form.querySelector('[name="allDay"]');
    const timeRow = form.querySelector('.time-row');
    allDayInput.addEventListener('change', () => {
      timeRow.classList.toggle('is-hidden', allDayInput.checked);
    });

    form.querySelector('[data-delete]')?.addEventListener('click', () => {
      if (confirm('Delete this plan? This cannot be undone.')) {
        events = events.filter((e) => e.id !== draft.id);
        persistAll();
        close();
        render();
      }
    });

    const errorEl = form.querySelector('[data-error]');
    const showError = (message, fieldName) => {
      errorEl.textContent = message;
      errorEl.hidden = false;
      if (fieldName) form.querySelector(`[name="${fieldName}"]`)?.focus();
    };

    form.onsubmit = (e) => {
      e.preventDefault();
      errorEl.hidden = true;
      const fd = new FormData(form);
      const title = String(fd.get('title') || '').trim();
      if (!title) {
        showError('Give this activity a title.', 'title');
        return;
      }
      const date = String(fd.get('date') || '');
      if (!date) {
        showError('Choose a date for this activity.', 'date');
        return;
      }
      const allDay = fd.get('allDay') === 'on';
      if (!allDay) {
        const start = String(fd.get('startTime') || '');
        const end = String(fd.get('endTime') || '');
        if (!start || !end) {
          showError('Add a start and end time, or mark it all day.', !start ? 'startTime' : 'endTime');
          return;
        }
        if (timeToMinutes(end) <= timeToMinutes(start)) {
          showError('End time must be after the start time.', 'endTime');
          return;
        }
      }
      const category = String(fd.get('category'));
      const personIds = [...form.querySelector('[name="personIds"]').selectedOptions].map(
        (o) => o.value
      );
      const goalIds = [...form.querySelector('[name="goalIds"]').selectedOptions].map(
        (o) => o.value
      );

      const payload = normalizeEvent({
        id: isEdit ? draft.id : uid('evt'),
        title,
        date: String(fd.get('date')),
        startTime: allDay ? null : String(fd.get('startTime') || '10:00'),
        endTime: allDay ? null : String(fd.get('endTime') || '11:00'),
        allDay,
        category,
        color: categoryColor(category),
        description: String(fd.get('description') || ''),
        location: String(fd.get('location') || ''),
        personIds,
        goalIds,
        followUp: String(fd.get('followUp') || ''),
        status: String(fd.get('status') || 'planned'),
        recurrence: String(fd.get('recurrence') || 'none'),
        createdAt: isEdit ? draft.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSeed: false,
      });

      if (isEdit) {
        events = events.map((ev) => (ev.id === draft.id ? payload : ev));
      } else if (isReschedule) {
        // Keep original id when rescheduling
        events = events.map((ev) =>
          ev.id === draft.id ? { ...payload, id: draft.id, createdAt: draft.createdAt } : ev
        );
      } else {
        events = [...events, payload];
      }

      // Optional follow-up record
      if (payload.followUp && !isEdit) {
        followUps = [
          ...followUps,
          normalizeFollowUp({
            id: uid('fu'),
            description: payload.followUp,
            dueDate: addDays(payload.date, 1),
            personId: personIds[0] || null,
            eventId: payload.id,
            goalId: goalIds[0] || null,
          }),
        ];
      }

      setSelectedDate(payload.date);
      persistAll();
      close();
      render();
    };

    form.querySelector('[name="title"]').focus();
  }

  // ─── Weekly review ───────────────────────────────────────────
  function openWeeklyReview() {
    const start = startOfWeek(selectedDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const weekEvents = days.flatMap((d) => eventsForDate(d));
    const completed = weekEvents.filter((e) => e.status === 'completed');
    const skipped = weekEvents.filter((e) => e.status === 'skipped');
    const planned = weekEvents.filter((e) => e.status === 'planned');
    const unplannedDays = days.filter((d) => eventsForDate(d).length === 0);
    const connectedPeople = [
      ...new Map(
        weekEvents
          .flatMap((e) => e.personIds)
          .map((id) => getPerson(id))
          .filter(Boolean)
          .map((p) => [p.id, p])
      ).values(),
    ];
    const progressedGoals = goals.filter((g) =>
      weekEvents.some((e) => e.goalIds.includes(g.id) && e.status === 'completed')
    );
    const openFus = followUps.filter(
      (f) => f.status === 'open' && days.includes(f.dueDate)
    );

    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = `
      <form class="modal review-modal">
        <div class="modal-heading">
          <div>
            <span class="eyebrow">WEEKLY REVIEW</span>
            <h2>Week of ${escapeHtml(formatShortDate(start))}</h2>
          </div>
          <button type="button" class="icon-button" data-close aria-label="Close">${icon('close')}</button>
        </div>

        <div class="review-stats">
          <div class="stat"><strong>${completed.length}</strong><span>Completed</span></div>
          <div class="stat"><strong>${skipped.length}</strong><span>Skipped</span></div>
          <div class="stat"><strong>${planned.length}</strong><span>Still planned</span></div>
          <div class="stat"><strong>${unplannedDays.length}</strong><span>Open days</span></div>
        </div>

        <div class="review-columns">
          <div>
            <h3>What went well?</h3>
            <ul class="review-list">
              ${
                completed.length
                  ? completed
                      .slice(0, 6)
                      .map((e) => `<li><span class="dot ${e.color}"></span>${escapeHtml(e.title)}</li>`)
                      .join('')
                  : '<li class="muted">No completed plans yet this week.</li>'
              }
            </ul>
          </div>
          <div>
            <h3>What was skipped?</h3>
            <ul class="review-list">
              ${
                skipped.length
                  ? skipped
                      .map((e) => `<li><span class="dot ${e.color}"></span>${escapeHtml(e.title)}</li>`)
                      .join('')
                  : '<li class="muted">Nothing marked skipped.</li>'
              }
            </ul>
          </div>
        </div>

        <div class="review-columns">
          <div>
            <h3>Which people did I connect with?</h3>
            <div class="panel-chips light">
              ${
                connectedPeople.length
                  ? connectedPeople
                      .map(
                        (p) =>
                          `<span class="panel-chip light"><span class="avatar tiny">${escapeHtml(p.name[0])}</span>${escapeHtml(p.name)}</span>`
                      )
                      .join('')
                  : '<span class="muted">No linked people this week.</span>'
              }
            </div>
          </div>
          <div>
            <h3>Which goals progressed?</h3>
            <ul class="review-list">
              ${
                progressedGoals.length
                  ? progressedGoals
                      .map((g) => `<li><span class="dot ${g.color}"></span>${escapeHtml(g.title)}</li>`)
                      .join('')
                  : '<li class="muted">Link completed plans to goals to see progress here.</li>'
              }
            </ul>
          </div>
        </div>

        ${
          unplannedDays.length
            ? `<div class="review-block">
                <h3>Unplanned days</h3>
                <div class="panel-chips light">
                  ${unplannedDays
                    .map(
                      (d) =>
                        `<button type="button" class="panel-chip light" data-jump-date="${d}">${escapeHtml(formatShortDate(d))}</button>`
                    )
                    .join('')}
                </div>
              </div>`
            : ''
        }

        ${
          openFus.length
            ? `<div class="review-block">
                <h3>Important follow-ups</h3>
                <ul class="review-list">
                  ${openFus
                    .map((f) => `<li>${escapeHtml(f.description)} <small>(${escapeHtml(f.dueDate)})</small></li>`)
                    .join('')}
                </ul>
              </div>`
            : ''
        }

        <label>What should I carry into next week?
          <textarea name="carry" rows="3" placeholder="Priorities, people to contact, next actions…">${escapeHtml(
            reviews.find((r) => r.weekStart === start)?.carry || ''
          )}</textarea>
        </label>

        <div class="form-footer">
          <button type="button" class="secondary-button" data-add-plan>${icon('plus')} Add to plan</button>
          <div class="form-footer-right">
            <button type="button" class="secondary-button" data-close>Close</button>
            <button type="submit" class="primary-button">Save review</button>
          </div>
        </div>
      </form>
    `;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelectorAll('[data-close]').forEach((b) => (b.onclick = close));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector('[data-add-plan]').onclick = () => {
      close();
      openEventForm();
    };
    overlay.querySelectorAll('[data-jump-date]').forEach((btn) => {
      btn.onclick = () => {
        setSelectedDate(btn.dataset.jumpDate);
        setCalendarView('day');
        close();
        render();
      };
    });
    overlay.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const carry = String(new FormData(e.target).get('carry') || '');
      reviews = [
        ...reviews.filter((r) => r.weekStart !== start),
        {
          id: uid('rev'),
          weekStart: start,
          carry,
          savedAt: new Date().toISOString(),
        },
      ];
      persistAll();
      close();
    };
  }

  // ─── Person / Goal forms ─────────────────────────────────────
  function openPersonForm() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';
    overlay.innerHTML = `
      <form class="modal">
        <div class="modal-heading">
          <div>
            <span class="eyebrow">NEW PERSON</span>
            <h2>Add someone important</h2>
          </div>
          <button type="button" class="icon-button" data-close aria-label="Close">${icon('close')}</button>
        </div>
        <label>Name<input autofocus name="name" placeholder="Alex Chen" required /></label>
        <div class="form-row">
          <label>Relationship
            <select name="type">
              ${['Friend', 'Family', 'Dating', 'Professor', 'Business', 'Mentor']
                .map((t) => `<option>${t}</option>`)
                .join('')}
            </select>
          </label>
          <label>Phone<input name="phone" placeholder="Optional" /></label>
        </div>
        <label>Email<input type="email" name="email" placeholder="Optional" /></label>
        <label>How did you meet?<input name="detail" placeholder="Career fair, class, church, etc." /></label>
        <label>Note<input name="note" placeholder="What should you remember?" /></label>
        <div class="form-footer">
          <span></span>
          <div class="form-footer-right">
            <button type="button" class="secondary-button" data-close>Cancel</button>
            <button type="submit" class="primary-button">${icon('plus')} Save person</button>
          </div>
        </div>
      </form>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelectorAll('[data-close]').forEach((b) => (b.onclick = close));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      people = [
        ...people,
        normalizePerson({
          id: uid('per'),
          name: fd.get('name'),
          type: fd.get('type'),
          phone: fd.get('phone'),
          email: fd.get('email'),
          detail: fd.get('detail') || 'New connection',
          note: fd.get('note') || 'No note yet.',
        }),
      ];
      persistAll();
      close();
      render();
    };
  }

  function openGoalForm() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';
    overlay.innerHTML = `
      <form class="modal">
        <div class="modal-heading">
          <div>
            <span class="eyebrow">NEW GOAL</span>
            <h2>Choose what matters</h2>
          </div>
          <button type="button" class="icon-button" data-close aria-label="Close">${icon('close')}</button>
        </div>
        <label>Goal title<input autofocus name="title" placeholder="Apply to five internships" required /></label>
        <label>Why does it matter?<input name="reason" placeholder="Optional" /></label>
        <div class="form-row">
          <label>Target actions<input type="number" min="1" name="target" value="5" /></label>
          <label>Period
            <select name="period">
              ${['This week', 'This month', 'This semester', 'This year']
                .map((p) => `<option>${p}</option>`)
                .join('')}
            </select>
          </label>
        </div>
        <label>Category color
          <select name="color">
            <option value="blue">Personal (blue)</option>
            <option value="mint">Relationships (mint)</option>
            <option value="purple">Career (purple)</option>
            <option value="gold">Service / Spiritual (gold)</option>
          </select>
        </label>
        <div class="form-footer">
          <span></span>
          <div class="form-footer-right">
            <button type="button" class="secondary-button" data-close>Cancel</button>
            <button type="submit" class="primary-button">${icon('plus')} Save goal</button>
          </div>
        </div>
      </form>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelectorAll('[data-close]').forEach((b) => (b.onclick = close));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      goals = [
        ...goals,
        normalizeGoal({
          id: uid('goal'),
          title: fd.get('title'),
          reason: fd.get('reason'),
          progress: 0,
          target: Number(fd.get('target')) || 1,
          period: fd.get('period'),
          color: fd.get('color'),
          status: 'active',
        }),
      ];
      persistAll();
      close();
      render();
    };
  }

  // Escape to close topmost modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.querySelector('.modal-backdrop:last-of-type');
      if (modal) modal.remove();
    }
  });

  // Initial render
  render();
})();
