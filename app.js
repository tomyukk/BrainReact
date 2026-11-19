/*
 * BrainReact — логіка тесту швидкості реакції.
 * Copyright (c) 2026 Томюк Микола Юрійович. All rights reserved.
 * Власний код. Використовує сторонню бібліотеку canvas-confetti (ISC)
 * лише через її публічну функцію window.confetti().
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'brainreact.history';
  const MAX_HISTORY = 5;
  const MIN_DELAY_MS = 1200;
  const MAX_DELAY_MS = 3500;

  const arena = document.getElementById('arena');
  const arenaText = document.getElementById('arena-text');
  const startBtn = document.getElementById('start-btn');
  const resetBtn = document.getElementById('reset-btn');
  const historyList = document.getElementById('history');
  const emptyText = document.getElementById('empty');
  const bestBadge = document.getElementById('best');

  // Стан гри: idle -> waiting -> ready -> idle
  let state = 'idle';
  let timerId = null;
  let readyAt = 0;
  let history = loadHistory();

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      /* сховище недоступне — працюємо лише в пам'яті */
    }
  }

  function bestResult() {
    return history.length ? Math.min(...history.map(r => r.ms)) : null;
  }

  function setArena(newState, text) {
    state = newState;
    arena.className = 'arena ' + newState;
    arenaText.textContent = text;
  }

  function randomDelay() {
    return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  }

  function start() {
    clearTimeout(timerId);
    setArena('waiting', 'Чекайте на зелений…');
    timerId = setTimeout(() => {
      readyAt = performance.now();
      setArena('ready', 'Клацайте!');
    }, randomDelay());
  }

  function handleArenaClick() {
    if (state === 'waiting') {
      clearTimeout(timerId);
      setArena('early', 'Зарано! Натисніть «Старт» ще раз');
      return;
    }
    if (state !== 'ready') return;

    const ms = Math.round(performance.now() - readyAt);
    const previousBest = bestResult();
    history.unshift({ ms, at: new Date().toISOString() });
    history = history.slice(0, MAX_HISTORY);
    saveHistory();

    const isRecord = previousBest === null || ms < previousBest;
    setArena('idle', `${ms} мс${isRecord ? ' — новий рекорд!' : ''}`);
    render();

    if (isRecord && typeof window.confetti === 'function') {
      window.confetti({ particleCount: 120, spread: 70, origin: { y: 0.4 } });
    }
  }

  function reset() {
    clearTimeout(timerId);
    history = [];
    saveHistory();
    setArena('idle', 'Натисніть «Старт»');
    render();
  }

  function render() {
    historyList.innerHTML = '';
    history.forEach((r, i) => {
      const li = document.createElement('li');
      const time = new Date(r.at).toLocaleTimeString('uk-UA');
      li.innerHTML = `<span>Спроба ${history.length - i}</span><strong>${r.ms} мс</strong><small>${time}</small>`;
      historyList.appendChild(li);
    });
    emptyText.hidden = history.length > 0;
    const best = bestResult();
    bestBadge.textContent = 'Рекорд: ' + (best === null ? '—' : best + ' мс');
  }

  startBtn.addEventListener('click', start);
  resetBtn.addEventListener('click', reset);
  arena.addEventListener('mousedown', handleArenaClick);
  arena.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleArenaClick(); }
  });

  render();
})();
