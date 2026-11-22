// state.js — the rules of Emberfall Duel: turns, mana, combat, winning.
// Pure logic, no drawing and no DOM, so it can be tested headlessly.

import { buildDeck, drawCard, makeCardInstance, beatsElement } from './cards.js';

export const START_LIFE = 20;
export const MAX_MANA = 10;
export const MAX_ROW = 5;
export const HAND_LIMIT = 10;

/** A fresh match: both heroes at full life, decks shuffled, hands drawn. */
export function createGame(random = Math.random) {
  const game = {
    phase: 'title', // title | play | win | loss
    turn: 1,
    activeSide: 'player',
    player: makeHero('You', random),
    enemy: makeHero('Ashborne', random),
    log: [],
    winner: null,
    turnCount: 0,
  };
  return game;
}

function makeHero(name, random) {
  const deck = buildDeck(random);
  const hand = [];
  for (let i = 0; i < 4; i++) drawCard(deck, hand);
  return {
    name,
    life: START_LIFE,
    maxLife: START_LIFE,
    mana: 1,
    maxMana: 1,
    deck,
    hand,
    row: [],
    playedThisTurn: 0,
  };
}

/** Start a match from the title screen. */
export function startMatch(game) {
  game.phase = 'play';
  game.turn = 1;
  game.activeSide = 'player';
  game.turnCount = 1;
  game.log = ['The duel begins. Your turn — play a card, then End Turn.'];
  beginTurn(game, game.player);
}

/** Open a side's turn: mana grows by one, refills, and a card is drawn. */
export function beginTurn(game, hero) {
  hero.maxMana = Math.min(MAX_MANA, hero.maxMana + (game.turnCount > 1 ? 1 : 0));
  hero.mana = hero.maxMana;
  for (const c of hero.row) c.justPlayed = false;
  const drawn = drawCard(hero.deck, hero.hand);
  if (drawn) game.log.push(`${hero.name} draw${hero.name === 'You' ? '' : 's'} a card.`);
  else game.log.push(`${hero.name}'s deck is empty!`);
}

export function otherSide(side) {
  return side === 'player' ? 'enemy' : 'player';
}

export function heroOf(game, side) {
  return side === 'player' ? game.player : game.enemy;
}

/** Can this card be played right now by this side? */
export function canPlayCard(game, side, card) {
  const hero = heroOf(game, side);
  if (game.phase !== 'play' || game.activeSide !== side) return false;
  if (!hero.hand.includes(card)) return false;
  if (card.cost > hero.mana) return false;
  if (card.kind === 'creature' && hero.row.length >= MAX_ROW) return false;
  return true;
}

/**
 * Play a card from a hand. Creatures join the row; spells resolve at once.
 * For targeted spells, pass a target: { side, card } for a creature or
 * { side, hero: true } for a hero. Returns true when the card was played.
 */
export function playCard(game, side, card, target = null) {
  const hero = heroOf(game, side);
  const foe = heroOf(game, otherSide(side));
  if (!canPlayCard(game, side, card)) return false;
  hero.hand.splice(hero.hand.indexOf(card), 1);
  hero.mana -= card.cost;
  hero.playedThisTurn++;
  if (card.kind === 'creature') {
    card.justPlayed = true;
    hero.row.push(card);
    game.log.push(`${hero.name} summon${hero.name === 'You' ? '' : 's'} ${card.name} (${card.attack}/${card.health}).`);
    return true;
  }
  return resolveSpell(game, hero, foe, card, target);
}

