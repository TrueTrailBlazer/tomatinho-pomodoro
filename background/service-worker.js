// Tomatinho Pomodoro - Background Service Worker (Manifest V3)

const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundAlert: 'zen_bell',
  soundVolume: 0.7,
  ambientSound: 'off',
  ambientVolume: 0.5,
  theme: 'light'
};

const DEFAULT_BLOCKED_SITES = [
  'youtube.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'reddit.com',
  'facebook.com',
  'tiktok.com'
];

// -------------------------------------------------------------
// Inicialização da Extensão
// -------------------------------------------------------------
chrome.runtime.onInstalled.addListener(async (details) => {
  const data = await chrome.storage.local.get([
    'timerState',
    'settings',
    'blockedSites',
    'blockerEnabled',
    'tasks',
    'stats'
  ]);

  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  const blockedSites = data.blockedSites || DEFAULT_BLOCKED_SITES;
  const blockerEnabled = data.blockerEnabled !== undefined ? data.blockerEnabled : true;
  const tasks = data.tasks || [];
  const stats = data.stats || {
    streaks: 0,
    lastActiveDate: null,
    dailyHistory: {}
  };

  const timerState = data.timerState || {
    mode: 'focus', // 'focus' | 'shortBreak' | 'longBreak'
    status: 'idle', // 'idle' | 'running' | 'paused'
    targetEndTime: null,
    remainingMs: settings.focusDuration * 60 * 1000,
    cycleCount: 1,
    totalCyclesToday: 0
  };

  await chrome.storage.local.set({
    settings,
    blockedSites,
    blockerEnabled,
    tasks,
    stats,
    timerState
  });

  updateBadge(timerState);
  await updateBlockerRules(false); // Inicia desbloqueado
});

// -------------------------------------------------------------
// Gerenciamento de Documento Offscreen (Áudio MV3)
// -------------------------------------------------------------
async function ensureOffscreenDocument() {
  try {
    if (chrome.offscreen.hasDocument && await chrome.offscreen.hasDocument()) {
      return;
    }
  } catch (e) {
    // Continua para tentar criar se falhar
  }

  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen/offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Reprodução de sons de alarme e ruído ambiente de foco'
    });
  } catch (err) {
    if (!err.message || !err.message.includes('Only a single offscreen document')) {
      console.warn('Offscreen doc creation warning:', err);
    }
  }
}

async function sendAudioMessage(msg) {
  try {
    await ensureOffscreenDocument();
    await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('Erro ao enviar mensagem de áudio:', err);
  }
}

// -------------------------------------------------------------
// Bloqueador de Sites (Declarative Net Request)
// -------------------------------------------------------------
async function updateBlockerRules(shouldBlock) {
  try {
    const data = await chrome.storage.local.get(['blockedSites', 'blockerEnabled']);
    const isEnabled = data.blockerEnabled !== false;
    const sites = data.blockedSites || [];

    // Busca regras existentes para remover
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map(r => r.id);

    if (!shouldBlock || !isEnabled || sites.length === 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds });
      return;
    }

    const addRules = sites.map((site, index) => {
      let domain = site.trim().toLowerCase();
      domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

      return {
        id: 1000 + index,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: {
            regexSubstitution: chrome.runtime.getURL('/blocked/blocked.html?url=\\0')
          }
        },
        condition: {
          regexFilter: `^https?://([a-zA-Z0-9-]+\\.)*${domain}(/.*)?$`,
          resourceTypes: ['main_frame']
        }
      };
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules
    });
  } catch (err) {
    console.error('Erro ao atualizar regras do bloqueador:', err);
  }
}

