// input.js — mouse and keyboard for Emberfall Duel: click a card to select
// it, click again (or press Enter) to play it, click a target for a spell,
// Space ends the turn. All hit-testing uses the renderer's layout.

import { layoutGame } from './render.js';

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/**
 * Wire the canvas and the keyboard to the game. `actions` is the set of
 * callbacks the main loop provides: selectCard, playSelected, playCard,
 * targetChosen, endTurn, startMatch, restartMatch, toggleMute, cancelTarget.
 * `getLayout` returns the current layout, `getUi` the current ui state.
 */
export function attachInput(canvas, game, getUi, getLayout, actions) {
  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('click', (event) => {
    const { x, y } = toGameCoords(event);
    const ui = getUi();
    const layout = getLayout();

    if (game.phase === 'title') {
      actions.startMatch();
      return;
    }
    if (game.phase === 'win' || game.phase === 'loss') {
      actions.restartMatch();
      return;
    }
    if (game.phase !== 'play') return;

    // Mute button.
    if (pointInRect(x, y, layout.muteRect)) {
      actions.toggleMute();
      return;
    }

    // Targeting a spell: enemy creature first, then the enemy hero.
    if (ui.targeting) {
      for (const r of layout.enemyRowRects) {
        if (pointInRect(x, y, r)) {
          actions.targetChosen({ side: 'enemy', card: r.card });
          return;
        }
      }
      if (pointInRect(x, y, layout.enemyHeroRect)) {
        actions.targetChosen({ side: 'enemy', hero: true });
        return;
      }
      actions.cancelTarget();
      return;
    }

    // End Turn button.
    if (pointInRect(x, y, layout.endTurnRect)) {
      actions.endTurn();
      return;
    }

    // A card in hand: select it, or play it when already selected.
    for (const r of layout.handRects) {
      if (pointInRect(x, y, r)) {
        if (ui.selectedUid === r.card.uid) actions.playSelected();
        else actions.selectCard(r.card);
        return;
      }
    }

    // Clicking anywhere else clears the selection.
    actions.selectCard(null);
  });

  canvas.addEventListener('mousemove', (event) => {
    const { x, y } = toGameCoords(event);
    const layout = getLayout();
    const ui = getUi();
    ui.hoveredUid = null;
    for (const r of layout.handRects) {
      if (pointInRect(x, y, r)) {
        ui.hoveredUid = r.card.uid;
        break;
      }
    }
  });

  window.addEventListener('keydown', (event) => {
    const ui = getUi();
    if (event.key === 'm' || event.key === 'M') {
      actions.toggleMute();
      return;
    }
    if (game.phase === 'title' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      actions.startMatch();
      return;
    }
    if ((game.phase === 'win' || game.phase === 'loss') && (event.key === 'r' || event.key === 'R' || event.key === 'Enter')) {
      actions.restartMatch();
      return;
    }
    if (game.phase !== 'play' || game.activeSide !== 'player') return;
    if (event.key === 'Escape') {
      if (ui.targeting) actions.cancelTarget();
      else actions.selectCard(null);
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      actions.endTurn();
      return;
    }
    if (event.key === 'Enter') {
      if (ui.selectedUid != null) actions.playSelected();
      return;
    }
    const digit = parseInt(event.key, 10);
    if (digit >= 1 && digit <= 7) {
      const card = game.player.hand[digit - 1];
      if (card) actions.selectCard(card);
    }
  });
}
