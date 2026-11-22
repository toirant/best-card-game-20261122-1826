[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/toirant/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/toirant/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Emberfall Duel

An original turn-based card battler for the make.fun bounty
**best-card-game-20261122-1826** ($50 shared by the top 10).

You are the Emberfall challenger, duelling Ashborne, a rival who plays
readable, counterable cards. Spend mana, summon creatures, bend the four
elements — and bring Ashborne's life to zero before yours runs out.

## How to play

- **Click a card** to select it, **click again** (or press **Enter**) to play it.
- **Keys 1–7** select a card in hand. **Space** ends your turn. **M** mutes.
- **Esc** cancels a spell target. **R** plays again after a win or loss.
- Each turn your mana grows by 1 (up to 10), refills, and you draw a card.
- Creatures strike at the end of their owner's turn: each hits the creature
  opposite it, or the enemy hero when the slot is empty.
- **Elements matter:** Ember beats Thorn, Thorn beats Stone, Stone beats
  Tide, Tide beats Ember — an attacker with the edge deals +1 damage.

## The cards

Four elements, sixteen designs, thirty-two cards a deck:

- **Creatures** — cost mana, carry attack and health: Cinder Pup, Ember Fox,
  Ember Phoenix, Tide Sprite, Wave Dancer, Tide Serpent, Thorn Sprout,
  Bramble Wolf, Thorn Warden, Pebble Imp, Stone Sentry, Mountain Colossus.
- **Spells** — Flameburst (deal 3 to a creature or hero), Springwater
  (restore 5 life), Quarry Call (draw 2 cards), Root Snare (freeze an enemy
  creature so it cannot strike next turn).

Ashborne plays by rules you can read: it heals when hurt, freezes your
biggest attacker, saves Flameburst for a killing blow or a tough creature,
and fills its row cheapest-first.

## Play it

Serve `game/` with any static server and open `index.html` in desktop
Chrome — no build step, no network requests, all art drawn on canvas and
all sounds synthesized with WebAudio:

```sh
cd game && python3 -m http.server 8080
```

Screenshot states for the maker: `?shot=title`, `?shot=table`,
`?shot=win`, `?shot=loss`.

## Layout

- `main.ts` — hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `/output/dossier.json` via `vendor/makefun-game.ts`.
  Run it with `MAKEFUN_OUTPUT_DIR=out node main.ts`.
- `game/index.html` + `game/src/` — the game, one file per job: `cards`
  (definitions, deck, elements), `state` (turns, mana, combat, winning),
  `ai` (Ashborne's brain), `render` (table, cards, screens), `input`
  (mouse and keyboard), `audio` (synthesized sounds), `shots`
  (screenshot presets), `main` (loop and turn handover).
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