// -------------------------------------------------------------
// Atualização de Badge no Ícone
// -------------------------------------------------------------
function updateBadge(timerState) {
  if (!timerState) return;

  if (timerState.status === 'idle') {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  let remainingMs = timerState.remainingMs;
  if (timerState.status === 'running' && timerState.targetEndTime) {
    remainingMs = Math.max(0, timerState.targetEndTime - Date.now());
  }

  if (timerState.status === 'paused') {
    chrome.action.setBadgeText({ text: '⏸' });
    chrome.action.setBadgeBackgroundColor({ color: '#868E96' });
    return;
  }

  const minutes = Math.ceil(remainingMs / 60000);
  const badgeText = minutes > 0 ? `${minutes}m` : '0m';
  chrome.action.setBadgeText({ text: badgeText });

  if (timerState.mode === 'focus') {
    chrome.action.setBadgeBackgroundColor({ color: '#FA5252' }); // Vermelho tomate
  } else {
    chrome.action.setBadgeBackgroundColor({ color: '#40C057' }); // Verde folha
  }
}

// -------------------------------------------------------------
// Atualização de Estatísticas e Streaks
// -------------------------------------------------------------
async function recordCompletedPomodoro(durationMinutes) {
  const data = await chrome.storage.local.get(['stats', 'tasks']);
  const stats = data.stats || { streaks: 0, lastActiveDate: null, dailyHistory: {} };
  const today = new Date().toISOString().split('T')[0];

  // Histórico diário
  if (!stats.dailyHistory[today]) {
    stats.dailyHistory[today] = { count: 0, minutes: 0 };
  }
  stats.dailyHistory[today].count += 1;
  stats.dailyHistory[today].minutes += durationMinutes;

  // Cálculo de Streak
  if (stats.lastActiveDate !== today) {
    if (stats.lastActiveDate) {
      const last = new Date(stats.lastActiveDate);
      const cur = new Date(today);
      const diffDays = Math.round((cur - last) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        stats.streaks += 1;
      } else if (diffDays > 1) {
        stats.streaks = 1;
      }
    } else {
      stats.streaks = 1;
    }
    stats.lastActiveDate = today;
  }

  // Atualiza tarefa ativa se houver
  const tasks = data.tasks || [];
  const activeTask = tasks.find(t => t.active && !t.completed);
  if (activeTask) {
    activeTask.completedPomodoros = (activeTask.completedPomodoros || 0) + 1;
  }

  await chrome.storage.local.set({ stats, tasks });
}

// -------------------------------------------------------------
// Finalização de Ciclo (Notificação, Áudio, Transição)
// -------------------------------------------------------------
async function handleCycleFinish() {
  const data = await chrome.storage.local.get(['timerState', 'settings']);
  const timer = data.timerState;
  const settings = data.settings || DEFAULT_SETTINGS;

  const finishedMode = timer.mode;

  // Áudio de término
  if (settings.soundAlert) {
    sendAudioMessage({
      action: 'playAlarm',
      sound: settings.soundAlert,
      volume: settings.soundVolume || 0.7
    });
  }

  // Desativa som ambiente ao finalizar
  sendAudioMessage({ action: 'stopAmbient' });

  // Notificação do Sistema
  const notifIconUrl = '/icons/icon-128.png';
  if (finishedMode === 'focus') {
    await recordCompletedPomodoro(settings.focusDuration);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: notifIconUrl,
      title: 'Ciclo de Foco Concluído!',
      message: 'Parabéns pelo foco! Hora de dar uma pausa e relaxar a mente.',
      priority: 2
    });
  } else {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: notifIconUrl,
      title: 'Pausa Concluída!',
      message: 'Descanso finalizado. Pronto para iniciar o próximo bloco de foco?',
      priority: 2
    });
  }

  // Cálculo do próximo modo
  let nextMode = 'focus';
  let nextCycleCount = timer.cycleCount;
  let nextDuration = settings.focusDuration;

  if (finishedMode === 'focus') {
    const isLongBreak = (timer.cycleCount % settings.longBreakInterval) === 0;
    if (isLongBreak) {
      nextMode = 'longBreak';
      nextDuration = settings.longBreakDuration;
      nextCycleCount = 1;
    } else {
      nextMode = 'shortBreak';
      nextDuration = settings.shortBreakDuration;
      nextCycleCount = timer.cycleCount + 1;
    }
  } else {
    nextMode = 'focus';
    nextDuration = settings.focusDuration;
  }

  const shouldAutoStart = nextMode === 'focus' ? settings.autoStartFocus : settings.autoStartBreaks;
  const nextRemainingMs = nextDuration * 60 * 1000;

  let newStatus = 'idle';
  let targetEndTime = null;

  if (shouldAutoStart) {
    newStatus = 'running';
    targetEndTime = Date.now() + nextRemainingMs;
    chrome.alarms.create('timerAlarm', { when: targetEndTime });
    if (nextMode === 'focus' && settings.ambientSound && settings.ambientSound !== 'off') {
      sendAudioMessage({
        action: 'setAmbient',
        sound: settings.ambientSound,
        volume: settings.ambientVolume
      });
    }
  }

  const newTimerState = {
    mode: nextMode,
    status: newStatus,
    targetEndTime,
    remainingMs: nextRemainingMs,
    cycleCount: nextCycleCount,
    totalCyclesToday: (timer.totalCyclesToday || 0) + (finishedMode === 'focus' ? 1 : 0)
  };

  await chrome.storage.local.set({ timerState: newTimerState });
  updateBadge(newTimerState);
  await updateBlockerRules(newTimerState.mode === 'focus' && newTimerState.status === 'running');
}

