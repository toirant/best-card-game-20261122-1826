// shots.js — deterministic states for the maker's screenshots, driven by
// the page's query string: ?shot=title, ?shot=table, ?shot=win, ?shot=loss.
// Each preset builds its state from the game's own rules and cards, so
// every screenshot is a real render of the game's code.

import { makeCardInstance } from './cards.js';
import { startMatch } from './state.js';

/** Read the shot name from the URL, or null for normal play. */
export function shotFromUrl() {
  if (typeof window === 'undefined') return null;
  const shot = new URLSearchParams(window.location.search).get('shot');
  return shot || null;
}

function setRow(hero, defIds) {
  hero.row = defIds.map((id) => makeCardInstance(id));
}

function setHand(hero, defIds) {
  hero.hand = defIds.map((id) => makeCardInstance(id));
}

/** Put the game into the named screenshot state. Returns true when applied. */
export function applyShotPreset(game, shot) {
  if (shot === 'title') {
    game.phase = 'title';
    return true;
  }
  if (shot === 'table') {
    startMatch(game);
    // A lively mid-game: both rows filled, hands full, mana and life visible.
    setRow(game.enemy, ['tide-serpent', 'bramble-wolf', 'stone-sentry']);
    setRow(game.player, ['ember-fox', 'thorn-warden', 'cinder-pup']);
    setHand(game.enemy, ['ember-phoenix', 'flameburst', 'springwater', 'wave-dancer', 'quarry-call']);
    setHand(game.player, ['ember-phoenix', 'flameburst', 'springwater', 'tide-serpent', 'root-snare', 'mountain-colossus', 'quarry-call']);
    game.enemy.life = 14;
    game.player.life = 17;
    game.enemy.mana = 3;
    game.enemy.maxMana = 5;
    game.player.mana = 6;
    game.player.maxMana = 6;
    game.turn = 6;
    game.log = ['Ashborne summons a Tide Serpent (3/4). Your turn — play a card, then End Turn.'];
    return true;
  }
  if (shot === 'win') {
    startMatch(game);
    setRow(game.player, ['ember-phoenix', 'mountain-colossus']);
    setHand(game.player, ['flameburst', 'springwater']);
    game.enemy.life = 0;
    game.player.life = 11;
    game.turn = 9;
    game.phase = 'win';
    game.winner = 'player';
    game.log = ['Ashborne falls. Victory is yours!'];
    return true;
  }
  if (shot === 'loss') {
    startMatch(game);
    setRow(game.enemy, ['tide-serpent', 'ember-phoenix']);
    setHand(game.player, ['cinder-pup', 'thorn-sprout']);
    game.player.life = 0;
    game.enemy.life = 8;
    game.turn = 8;
    game.phase = 'loss';
    game.winner = 'enemy';
    game.log = ['Your ember gutters out. Ashborne wins.'];
    return true;
  }
  return false;
}