function resolveSpell(game, hero, foe, card, target) {
  if (card.effect === 'heal5') {
    hero.life = Math.min(hero.maxLife, hero.life + 5);
    game.log.push(`${hero.name} drinks Springwater (+5 life).`);
  } else if (card.effect === 'draw2') {
    drawCard(hero.deck, hero.hand);
    drawCard(hero.deck, hero.hand);
    game.log.push(`${hero.name} calls the quarry and draws 2 cards.`);
  } else if (card.effect === 'damage3') {
    if (target && target.card) {
      damageCreature(game, target.card, 3);
      game.log.push(`Flameburst scorches ${target.card.name} for 3.`);
    } else {
      foe.life -= 3;
      game.log.push(`Flameburst hits ${foe.name} for 3.`);
    }
  } else if (card.effect === 'freeze') {
    if (target && target.card) {
      target.card.frozen = true;
      game.log.push(`Root Snare freezes ${target.card.name}.`);
    } else {
      game.log.push('Root Snare needs an enemy creature to hold.');
      return false;
    }
  }
  checkEnd(game);
  return true;
}

/** Damage a creature on the table; it dies at 0 health. */
export function damageCreature(game, card, amount) {
  card.health -= amount;
  const side = game.player.row.includes(card) ? 'player' : 'enemy';
  if (card.health <= 0) {
    const row = heroOf(game, side).row;
    row.splice(row.indexOf(card), 1);
    game.log.push(`${card.name} is destroyed.`);
  }
}

/**
 * One creature's attack: it strikes the creature opposite it, or the hero
 * when the slot is empty. Elemental edge adds +1 damage.
 */
export function creatureAttack(game, side, attacker) {
  const foe = heroOf(game, otherSide(side));
  const myRow = heroOf(game, side).row;
  const slot = myRow.indexOf(attacker);
  const target = foe.row[slot] ?? null;
  let damage = attacker.attack;
  if (target && beatsElement(attacker.element) === target.element) {
    damage += 1;
    game.log.push(`${attacker.name} has the elemental edge (+1)!`);
  }
  if (target) {
    damageCreature(game, target, damage);
    game.log.push(`${attacker.name} strikes ${target.name} for ${damage}.`);
  } else {
    foe.life -= damage;
    game.log.push(`${attacker.name} hits ${foe.name} for ${damage}.`);
  }
  checkEnd(game);
}

/** A side's whole row attacks, left to right, skipping frozen creatures. */
export function rowAttack(game, side) {
  const row = [...heroOf(game, side).row];
  for (const attacker of row) {
    if (game.phase !== 'play') return;
    if (attacker.frozen) {
      attacker.frozen = false;
      game.log.push(`${attacker.name} thaws out, too cold to strike.`);
      continue;
    }
    creatureAttack(game, side, attacker);
  }
}

/** End the active side's turn: its row strikes, then the turn passes. */
export function endTurn(game) {
  if (game.phase !== 'play') return;
  rowAttack(game, game.activeSide);
  if (game.phase !== 'play') return;
  passTurn(game);
}

/**
 * Hand the turn to the other side without attacking: the next side's mana
 * grows, refills and draws. Used when the caller animates attacks itself.
 */
export function passTurn(game) {
  if (game.phase !== 'play') return;
  game.activeSide = otherSide(game.activeSide);
  if (game.activeSide === 'player') game.turn++;
  game.turnCount++;
  beginTurn(game, heroOf(game, game.activeSide));
  game.log.push(game.activeSide === 'player' ? 'Your turn.' : `${game.enemy.name} takes the table.`);
}

/** A hero at 0 life loses; set the phase and the winner. */
export function checkEnd(game) {
  if (game.phase !== 'play') return;
  if (game.enemy.life <= 0 && game.player.life <= 0) {
    game.phase = 'win';
    game.winner = 'player';
    game.log.push('Both heroes fall — but you struck last. Victory!');
  } else if (game.enemy.life <= 0) {
    game.phase = 'win';
    game.winner = 'player';
    game.log.push('Ashborne falls. Victory is yours!');
  } else if (game.player.life <= 0) {
    game.phase = 'loss';
    game.winner = 'enemy';
    game.log.push('Your ember gutters out. Ashborne wins.');
  }
}

/** A quick summary for the end screens. */
export function matchSummary(game) {
  return {
    turns: game.turn,
    cardsPlayed: game.player.playedThisTurn + game.enemy.playedThisTurn,
    yourLife: Math.max(0, game.player.life),
    foeLife: Math.max(0, game.enemy.life),
  };
}
