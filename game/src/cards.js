// cards.js — every card in Emberfall Duel: its cost, its numbers, its element.
// Four elements form a wheel: Ember beats Thorn, Thorn beats Stone,
// Stone beats Tide, Tide beats Ember. A creature attacking a creature of
// the element it beats deals +1 damage.

export const ELEMENTS = {
  ember: { name: 'Ember', color: '#e8491d', dark: '#8f1f05', glyph: 'flame' },
  tide: { name: 'Tide', color: '#1d9be8', dark: '#0a4d7a', glyph: 'wave' },
  thorn: { name: 'Thorn', color: '#3fae4a', dark: '#14591f', glyph: 'leaf' },
  stone: { name: 'Stone', color: '#9a8f7a', dark: '#4d463c', glyph: 'peak' },
};

/** The element this one beats, or null. */
export function beatsElement(element) {
  if (element === 'ember') return 'thorn';
  if (element === 'thorn') return 'stone';
  if (element === 'stone') return 'tide';
  if (element === 'tide') return 'ember';
  return null;
}

/**
 * One card definition. Creatures carry attack/health; spells carry an
 * effect id and a short rules line shown on the card.
 */
export const CARD_DEFS = [
  { id: 'cinder-pup', name: 'Cinder Pup', kind: 'creature', element: 'ember', cost: 1, attack: 2, health: 1, text: 'A spark with teeth.' },
  { id: 'tide-sprite', name: 'Tide Sprite', kind: 'creature', element: 'tide', cost: 1, attack: 1, health: 2, text: 'It giggles in the surf.' },
  { id: 'thorn-sprout', name: 'Thorn Sprout', kind: 'creature', element: 'thorn', cost: 1, attack: 1, health: 3, text: 'Small. Prickly. Patient.' },
  { id: 'pebble-imp', name: 'Pebble Imp', kind: 'creature', element: 'stone', cost: 1, attack: 1, health: 2, text: 'Throws itself at you.' },
  { id: 'ember-fox', name: 'Ember Fox', kind: 'creature', element: 'ember', cost: 2, attack: 3, health: 2, text: 'Leaves a trail of ash.' },
  { id: 'wave-dancer', name: 'Wave Dancer', kind: 'creature', element: 'tide', cost: 2, attack: 2, health: 3, text: 'Never where you strike.' },
  { id: 'bramble-wolf', name: 'Bramble Wolf', kind: 'creature', element: 'thorn', cost: 2, attack: 3, health: 2, text: 'Howls through the hedge.' },
  { id: 'stone-sentry', name: 'Stone Sentry', kind: 'creature', element: 'stone', cost: 2, attack: 2, health: 4, text: 'It was a wall first.' },
  { id: 'tide-serpent', name: 'Tide Serpent', kind: 'creature', element: 'tide', cost: 3, attack: 3, health: 4, text: 'The river, with opinions.' },
  { id: 'thorn-warden', name: 'Thorn Warden', kind: 'creature', element: 'thorn', cost: 3, attack: 2, health: 6, text: 'Guardian of the green.' },
  { id: 'ember-phoenix', name: 'Ember Phoenix', kind: 'creature', element: 'ember', cost: 5, attack: 5, health: 4, text: 'Burns bright, returns brighter.' },
  { id: 'mountain-colossus', name: 'Mountain Colossus', kind: 'creature', element: 'stone', cost: 6, attack: 6, health: 7, text: 'The hill got up.' },
  { id: 'flameburst', name: 'Flameburst', kind: 'spell', element: 'ember', cost: 2, effect: 'damage3', text: 'Deal 3 damage to a creature or hero.' },
  { id: 'springwater', name: 'Springwater', kind: 'spell', element: 'tide', cost: 2, effect: 'heal5', text: 'Restore 5 life to your hero.' },
  { id: 'quarry-call', name: 'Quarry Call', kind: 'spell', element: 'stone', cost: 3, effect: 'draw2', text: 'Draw 2 cards.' },
  { id: 'root-snare', name: 'Root Snare', kind: 'spell', element: 'thorn', cost: 1, effect: 'freeze', text: 'Freeze an enemy creature: it cannot attack next turn.' },
];

export const CARD_BY_ID = Object.fromEntries(CARD_DEFS.map((c) => [c.id, c]));

let nextInstanceId = 1;

/** A live copy of a card definition, as it sits in a hand, deck or row. */
export function makeCardInstance(defId) {
  const def = CARD_BY_ID[defId];
  return {
    uid: nextInstanceId++,
    defId: def.id,
    name: def.name,
    kind: def.kind,
    element: def.element,
    cost: def.cost,
    attack: def.attack ?? 0,
    health: def.health ?? 0,
    maxHealth: def.health ?? 0,
    effect: def.effect ?? null,
    text: def.text,
    frozen: false,
    justPlayed: false,
  };
}

/** A shuffled 28-card deck: two copies of every definition. */
export function buildDeck(random = Math.random) {
  const deck = [];
  for (const def of CARD_DEFS) {
    deck.push(makeCardInstance(def.id));
    deck.push(makeCardInstance(def.id));
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Draw the top card of a deck into a hand; returns the card or null. */
export function drawCard(deck, hand) {
  const card = deck.pop();
  if (!card) return null;
  if (hand.length < 10) hand.push(card);
  return card;
}
