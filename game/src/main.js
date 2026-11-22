// main.js — Emberfall Duel's bootstrap: the game loop, the animated turn
// handover, the AI's timed plays, and the wiring between input and state.

import { createGame, startMatch, playCard, canPlayCard, passTurn, creatureAttack, heroOf } from './state.js';
import { planAiTurn, executeAiStep } from './ai.js';
import { drawTable, drawTitleScreen, drawEndScreen, drawFloaters, layoutGame, VIEW_W, VIEW_H } from './render.js';
import { attachInput } from './input.js';
import { shotFromUrl, applyShotPreset } from './shots.js';
import {
  ensureAudio, toggleMute, isMuted,
  playSelectSound, playSummonSound, playSpellSound, playHitSound,
  playTurnSound, playWinSound, playLossSound,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let game = createGame();
const ui = {
  selectedUid: null,
  hoveredUid: null,
  targeting: null, // the spell card awaiting a target, or null
  busy: false, // true while the AI is taking its turn
  floaters: [],
};
let layout = layoutGame(game, ui);
let lastPhase = game.phase;
let lastPlayerLife = game.player.life;
let lastEnemyLife = game.enemy.life;

/** Timed steps, processed by the loop: { at, run }. */
const queue = [];
function later(ms, run) {
  queue.push({ at: performance.now() + ms, run });
}

/** Rebuild the layout after the state changes. */
function refreshLayout() {
  layout = layoutGame(game, ui);
}

/** Start a fresh match from the title or the end screen. */
function restartMatch() {
  ensureAudio();
  const fresh = createGame();
  Object.assign(game, fresh);
  ui.selectedUid = null;
  ui.targeting = null;
  ui.busy = false;
  ui.floaters = [];
  queue.length = 0;
  lastPhase = game.phase;
  lastPlayerLife = game.player.life;
  lastEnemyLife = game.enemy.life;
  refreshLayout();
}

/** Begin the match from the title screen. */
function startMatchAction() {
  ensureAudio();
  startMatch(game);
  playTurnSound();
  refreshLayout();
}

/** Select a card in hand (or clear the selection with null). */
function selectCard(card) {
  ensureAudio();
  ui.targeting = null;
  if (!card) {
    ui.selectedUid = null;
    return;
  }
  if (game.activeSide !== 'player' || game.phase !== 'play') return;
  ui.selectedUid = card.uid;
  playSelectSound();
}

/** Play the selected card: creatures go straight down, spells ask a target. */
function playSelected() {
  ensureAudio();
  if (ui.busy || game.phase !== 'play' || game.activeSide !== 'player') return;
  const card = game.player.hand.find((c) => c.uid === ui.selectedUid);
  if (!card) return;
  if (!canPlayCard(game, 'player', card)) return;
  if (card.kind === 'spell' && (card.effect === 'damage3' || card.effect === 'freeze')) {
    ui.targeting = card;
    return;
  }
  const played = playCard(game, 'player', card, null);
  if (played) {
    ui.selectedUid = null;
    if (card.kind === 'creature') playSummonSound();
    else playSpellSound();
    refreshLayout();
  }
}

/** A spell's target was chosen: resolve the spell against it. */
function targetChosen(target) {
  ensureAudio();
  const card = ui.targeting;
  ui.targeting = null;
  ui.selectedUid = null;
  if (!card) return;
  const played = playCard(game, 'player', card, target);
  if (played) {
    playSpellSound();
    refreshLayout();
  }
}

/** End the player's turn: creatures strike, then the AI answers. */
function endTurnAction() {
  ensureAudio();
  if (ui.busy || game.phase !== 'play' || game.activeSide !== 'player') return;
  ui.busy = true;
  ui.selectedUid = null;
  ui.targeting = null;
  animateRowAttacks('player', () => {
    passTurn(game);
    refreshLayout();
    if (game.phase === 'play' && game.activeSide === 'enemy') runAiTurn();
    else ui.busy = false;
  });
}

/**
 * One creature at a time, left to right, with a beat between strikes,
 * then the callback. Frozen creatures thaw instead of striking.
 */
function animateRowAttacks(side, done) {
  const attackers = [...heroOf(game, side).row];
  let i = 0;
  function next() {
    if (game.phase !== 'play') {
      done();
      return;
    }
    if (i >= attackers.length) {
      done();
      return;
    }
    const attacker = attackers[i++];
    if (!heroOf(game, side).row.includes(attacker)) {
      next();
      return;
    }
    if (attacker.frozen) {
      attacker.frozen = false;
      game.log.push(`${attacker.name} thaws out, too cold to strike.`);
      later(300, next);
      return;
    }
    creatureAttack(game, side, attacker);
    playHitSound();
    refreshLayout();
    later(420, next);
  }
  next();
}

/** The AI's whole turn: play its planned cards, strike, hand back. */
function runAiTurn() {
  const steps = planAiTurn(game);
  let i = 0;
  function nextStep() {
    if (game.phase !== 'play') {
      ui.busy = false;
      return;
    }
    if (i < steps.length) {
      const step = steps[i++];
      if (executeAiStep(game, step)) {
        if (step.card.kind === 'creature') playSummonSound();
        else playSpellSound();
        refreshLayout();
      }
      later(650, nextStep);
      return;
    }
    animateRowAttacks('enemy', () => {
      passTurn(game);
      refreshLayout();
      playTurnSound();
      ui.busy = false;
    });
  }
  later(500, nextStep);
}

/** Watch life totals and float a damage number over the hero who lost it. */
function watchLife() {
  if (game.player.life !== lastPlayerLife) {
    const delta = game.player.life - lastPlayerLife;
    ui.floaters.push({ x: 159, y: 580, text: delta > 0 ? `+${delta}` : `${delta}`, color: delta > 0 ? '#7dff8a' : '#ff6b5e', age: 0, life: 1.1 });
    lastPlayerLife = game.player.life;
  }
  if (game.enemy.life !== lastEnemyLife) {
    const delta = game.enemy.life - lastEnemyLife;
    ui.floaters.push({ x: 204, y: 132, text: delta > 0 ? `+${delta}` : `${delta}`, color: delta > 0 ? '#7dff8a' : '#ff6b5e', age: 0, life: 1.1 });
    lastEnemyLife = game.enemy.life;
  }
}

attachInput(canvas, game, () => ui, () => layout, {
  selectCard,
  playSelected,
  targetChosen,
  endTurn: endTurnAction,
  startMatch: startMatchAction,
  restartMatch,
  toggleMute: () => {
    ensureAudio();
    toggleMute();
  },
  cancelTarget: () => {
    ui.targeting = null;
    ui.selectedUid = null;
  },
});

// Screenshot presets (title, table, win, loss) set the state up directly.
const shot = shotFromUrl();
if (shot) {
  applyShotPreset(game, shot);
  // Presets change life totals; sync the floater baseline so no phantom
  // damage number appears in the screenshot.
  lastPlayerLife = game.player.life;
  lastEnemyLife = game.enemy.life;
}
refreshLayout();

let lastTime = performance.now();

/** The frame loop: advance timers, floaters and sounds, then draw. */
function frame(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  queue.sort((a, b) => a.at - b.at);
  while (queue.length && queue[0].at <= now) queue.shift().run();

  for (const f of ui.floaters) f.age += dt;
  ui.floaters = ui.floaters.filter((f) => f.age < f.life);

  watchLife();
  if (game.phase !== lastPhase) {
    if (game.phase === 'win') playWinSound();
    if (game.phase === 'loss') playLossSound();
    lastPhase = game.phase;
  }

  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.phase === 'title') {
    drawTitleScreen(ctx, now / 1000);
  } else if (game.phase === 'win' || game.phase === 'loss') {
    drawTable(ctx, game, ui, layout);
    drawEndScreen(ctx, game);
  } else {
    drawTable(ctx, game, ui, layout);
    drawFloaters(ctx, ui.floaters);
  }

  // Mute button, bottom right corner.
  ctx.save();
  ctx.beginPath();
  ctx.arc(layout.muteRect.x + 20, layout.muteRect.y + 20, 18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  ctx.strokeStyle = '#d8cdb4';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isMuted() ? '✕' : '♪', layout.muteRect.x + 20, layout.muteRect.y + 21);
  ctx.restore();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
