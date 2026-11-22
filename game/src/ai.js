// ai.js — Ashborne, the rival duelist: a readable opponent whose choices
// you can predict and counter. It plays its cheapest useful cards first,
// saves Flameburst for a big creature or a killing blow, heals when hurt,
// and freezes your biggest attacker when it can.

import { canPlayCard, playCard } from './state.js';

/** Pick the enemy creature with the most attack, or null. */
export function biggestThreat(row) {
  let best = null;
  for (const c of row) {
    if (!best || c.attack > best.attack) best = c;
  }
  return best;
}

/** Pick the enemy creature with the most health, or null. */
export function toughestTarget(row) {
  let best = null;
  for (const c of row) {
    if (!best || c.health > best.health) best = c;
  }
  return best;
}

/**
 * Choose the AI's plays for its turn, in order. Returns a list of steps:
 * { card, target } where target is null, a hero target, or a creature.
 * The caller executes them one at a time so the table can animate.
 */
export function planAiTurn(game) {
  const ai = game.enemy;
  const you = game.player;
  const steps = [];
  let mana = ai.mana;
  const hand = [...ai.hand];
  const rowSize = ai.row.length;

  // Heal first when badly hurt and the water is in hand.
  const heal = hand.find((c) => c.effect === 'heal5');
  if (heal && ai.life <= 10 && mana >= heal.cost) {
    steps.push({ card: heal, target: null });
    mana -= heal.cost;
    hand.splice(hand.indexOf(heal), 1);
  }

  // Freeze your biggest attacker so it cannot strike this round.
  const snare = hand.find((c) => c.effect === 'freeze');
  const threat = biggestThreat(you.row);
  if (snare && threat && threat.attack >= 3 && mana >= snare.cost) {
    steps.push({ card: snare, target: { side: 'player', card: threat } });
    mana -= snare.cost;
    hand.splice(hand.indexOf(snare), 1);
  }

  // Flameburst: finish you off, or remove your toughest creature.
  const burst = hand.find((c) => c.effect === 'damage3');
  if (burst && mana >= burst.cost) {
    if (you.life <= 3) {
      steps.push({ card: burst, target: { side: 'player', hero: true } });
      mana -= burst.cost;
      hand.splice(hand.indexOf(burst), 1);
    } else {
      const tough = toughestTarget(you.row);
      if (tough && tough.health <= 3) {
        steps.push({ card: burst, target: { side: 'player', card: tough } });
        mana -= burst.cost;
        hand.splice(hand.indexOf(burst), 1);
      }
    }
  }

  // Draw when the hand is running dry.
  const draw = hand.find((c) => c.effect === 'draw2');
  if (draw && ai.hand.length <= 2 && mana >= draw.cost) {
    steps.push({ card: draw, target: null });
    mana -= draw.cost;
    hand.splice(hand.indexOf(draw), 1);
  }

  // Creatures, cheapest first, while the row has room and mana lasts.
  const creatures = hand
    .filter((c) => c.kind === 'creature')
    .sort((a, b) => a.cost - b.cost || b.attack - a.attack);
  let slots = 5 - rowSize;
  for (const c of creatures) {
    if (slots <= 0) break;
    if (c.cost <= mana) {
      steps.push({ card: c, target: null });
      mana -= c.cost;
      slots--;
    }
  }
  return steps;
}

/** Execute one planned step against the live game state. */
export function executeAiStep(game, step) {
  if (!canPlayCard(game, 'enemy', step.card)) return false;
  return playCard(game, 'enemy', step.card, step.target);
}