// -------------------------------------------------------------
// Alarms Listener
// -------------------------------------------------------------
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'timerAlarm') {
    await handleCycleFinish();
  } else if (alarm.name === 'badgeUpdateAlarm') {
    const { timerState } = await chrome.storage.local.get('timerState');
    updateBadge(timerState);
  }
});

// Alarm regular a cada 1 minuto para manter badge atualizado caso o browser durma
chrome.alarms.create('badgeUpdateAlarm', { periodInMinutes: 1 });

// -------------------------------------------------------------
// Mensagens recebidas do Popup
// -------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startTimer') {
    (async () => {
      const data = await chrome.storage.local.get(['timerState', 'settings']);
      const timer = data.timerState;
      const settings = data.settings || DEFAULT_SETTINGS;

      const targetEndTime = Date.now() + timer.remainingMs;
      chrome.alarms.create('timerAlarm', { when: targetEndTime });

      timer.status = 'running';
      timer.targetEndTime = targetEndTime;

      await chrome.storage.local.set({ timerState: timer });
      updateBadge(timer);

      if (timer.mode === 'focus') {
        await updateBlockerRules(true);
        if (settings.ambientSound && settings.ambientSound !== 'off') {
          sendAudioMessage({
            action: 'setAmbient',
            sound: settings.ambientSound,
            volume: settings.ambientVolume
          });
        }
      }

      sendResponse({ status: 'started', timerState: timer });
    })();
    return true;
  }

  if (message.action === 'pauseTimer') {
    (async () => {
      chrome.alarms.clear('timerAlarm');
      const data = await chrome.storage.local.get('timerState');
      const timer = data.timerState;

      if (timer.targetEndTime) {
        timer.remainingMs = Math.max(0, timer.targetEndTime - Date.now());
      }
      timer.status = 'paused';
      timer.targetEndTime = null;

      await chrome.storage.local.set({ timerState: timer });
      updateBadge(timer);
      await updateBlockerRules(false);
      sendAudioMessage({ action: 'stopAmbient' });

      sendResponse({ status: 'paused', timerState: timer });
    })();
    return true;
  }

  if (message.action === 'skipTimer') {
    (async () => {
      chrome.alarms.clear('timerAlarm');
      await handleCycleFinish();
      sendResponse({ status: 'skipped' });
    })();
    return true;
  }

  if (message.action === 'resetTimer') {
    (async () => {
      chrome.alarms.clear('timerAlarm');
      const data = await chrome.storage.local.get(['timerState', 'settings']);
      const settings = data.settings || DEFAULT_SETTINGS;
      const timer = data.timerState;

      let duration = settings.focusDuration;
      if (timer.mode === 'shortBreak') duration = settings.shortBreakDuration;
      if (timer.mode === 'longBreak') duration = settings.longBreakDuration;

      timer.status = 'idle';
      timer.targetEndTime = null;
      timer.remainingMs = duration * 60 * 1000;

      await chrome.storage.local.set({ timerState: timer });
      updateBadge(timer);
      await updateBlockerRules(false);
      sendAudioMessage({ action: 'stopAmbient' });

      sendResponse({ status: 'reset', timerState: timer });
    })();
    return true;
  }

  if (message.action === 'changeMode') {
    (async () => {
      chrome.alarms.clear('timerAlarm');
      const data = await chrome.storage.local.get(['settings', 'timerState']);
      const settings = data.settings || DEFAULT_SETTINGS;
      const timer = data.timerState;

      timer.mode = message.mode; // 'focus' | 'shortBreak' | 'longBreak'
      timer.status = 'idle';
      timer.targetEndTime = null;

      let duration = settings.focusDuration;
      if (timer.mode === 'shortBreak') duration = settings.shortBreakDuration;
      if (timer.mode === 'longBreak') duration = settings.longBreakDuration;

      timer.remainingMs = duration * 60 * 1000;

      await chrome.storage.local.set({ timerState: timer });
      updateBadge(timer);
      await updateBlockerRules(false);
      sendAudioMessage({ action: 'stopAmbient' });

      sendResponse({ status: 'modeChanged', timerState: timer });
    })();
    return true;
  }

  if (message.action === 'updateBlocker') {
    (async () => {
      const { timerState } = await chrome.storage.local.get('timerState');
      const isFocusing = timerState && timerState.mode === 'focus' && timerState.status === 'running';
      await updateBlockerRules(isFocusing);
      sendResponse({ status: 'ok' });
    })();
    return true;
  }

  if (message.action === 'triggerSoundTest') {
    sendAudioMessage({
      action: 'playAlarm',
      sound: message.sound,
      volume: message.volume
    });
    sendResponse({ status: 'ok' });
    return true;
  }
});
