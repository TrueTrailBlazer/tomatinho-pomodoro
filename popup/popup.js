// Tomatinho Pomodoro - Lógica Completa do Popup

document.addEventListener('DOMContentLoaded', async () => {
  // -----------------------------------------------------------
  // Elementos do DOM
  // -----------------------------------------------------------
  // Tema no Tomatinho & Navegação
  const btnTomatoTheme = document.getElementById('btn-tomato-theme');
  const logoMascot = document.getElementById('logo-mascot');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Sub-abas de Ajustes
  const subTabs = document.querySelectorAll('.sub-tab');
  const subPanes = document.querySelectorAll('.sub-pane');

  // Timer
  const modePills = document.querySelectorAll('.mode-pill');
  const timerDigits = document.getElementById('timer-digits');
  const timerStatus = document.getElementById('timer-status');
  const timerProgress = document.getElementById('timer-progress');
  const cyclesDots = document.getElementById('cycles-dots');
  const cyclesText = document.getElementById('cycles-text');
  const btnStartPause = document.getElementById('btn-start-pause');
  const startPauseIcon = document.getElementById('start-pause-icon');
  const startPauseLabel = document.getElementById('start-pause-label');
  const btnReset = document.getElementById('btn-reset');
  const btnSkip = document.getElementById('btn-skip');

  // Stepper Rápido na Home Screen
  const btnStepperMinus = document.getElementById('btn-stepper-minus');
  const btnStepperPlus = document.getElementById('btn-stepper-plus');
  const stepperLabel = document.getElementById('stepper-label');

  // Modal de Edição Direta de Tempo
  const timeEditModal = document.getElementById('time-edit-modal');
  const timeEditTitle = document.getElementById('time-edit-title');
  const btnCloseTimeEdit = document.getElementById('btn-close-time-edit');
  const inputEditHours = document.getElementById('input-edit-hours');
  const inputEditMinutes = document.getElementById('input-edit-minutes');
  const presetChips = document.querySelectorAll('.preset-time-chip');
  const btnConfirmTimeEdit = document.getElementById('btn-confirm-time-edit');

  // Tarefa Ativa no Timer
  const activeTaskPill = document.getElementById('active-task-pill');
  const activeTaskName = document.getElementById('active-task-name');
  const btnClearActiveTask = document.getElementById('btn-clear-active-task');

  // Tarefas
  const inputTaskText = document.getElementById('input-task-text');
  const selectTaskEstimate = document.getElementById('select-task-estimate');
  const btnAddTask = document.getElementById('btn-add-task');
  const tasksList = document.getElementById('tasks-list');

  // Bloqueador
  const checkBlockerEnabled = document.getElementById('check-blocker-enabled');
  const blockerPresetChips = document.querySelectorAll('#sub-pane-blocker .chip');
  const inputCustomSite = document.getElementById('input-custom-site');
  const btnAddSite = document.getElementById('btn-add-site');
  const blockedSitesList = document.getElementById('blocked-sites-list');

  // Áudio
  const selectAlarmSound = document.getElementById('select-alarm-sound');
  const btnTestAlarm = document.getElementById('btn-test-alarm');
  const rangeAlarmVol = document.getElementById('range-alarm-vol');
  const valAlarmVol = document.getElementById('val-alarm-vol');
  const ambientRadios = document.querySelectorAll('input[name="ambientSound"]');
  const rangeAmbientVol = document.getElementById('range-ambient-vol');
  const valAmbientVol = document.getElementById('val-ambient-vol');

  // Stats
  const statsStreakCount = document.getElementById('stats-streak-count');
  const statsTodayCycles = document.getElementById('stats-today-cycles');
  const statsTodayTime = document.getElementById('stats-today-time');
  const statsBars = document.getElementById('stats-bars');
  const btnQuickResetToday = document.getElementById('btn-quick-reset-today');

  // Configurações & Reset
  const setFocus = document.getElementById('set-focus');
  const setShort = document.getElementById('set-short');
  const setLong = document.getElementById('set-long');
  const setIntervalEl = document.getElementById('set-interval');
  const valInterval = document.getElementById('val-interval');
  const checkAutoBreaks = document.getElementById('check-auto-breaks');
  const checkAutoFocus = document.getElementById('check-auto-focus');
  const toggleNavBottom = document.getElementById('toggle-nav-bottom');
  const btnResetTodayStats = document.getElementById('btn-reset-today-stats');
  const btnResetCycleCount = document.getElementById('btn-reset-cycle-count');
  const btnResetFactory = document.getElementById('btn-reset-factory');

  const mainNavTabsContainer = document.getElementById('main-nav-tabs');
  const appContainer = document.querySelector('.app-container');

  // Custom Confirm Modal
  const confirmModal = document.getElementById('confirm-modal');
  const confirmTitle = document.getElementById('confirm-title');
  const confirmMessage = document.getElementById('confirm-message');
  const btnConfirmOk = document.getElementById('btn-confirm-ok');
  const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
  let confirmCallback = null;

  function showConfirm(title, message, callback) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmCallback = callback;
    confirmModal.style.display = 'flex';
  }

  btnConfirmCancel.addEventListener('click', () => {
    confirmModal.style.display = 'none';
    confirmCallback = null;
  });

  btnConfirmOk.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    confirmModal.style.display = 'none';
    confirmCallback = null;
  });

  // Constantes do Anel de Progresso
  const RING_CIRCUMFERENCE = 2 * Math.PI * 95; // ~596.9
  timerProgress.style.strokeDasharray = RING_CIRCUMFERENCE;

  let localTimerInterval = null;

  // -----------------------------------------------------------
  // Gerenciamento de Tema (Clicando no Tomatinho!)
  // -----------------------------------------------------------
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (logoMascot) {
      logoMascot.src = isDark ? '../icons/tomato-night.svg' : '../icons/tomato-day.svg';
    }
    btnTomatoTheme.title = isDark ? 'Modo Noite: Clique para mudar para Modo Dia' : 'Modo Dia: Clique para mudar para Modo Noite';
  }

  btnTomatoTheme.addEventListener('click', async () => {
    if (typeof isSettingsOpen !== 'undefined' && isSettingsOpen) return;
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);

    const { settings = {} } = await chrome.storage.local.get('settings');
    settings.theme = nextTheme;
    await chrome.storage.local.set({ settings });
  });

  // -----------------------------------------------------------
  // Navegação Principal (Timer, Tarefas, Stats) + Ajustes
  // -----------------------------------------------------------
  function switchMainTab(targetId) {
    navTabs.forEach(t => t.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));

    const targetTab = document.querySelector(`.nav-tab[data-tab="${targetId}"]`);
    if (targetTab) targetTab.classList.add('active');

    const targetPane = document.getElementById(`pane-${targetId}`);
    if (targetPane) targetPane.classList.add('active');

    if (targetId === 'stats') renderStats();
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchMainTab(tab.dataset.tab);
    });
  });

  let isSettingsOpen = false;
  const GEAR_SVG = `<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>`;
  const X_SVG = `<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>`;
  const logoText = document.querySelector('.logo-text');

  btnOpenSettings.addEventListener('click', () => {
    isSettingsOpen = !isSettingsOpen;
    
    if (isSettingsOpen) {
      navTabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      const paneSettings = document.getElementById('pane-settings');
      if (paneSettings) paneSettings.classList.add('active');
      
      if (mainNavTabsContainer) mainNavTabsContainer.classList.add('hidden');
      
      btnOpenSettings.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${X_SVG}</svg>`;
      if (logoText) logoText.textContent = 'Ajustes e Opções';
      if (logoMascot) {
        logoMascot.src = '../icons/tomato-settings.svg';
        logoMascot.classList.remove('wiggling');
      }
    } else {
      if (mainNavTabsContainer) mainNavTabsContainer.classList.remove('hidden');
      switchMainTab('timer');
      
      btnOpenSettings.innerHTML = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GEAR_SVG}</svg>`;
      if (logoText) logoText.textContent = 'Tomatinho';
      if (logoMascot) {
        logoMascot.classList.add('wiggling');
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        logoMascot.src = currentTheme === 'dark' ? '../icons/tomato-night.svg' : '../icons/tomato-day.svg';
      }
    }
  });

  // Sub-abas de Ajustes (Tempos, Filtro, Sons, Reset)
  subTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const subTarget = tab.dataset.sub;
      subTabs.forEach(t => t.classList.remove('active'));
      subPanes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const pane = document.getElementById(`sub-pane-${subTarget}`);
      if (pane) pane.classList.add('active');
    });
  });

  // -----------------------------------------------------------
  // Formatador de Tempo com Suporte a Horas
  // -----------------------------------------------------------
  function formatRemainingTime(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function formatLabelMinutes(totalMinutes) {
    if (totalMinutes >= 60) {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${totalMinutes} min`;
  }

  // -----------------------------------------------------------
  // Renderização e Sincronização do Temporizador
  // -----------------------------------------------------------
  const SVG_PLAY = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>`;

  const SVG_PAUSE = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1"></rect>
      <rect x="14" y="4" width="4" height="16" rx="1"></rect>
    </svg>`;

  async function syncTimerDisplay() {
    const data = await chrome.storage.local.get(['timerState', 'settings', 'tasks']);
    const timer = data.timerState;
    const settings = data.settings || {};
    const tasks = data.tasks || [];

    if (!timer) return;

    // Atualiza pílulas de modo
    modePills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.mode === timer.mode);
    });

    // Duração configurada para o modo atual
    let durationMins = settings.focusDuration || 25;
    if (timer.mode === 'shortBreak') durationMins = settings.shortBreakDuration || 5;
    if (timer.mode === 'longBreak') durationMins = settings.longBreakDuration || 15;

    // Atualiza etiqueta do Stepper na home
    stepperLabel.textContent = formatLabelMinutes(durationMins);

    // Calcula tempo restante
    let remainingMs = timer.remainingMs || 0;
    if (timer.status === 'running' && timer.targetEndTime) {
      remainingMs = Math.max(0, timer.targetEndTime - Date.now());
    }

    // Atualiza visor de dígitos com suporte a horas
    timerDigits.textContent = formatRemainingTime(remainingMs);

    // Status textual
    if (timer.status === 'paused') {
      timerStatus.textContent = 'Pausado';
    } else if (timer.status === 'running') {
      if (timer.mode === 'focus') timerStatus.textContent = 'Focando...';
      else if (timer.mode === 'shortBreak') timerStatus.textContent = 'Pausa Curta';
      else timerStatus.textContent = 'Descanso Longo';
    } else {
      timerStatus.textContent = 'Pronto para começar';
    }

    // Botão Iniciar / Pausar
    if (timer.status === 'running') {
      startPauseIcon.innerHTML = SVG_PAUSE;
      startPauseLabel.textContent = 'Pausar';
      btnStartPause.style.background = '#868E96';
    } else {
      startPauseIcon.innerHTML = SVG_PLAY;
      startPauseLabel.textContent = timer.status === 'paused' ? 'Continuar' : 'Iniciar';
      btnStartPause.style.background = '';
    }

    // Progresso circular
    const totalMs = durationMins * 60 * 1000;
    const fraction = Math.min(1, Math.max(0, remainingMs / totalMs));
    const offset = RING_CIRCUMFERENCE * (1 - fraction);
    timerProgress.style.strokeDashoffset = offset;

    // Cor do anel
    if (timer.mode === 'focus') {
      timerProgress.style.stroke = 'var(--color-primary)';
    } else {
      timerProgress.style.stroke = 'var(--color-green)';
    }

    // Ciclos
    const longInterval = settings.longBreakInterval || 4;
    const currentCycle = ((timer.cycleCount - 1) % longInterval) + 1;
    let dotsHtml = '';
    for (let i = 1; i <= longInterval; i++) {
      if (i < currentCycle) {
        dotsHtml += '<img src="../icons/tomato-day.svg" class="cycle-tomato done" alt="Tomate">';
      } else if (i === currentCycle) {
        dotsHtml += '<img src="../icons/tomato-day.svg" class="cycle-tomato current" alt="Tomate">';
      } else {
        dotsHtml += '<span class="cycle-empty-dot"></span>';
      }
    }
    cyclesDots.innerHTML = dotsHtml;
    cyclesText.textContent = `Ciclo ${currentCycle} de ${longInterval}`;

    // Tarefa Ativa
    const activeTask = tasks.find(t => t.active && !t.completed);
    if (activeTask) {
      activeTaskPill.style.display = 'flex';
      activeTaskName.textContent = activeTask.text;
    } else {
      activeTaskPill.style.display = 'none';
    }
  }

  function startLocalLoop() {
    if (localTimerInterval) clearInterval(localTimerInterval);
    syncTimerDisplay();
    localTimerInterval = setInterval(syncTimerDisplay, 500);
  }

  // -----------------------------------------------------------
  // Stepper Rápido de Tempo (-5m / +5m)
  // -----------------------------------------------------------
  async function adjustCurrentModeDuration(deltaMins) {
    const { timerState, settings = {} } = await chrome.storage.local.get(['timerState', 'settings']);
    if (!timerState) return;

    const mode = timerState.mode;
    let current = 25;
    let minLimit = 5;
    let maxLimit = 180;

    if (mode === 'focus') {
      current = settings.focusDuration || 25;
      minLimit = 5;
      maxLimit = 180;
      settings.focusDuration = Math.min(maxLimit, Math.max(minLimit, current + deltaMins));
      setFocus.value = settings.focusDuration;
    } else if (mode === 'shortBreak') {
      current = settings.shortBreakDuration || 5;
      minLimit = 1;
      maxLimit = 45;
      settings.shortBreakDuration = Math.min(maxLimit, Math.max(minLimit, current + deltaMins));
      setShort.value = settings.shortBreakDuration;
    } else if (mode === 'longBreak') {
      current = settings.longBreakDuration || 15;
      minLimit = 5;
      maxLimit = 90;
      settings.longBreakDuration = Math.min(maxLimit, Math.max(minLimit, current + deltaMins));
      setLong.value = settings.longBreakDuration;
    }

    const newDuration = mode === 'focus' ? settings.focusDuration : (mode === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration);

    if (timerState.status === 'idle' || timerState.status === 'paused') {
      timerState.remainingMs = newDuration * 60 * 1000;
    } else if (timerState.status === 'running' && timerState.targetEndTime) {
      timerState.targetEndTime += (deltaMins * 60 * 1000);
    }

    await chrome.storage.local.set({ settings, timerState });
    syncTimerDisplay();
  }

  btnStepperMinus.addEventListener('click', () => adjustCurrentModeDuration(-5));
  btnStepperPlus.addEventListener('click', () => adjustCurrentModeDuration(5));

  // -----------------------------------------------------------
  // Modal de Edição Direta de Tempo (Clicando nos dígitos ou label)
  // -----------------------------------------------------------
  async function openTimeEditModal() {
    const { timerState = {}, settings = {} } = await chrome.storage.local.get(['timerState', 'settings']);
    const mode = timerState.mode || 'focus';

    let currentMinutes = settings.focusDuration || 25;
    if (mode === 'shortBreak') {
      currentMinutes = settings.shortBreakDuration || 5;
      timeEditTitle.textContent = 'Editar Pausa Curta';
    } else if (mode === 'longBreak') {
      currentMinutes = settings.longBreakDuration || 15;
      timeEditTitle.textContent = 'Editar Pausa Longa';
    } else {
      timeEditTitle.textContent = 'Editar Duração do Foco';
    }

    inputEditHours.value = Math.floor(currentMinutes / 60);
    inputEditMinutes.value = currentMinutes % 60;

    timeEditModal.style.display = 'flex';
    inputEditMinutes.focus();
    inputEditMinutes.select();
  }

  function closeTimeEditModal() {
    timeEditModal.style.display = 'none';
  }

  timerDigits.addEventListener('click', openTimeEditModal);
  stepperLabel.addEventListener('click', openTimeEditModal);
  btnCloseTimeEdit.addEventListener('click', closeTimeEditModal);

  timeEditModal.addEventListener('click', (e) => {
    if (e.target === timeEditModal) closeTimeEditModal();
  });

  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const mins = parseInt(chip.dataset.mins, 10);
      inputEditHours.value = Math.floor(mins / 60);
      inputEditMinutes.value = mins % 60;
    });
  });

  btnConfirmTimeEdit.addEventListener('click', async () => {
    const hours = parseInt(inputEditHours.value, 10) || 0;
    const minutes = parseInt(inputEditMinutes.value, 10) || 0;
    const totalMinutes = Math.min(180, Math.max(1, (hours * 60) + minutes));

    const { timerState = {}, settings = {} } = await chrome.storage.local.get(['timerState', 'settings']);
    const mode = timerState.mode || 'focus';

    if (mode === 'focus') {
      settings.focusDuration = totalMinutes;
      setFocus.value = totalMinutes;
    } else if (mode === 'shortBreak') {
      settings.shortBreakDuration = totalMinutes;
      setShort.value = totalMinutes;
    } else if (mode === 'longBreak') {
      settings.longBreakDuration = totalMinutes;
      setLong.value = totalMinutes;
    }

    if (timerState.status === 'idle' || timerState.status === 'paused') {
      timerState.remainingMs = totalMinutes * 60 * 1000;
    }

    await chrome.storage.local.set({ settings, timerState });
    closeTimeEditModal();
    syncTimerDisplay();
  });

  // -----------------------------------------------------------
  // Controles do Timer
  // -----------------------------------------------------------
  btnStartPause.addEventListener('click', async () => {
    const { timerState } = await chrome.storage.local.get('timerState');
    if (timerState && timerState.status === 'running') {
      chrome.runtime.sendMessage({ action: 'pauseTimer' }, () => syncTimerDisplay());
    } else {
      chrome.runtime.sendMessage({ action: 'startTimer' }, () => syncTimerDisplay());
    }
  });

  btnReset.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'resetTimer' }, () => syncTimerDisplay());
  });

  btnSkip.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'skipTimer' }, () => syncTimerDisplay());
  });

  modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const mode = pill.dataset.mode;
      chrome.runtime.sendMessage({ action: 'changeMode', mode }, () => syncTimerDisplay());
    });
  });

  // btnQuickResetToday foi removido do HTML

  btnClearActiveTask.addEventListener('click', async () => {
    const { tasks = [] } = await chrome.storage.local.get('tasks');
    tasks.forEach(t => t.active = false);
    await chrome.storage.local.set({ tasks });
    syncTimerDisplay();
    renderTasks();
  });

  // -----------------------------------------------------------
  // Aba 2: Gerenciamento de Tarefas
  // -----------------------------------------------------------
  const SVG_STAR = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>`;

  const SVG_TARGET = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>`;

  const SVG_TRASH = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>`;

  async function renderTasks() {
    const { tasks = [] } = await chrome.storage.local.get('tasks');
    tasksList.innerHTML = '';

    if (tasks.length === 0) {
      tasksList.innerHTML = `
        <div style="text-align: center; padding: 24px 0; color: var(--text-muted); font-size: 12px; line-height: 1.6;">
          Nenhuma tarefa criada.<br>Adicione uma meta acima para acompanhar seus ciclos!
        </div>
      `;
      return;
    }

    tasks.forEach(task => {
      const el = document.createElement('div');
      el.className = `task-item ${task.active ? 'active' : ''} ${task.completed ? 'completed' : ''}`;
      el.innerHTML = `
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
          <span class="task-title" title="${task.text}">${task.text}</span>
        </div>
        <div class="task-right">
          <span class="task-tomatoes" title="${task.completedPomodoros || 0} de ${task.estimatedPomodoros} ciclos">
            <img src="../icons/tomato-day.svg" width="13" height="13" alt="Tomate" style="vertical-align: -1px; margin-right: 4px;">
            ${task.completedPomodoros || 0}/${task.estimatedPomodoros}
          </span>
          <button class="btn-task-action btn-set-active ${task.active ? 'is-active' : ''}" data-id="${task.id}" title="${task.active ? 'Tarefa ativa' : 'Focar nesta tarefa'}">
            ${task.active ? SVG_STAR : SVG_TARGET}
          </button>
          <button class="btn-task-action btn-delete-task" data-id="${task.id}" title="Excluir tarefa">
            ${SVG_TRASH}
          </button>
        </div>
      `;
      tasksList.appendChild(el);
    });

    tasksList.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const { tasks = [] } = await chrome.storage.local.get('tasks');
        const t = tasks.find(item => item.id === id);
        if (t) {
          t.completed = e.target.checked;
          if (t.completed && t.active) t.active = false;
          await chrome.storage.local.set({ tasks });
          renderTasks();
          syncTimerDisplay();
        }
      });
    });

    tasksList.querySelectorAll('.btn-set-active').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const { tasks = [] } = await chrome.storage.local.get('tasks');
        tasks.forEach(item => {
          if (item.id === id) item.active = !item.active;
          else item.active = false;
        });
        await chrome.storage.local.set({ tasks });
        renderTasks();
        syncTimerDisplay();
      });
    });

    tasksList.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        let { tasks = [] } = await chrome.storage.local.get('tasks');
        tasks = tasks.filter(item => item.id !== id);
        await chrome.storage.local.set({ tasks });
        renderTasks();
        syncTimerDisplay();
      });
    });
  }

  btnAddTask.addEventListener('click', async () => {
    const text = inputTaskText.value.trim();
    if (!text) return;

    const estimate = parseInt(selectTaskEstimate.value, 10) || 3;
    const { tasks = [] } = await chrome.storage.local.get('tasks');

    const newTask = {
      id: Date.now().toString(),
      text,
      estimatedPomodoros: estimate,
      completedPomodoros: 0,
      completed: false,
      active: tasks.length === 0
    };

    tasks.push(newTask);
    await chrome.storage.local.set({ tasks });

    inputTaskText.value = '';
    renderTasks();
    syncTimerDisplay();
  });

  inputTaskText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnAddTask.click();
  });

  // -----------------------------------------------------------
  // Sub-painel: Bloqueador de Distrações
  // -----------------------------------------------------------
  const SVG_CLOSE = `
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`;

  async function renderBlockedSites() {
    const { blockedSites = [], blockerEnabled = true } = await chrome.storage.local.get([
      'blockedSites',
      'blockerEnabled'
    ]);

    checkBlockerEnabled.checked = blockerEnabled;
    blockedSitesList.innerHTML = '';

    if (blockedSites.length === 0) {
      blockedSitesList.innerHTML = `
        <div style="text-align: center; padding: 14px 0; color: var(--text-muted); font-size: 11px;">
          Nenhum site bloqueado. Use os atalhos acima ou adicione sites personalizados!
        </div>
      `;
      return;
    }

    blockedSites.forEach((site, index) => {
      const el = document.createElement('div');
      el.className = 'blocked-site-item';
      el.innerHTML = `
        <span>${site}</span>
        <button class="btn-remove-site" data-index="${index}" title="Remover site">${SVG_CLOSE}</button>
      `;
      blockedSitesList.appendChild(el);
    });

    blockedSitesList.querySelectorAll('.btn-remove-site').forEach(btn => {
      btn.addEventListener('click', async () => {
        const index = parseInt(btn.dataset.index, 10);
        const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
        blockedSites.splice(index, 1);
        await chrome.storage.local.set({ blockedSites });
        chrome.runtime.sendMessage({ action: 'updateBlocker' });
        renderBlockedSites();
      });
    });
  }

  checkBlockerEnabled.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ blockerEnabled: e.target.checked });
    chrome.runtime.sendMessage({ action: 'updateBlocker' });
  });

  function addBlockedSite(site) {
    let domain = site.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    if (!domain) return;

    chrome.storage.local.get('blockedSites', async ({ blockedSites = [] }) => {
      if (!blockedSites.includes(domain)) {
        blockedSites.push(domain);
        await chrome.storage.local.set({ blockedSites });
        chrome.runtime.sendMessage({ action: 'updateBlocker' });
        renderBlockedSites();
      }
    });
  }

  btnAddSite.addEventListener('click', () => {
    const site = inputCustomSite.value;
    if (site) {
      addBlockedSite(site);
      inputCustomSite.value = '';
    }
  });

  inputCustomSite.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnAddSite.click();
  });

  blockerPresetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      addBlockedSite(chip.dataset.site);
    });
  });

  // -----------------------------------------------------------
  // Sub-painel: Áudio e Sons de Foco (Auto-save)
  // -----------------------------------------------------------
  async function loadAudioSettings() {
    const { settings = {} } = await chrome.storage.local.get('settings');

    if (settings.soundAlert) selectAlarmSound.value = settings.soundAlert;
    if (settings.soundVolume !== undefined) {
      rangeAlarmVol.value = settings.soundVolume;
      valAlarmVol.textContent = `${Math.round(settings.soundVolume * 100)}%`;
    }

    if (settings.ambientSound) {
      const targetRadio = document.querySelector(`input[name="ambientSound"][value="${settings.ambientSound}"]`);
      if (targetRadio) targetRadio.checked = true;
    }
    if (settings.ambientVolume !== undefined) {
      rangeAmbientVol.value = settings.ambientVolume;
      valAmbientVol.textContent = `${Math.round(settings.ambientVolume * 100)}%`;
    }
  }

  btnTestAlarm.addEventListener('click', () => {
    const sound = selectAlarmSound.value;
    const volume = parseFloat(rangeAlarmVol.value);
    chrome.runtime.sendMessage({
      action: 'triggerSoundTest',
      sound,
      volume
    });
  });

  selectAlarmSound.addEventListener('change', async (e) => {
    const { settings = {} } = await chrome.storage.local.get('settings');
    settings.soundAlert = e.target.value;
    await chrome.storage.local.set({ settings });
  });

  rangeAlarmVol.addEventListener('input', async (e) => {
    const vol = parseFloat(e.target.value);
    valAlarmVol.textContent = `${Math.round(vol * 100)}%`;
    const { settings = {} } = await chrome.storage.local.get('settings');
    settings.soundVolume = vol;
    await chrome.storage.local.set({ settings });
  });

  ambientRadios.forEach(radio => {
    radio.addEventListener('change', async (e) => {
      const sound = e.target.value;
      const { settings = {}, timerState = {} } = await chrome.storage.local.get(['settings', 'timerState']);
      settings.ambientSound = sound;
      await chrome.storage.local.set({ settings });

      if (timerState.mode === 'focus' && timerState.status === 'running') {
        chrome.runtime.sendMessage({
          action: 'setAmbient',
          sound,
          volume: settings.ambientVolume || 0.5
        });
      }
    });
  });

  rangeAmbientVol.addEventListener('input', async (e) => {
    const vol = parseFloat(e.target.value);
    valAmbientVol.textContent = `${Math.round(vol * 100)}%`;
    const { settings = {} } = await chrome.storage.local.get('settings');
    settings.ambientVolume = vol;
    await chrome.storage.local.set({ settings });
    chrome.runtime.sendMessage({ action: 'updateAmbientVolume', volume: vol });
  });

  // -----------------------------------------------------------
  // Aba 3: Estatísticas
  // -----------------------------------------------------------
  async function renderStats() {
    const { stats = { streaks: 0, dailyHistory: {} } } = await chrome.storage.local.get('stats');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayData = stats.dailyHistory ? (stats.dailyHistory[todayStr] || { count: 0, minutes: 0 }) : { count: 0, minutes: 0 };

    statsStreakCount.textContent = `${stats.streaks || 0} ${stats.streaks === 1 ? 'dia' : 'dias'}`;
    statsTodayCycles.textContent = todayData.count || 0;

    const totalMins = todayData.minutes || 0;
    if (totalMins >= 60) {
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      statsTodayTime.textContent = `${h}h ${m}m`;
    } else {
      statsTodayTime.textContent = `${totalMins}m`;
    }

    // Gráfico dos últimos 7 dias
    statsBars.innerHTML = '';
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const count = (stats.dailyHistory && stats.dailyHistory[dateKey]) ? stats.dailyHistory[dateKey].count : 0;
      past7Days.push({
        dateKey,
        dayLabel: dayNames[d.getDay()],
        count
      });
    }

    const maxCount = Math.max(4, ...past7Days.map(d => d.count));

    past7Days.forEach(day => {
      const heightPct = Math.round((day.count / maxCount) * 100);
      const col = document.createElement('div');
      col.className = 'bar-column';
      col.innerHTML = `
        <div class="bar-fill-wrap" title="${day.count} pomodoros em ${day.dateKey}">
          <div class="bar-fill" style="height: ${heightPct}%;"></div>
        </div>
        <span class="bar-day">${day.dayLabel}</span>
      `;
      statsBars.appendChild(col);
    });
  }

  // -----------------------------------------------------------
  // Sub-painel: Tempos & Configurações com AUTO-SAVE INSTANTÂNEO
  // -----------------------------------------------------------
  async function loadSettings() {
    const { settings = {} } = await chrome.storage.local.get('settings');

    setFocus.value = settings.focusDuration || 25;
    setShort.value = settings.shortBreakDuration || 5;
    setLong.value = settings.longBreakDuration || 15;
    setIntervalEl.value = settings.longBreakInterval || 4;
    valInterval.textContent = `${settings.longBreakInterval || 4} ciclos`;
    checkAutoBreaks.checked = !!settings.autoStartBreaks;
    checkAutoFocus.checked = !!settings.autoStartFocus;
    if (toggleNavBottom) {
      toggleNavBottom.checked = !!settings.navBottom;
      if (settings.navBottom) {
        appContainer.classList.add('nav-bottom');
      } else {
        appContainer.classList.remove('nav-bottom');
      }
    }

    const savedTheme = settings.theme === 'dark' ? 'dark' : 'light';
    applyTheme(savedTheme);
  }

  async function autoSaveSettings() {
    const focusDuration = parseInt(setFocus.value, 10) || 25;
    const shortBreakDuration = parseInt(setShort.value, 10) || 5;
    const longBreakDuration = parseInt(setLong.value, 10) || 15;
    const longBreakInterval = parseInt(setIntervalEl.value, 10) || 4;
    const autoStartBreaks = checkAutoBreaks.checked;
    const autoStartFocus = checkAutoFocus.checked;
    const navBottom = toggleNavBottom ? toggleNavBottom.checked : false;

    if (navBottom) {
      appContainer.classList.add('nav-bottom');
    } else {
      appContainer.classList.remove('nav-bottom');
    }

    const { settings = {}, timerState = {} } = await chrome.storage.local.get(['settings', 'timerState']);

    Object.assign(settings, {
      focusDuration,
      shortBreakDuration,
      longBreakDuration,
      longBreakInterval,
      autoStartBreaks,
      autoStartFocus,
      navBottom
    });

    if (timerState.status === 'idle') {
      let d = focusDuration;
      if (timerState.mode === 'shortBreak') d = shortBreakDuration;
      if (timerState.mode === 'longBreak') d = longBreakDuration;
      timerState.remainingMs = d * 60 * 1000;
      await chrome.storage.local.set({ timerState });
    }

    await chrome.storage.local.set({ settings });
    syncTimerDisplay();
  }

  setFocus.addEventListener('input', autoSaveSettings);
  setShort.addEventListener('input', autoSaveSettings);
  setLong.addEventListener('input', autoSaveSettings);
  checkAutoBreaks.addEventListener('change', autoSaveSettings);
  checkAutoFocus.addEventListener('change', autoSaveSettings);
  if (toggleNavBottom) toggleNavBottom.addEventListener('change', autoSaveSettings);

  setIntervalEl.addEventListener('input', (e) => {
    valInterval.textContent = `${e.target.value} ciclos`;
    autoSaveSettings();
  });

  // -----------------------------------------------------------
  // Recursos de Reset (Limpar Testes e Reiniciar Ciclos)
  // -----------------------------------------------------------
  async function resetTodayData() {
    const { stats = { streaks: 0, dailyHistory: {} }, timerState = {} } = await chrome.storage.local.get(['stats', 'timerState']);
    const todayStr = new Date().toISOString().split('T')[0];

    if (stats.dailyHistory && stats.dailyHistory[todayStr]) {
      stats.dailyHistory[todayStr] = { count: 0, minutes: 0 };
    }
    timerState.totalCyclesToday = 0;

    await chrome.storage.local.set({ stats, timerState });
    renderStats();
    syncTimerDisplay();
  }
  btnResetTodayStats.addEventListener('click', async () => {
    await resetTodayData();
    btnResetTodayStats.textContent = '✓ Dados de hoje zerados!';
    setTimeout(() => {
      btnResetTodayStats.textContent = '🔄 Zerar Pomodoros de Hoje';
    }, 1500);
  });

  btnResetCycleCount.addEventListener('click', async () => {
    const { timerState = {} } = await chrome.storage.local.get('timerState');
    timerState.cycleCount = 1;
    await chrome.storage.local.set({ timerState });
    syncTimerDisplay();

    btnResetCycleCount.textContent = '✓ Ciclo reiniciado para 1!';
    setTimeout(() => {
      btnResetCycleCount.textContent = '🍅 Resetar para Ciclo 1';
    }, 1500);
  });
  btnResetFactory.addEventListener('click', async () => {
    showConfirm('Aviso de Reset', 'Deseja realmente apagar todo o histórico de estatísticas e restaurar os padrões?', async () => {
      const defaultStats = { streaks: 0, lastActiveDate: null, dailyHistory: {} };
      const { timerState = {}, settings = {} } = await chrome.storage.local.get(['timerState', 'settings']);

      timerState.cycleCount = 1;
      timerState.totalCyclesToday = 0;
      timerState.status = 'idle';
      timerState.remainingMs = 25 * 60 * 1000;
      timerState.targetEndTime = null;

      settings.focusDuration = 25;
      settings.shortBreakDuration = 5;
      settings.longBreakDuration = 15;
      settings.longBreakInterval = 4;

      await chrome.storage.local.set({
        stats: defaultStats,
        timerState,
        settings,
        tasks: []
      });
      loadSettings();
      syncTimerDisplay();
      renderStats();
      renderTasks();
    });
  });

  // -----------------------------------------------------------
  // Inicialização Geral
  // -----------------------------------------------------------
  await loadSettings();
  await loadAudioSettings();
  await renderTasks();
  await renderBlockedSites();
  startLocalLoop();

  // Escuta alterações de storage para manter popup sincronizado
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.timerState || changes.tasks) {
      syncTimerDisplay();
    }
  });
});
