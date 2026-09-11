const quotes = [
  "Pequenos passos constantes constroem grandes conquistas.",
  "O foco é a arte de saber dizer 'não' para o que não importa agora.",
  "Foque no processo, o resultado vem como consequência natural.",
  "25 minutos passam rápido quando você mergulha de verdade.",
  "Resista à tentação da rolagem infinita. Sua meta é mais valiosa!",
  "A disciplina de hoje é a liberdade de amanhã. Continue firme!",
  "Seu 'eu' do futuro vai agradecer imensamente pelo foco de agora."
];

const countdownEl = document.getElementById('countdown');
const taskContainerEl = document.getElementById('task-container');
const taskTitleEl = document.getElementById('task-title');
const quoteEl = document.getElementById('quote');
const btnBack = document.getElementById('btn-back');
const btnQuote = document.getElementById('btn-quote');

function updateTimerDisplay() {
  chrome.storage.local.get(['timerState', 'tasks'], (result) => {
    const timer = result.timerState;
    if (!timer) {
      countdownEl.textContent = '25:00';
      return;
    }

    let remainingMs = timer.remainingMs || 0;
    if (timer.status === 'running' && timer.targetEndTime) {
      remainingMs = Math.max(0, timer.targetEndTime - Date.now());
    }

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    countdownEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Exibe a tarefa ativa se existir
    const tasks = result.tasks || [];
    const activeTask = tasks.find(t => t.active && !t.completed);
    if (activeTask) {
      taskContainerEl.style.display = 'inline-flex';
      taskTitleEl.textContent = activeTask.text;
    } else {
      taskContainerEl.style.display = 'none';
    }

    // Se o timer não estiver mais em foco ou estiver pausado/concluído
    if (timer.mode !== 'focus' || timer.status !== 'running') {
      countdownEl.textContent = 'Livre!';
      countdownEl.style.color = '#40C057';
      btnBack.textContent = 'Voltar para o site';
      
      // Auto-redirect se possível
      setTimeout(() => {
        goBack();
      }, 1500);
    } else {
      countdownEl.style.color = '';
    }
  });
}

function setRandomQuote() {
  const currentText = quoteEl.textContent;
  const filtered = quotes.filter(q => q !== currentText);
  const picked = filtered[Math.floor(Math.random() * filtered.length)];
  quoteEl.textContent = `"${picked}"`;
}

function goBack() {
  const urlParams = new URLSearchParams(window.location.search);
  const originalUrl = urlParams.get('url');
  
  if (originalUrl) {
    window.location.replace(originalUrl);
  } else if (window.history.length > 1) {
    window.history.back();
  } else {
    window.close();
  }
}

btnBack.addEventListener('click', goBack);
btnQuote.addEventListener('click', setRandomQuote);

// Atualização contínua a cada segundo
updateTimerDisplay();
setInterval(updateTimerDisplay, 1000);

// Escuta mudanças de storage
chrome.storage.onChanged.addListener((changes) => {
  if (changes.timerState || changes.tasks) {
    updateTimerDisplay();
  }
});
