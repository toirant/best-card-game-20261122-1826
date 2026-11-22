// render.js — everything Emberfall Duel shows: the felt table, the heroes,
// the cards with their values and suits, and the title, win and loss screens.
// All art is drawn with canvas shapes; no image files are loaded.

import { ELEMENTS } from './cards.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;

const HAND_CARD_W = 118;
const HAND_CARD_H = 176;
const ROW_CARD_W = 104;
const ROW_CARD_H = 144;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth, startSize, font) {
  let size = startSize;
  ctx.font = `bold ${size}px ${font}`;
  while (size > 9 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `bold ${size}px ${font}`;
  }
  return size;
}

/** Draw one element's glyph: flame, wave, leaf or mountain peak. */
export function drawElementGlyph(ctx, element, cx, cy, size, color) {
  const el = ELEMENTS[element];
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.lineJoin = 'round';
  const s = size / 2;
  if (el.glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.bezierCurveTo(cx + s * 0.9, cy - s * 0.2, cx + s * 0.7, cy + s * 0.7, cx, cy + s);
    ctx.bezierCurveTo(cx - s * 0.7, cy + s * 0.7, cx - s * 0.9, cy - s * 0.2, cx, cy - s);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,120,0.85)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.2);
    ctx.bezierCurveTo(cx + s * 0.45, cy + s * 0.3, cx + s * 0.3, cy + s * 0.75, cx, cy + s * 0.75);
    ctx.bezierCurveTo(cx - s * 0.3, cy + s * 0.75, cx - s * 0.45, cy + s * 0.3, cx, cy - s * 0.2);
    ctx.fill();
  } else if (el.glyph === 'wave') {
    ctx.beginPath();
    for (let i = 0; i <= 3; i++) {
      const x0 = cx - s + (i * 2 * s) / 3;
      ctx.moveTo(x0, cy - s * 0.4 + (i % 2) * s * 0.25);
      ctx.quadraticCurveTo(x0 + s / 3, cy - s * 0.9 + (i % 2) * s * 0.25, x0 + (2 * s) / 3, cy - s * 0.4 + (i % 2) * s * 0.25);
    }
    ctx.lineWidth = Math.max(2, size * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + s * 0.45, s * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (el.glyph === 'leaf') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.quadraticCurveTo(cx + s, cy - s * 0.1, cx, cy + s);
    ctx.quadraticCurveTo(cx - s, cy - s * 0.1, cx, cy - s);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.8);
    ctx.lineTo(cx, cy + s * 0.8);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - s, cy + s * 0.7);
    ctx.lineTo(cx - s * 0.35, cy - s * 0.6);
    ctx.lineTo(cx, cy + s * 0.1);
    ctx.lineTo(cx + s * 0.4, cy - s);
    ctx.lineTo(cx + s, cy + s * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.35, cy - s * 0.6);
    ctx.lineTo(cx - s * 0.12, cy - s * 0.15);
    ctx.lineTo(cx - s * 0.5, cy - s * 0.1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** One card face: cost, name, element art, rules text, attack and health. */
export function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const el = ELEMENTS[card.element];
  const selected = opts.selected === true;
  const playable = opts.playable === true;
  const faceDown = opts.faceDown === true;
  const lift = selected ? -22 : 0;
  const yy = y + lift;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, x, yy, w, h, 10);
  if (faceDown) {
    ctx.fillStyle = '#5a2d1a';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    roundRect(ctx, x + 7, yy + 7, w - 14, h - 14, 7);
    ctx.strokeStyle = '#d8a24a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawElementGlyph(ctx, 'ember', x + w / 2, yy + h / 2, 44, '#d8a24a');
    ctx.restore();
    return { x, y: yy, w, h };
  }
  const grad = ctx.createLinearGradient(x, yy, x, yy + h);
  grad.addColorStop(0, '#fdf6e3');
  grad.addColorStop(1, '#e8d9b0');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  if (selected) {
    ctx.strokeStyle = '#ffd94a';
    ctx.lineWidth = 4;
  } else if (playable) {
    ctx.strokeStyle = '#7dff8a';
    ctx.lineWidth = 2.5;
  } else {
    ctx.strokeStyle = el.dark;
    ctx.lineWidth = 2;
  }
  ctx.stroke();

  // Element band.
  ctx.fillStyle = el.color;
  roundRect(ctx, x + 6, yy + 62, w - 12, 24, 5);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText(el.name.toUpperCase(), x + w / 2, yy + 75);

  // Big element art.
  const artY = opts.showText === false ? yy + 106 : yy + 102;
  const artSize = opts.showText === false ? 44 : 42;
  drawElementGlyph(ctx, card.element, x + w / 2, artY, artSize, el.color);

  // Name, wrapped onto one or two lines below the cost row.
  ctx.fillStyle = '#2b2118';
  drawCardName(ctx, card.name, x + w / 2, w - 12, yy + 40, yy + 54);

  // Rules text (hand cards only; row creatures show just their numbers).
  if (opts.showText !== false) {
    ctx.fillStyle = '#4a3b28';
    ctx.font = 'italic 10px Georgia, serif';
    wrapText(ctx, card.text, x + w / 2, yy + h - 52, w - 16, 12);
  }

  // Cost gem, top left.
  drawGem(ctx, x + 16, yy + 16, 14, '#2f6fd0', String(card.cost));

  if (card.kind === 'creature') {
    // Attack, bottom left; health, bottom right.
    drawGem(ctx, x + 16, yy + h - 15, 14, '#c0392b', String(card.attack));
    drawGem(ctx, x + w - 16, yy + h - 15, 14, '#27ae60', String(card.health));
  } else {
    ctx.fillStyle = '#2f6fd0';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.fillText('SPELL', x + w / 2, yy + h - 14);
  }

  if (card.frozen) {
    ctx.fillStyle = 'rgba(120,200,255,0.45)';
    roundRect(ctx, x, yy, w, h, 10);
    ctx.fill();
    ctx.fillStyle = '#dff4ff';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('FROZEN', x + w / 2, yy + h / 2);
  }
  ctx.restore();
  return { x, y: yy, w, h };
}

/** A card's name, on one line when it fits, else split across two. */
function drawCardName(ctx, name, cx, maxWidth, y1, y2) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px Georgia, serif';
  if (ctx.measureText(name).width <= maxWidth) {
    ctx.fillText(name, cx, y1);
    return;
  }
  const words = name.split(' ');
  const line1 = [];
  let line2 = [];
  for (let i = 0; i < words.length; i++) {
    const trial = [...line1, words[i]].join(' ');
    if (ctx.measureText(trial).width <= maxWidth) line1.push(words[i]);
    else {
      line2 = words.slice(i);
      break;
    }
  }
  ctx.fillText(line1.join(' '), cx, y1);
  ctx.fillText(line2.join(' '), cx, y2);
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [''];
  for (const word of words) {
    const trial = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && lines[lines.length - 1]) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = trial;
    }
  }
  lines.forEach((line, i) => ctx.fillText(line, cx, y + i * lineHeight));
}

function drawGem(ctx, cx, cy, r, color, label) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy + 1);
  ctx.restore();
}

/** A row of hearts showing life, with the number beside it. */
export function drawLifeHearts(ctx, x, y, life, maxLife) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < maxLife; i++) {
    const hx = x + i * 12;
    ctx.fillStyle = i < life ? '#e63946' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(hx, y - 2, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(`${Math.max(0, life)}`, x + maxLife * 12 + 8, y);
  ctx.restore();
}

/** Mana crystals: filled for available, dim for spent. */
export function drawManaCrystals(ctx, x, y, mana, maxMana) {
  ctx.save();
  for (let i = 0; i < maxMana; i++) {
    const cx = x + i * 22;
    ctx.beginPath();
    ctx.moveTo(cx, y - 9);
    ctx.lineTo(cx + 8, y);
    ctx.lineTo(cx, y + 9);
    ctx.lineTo(cx - 8, y);
    ctx.closePath();
    ctx.fillStyle = i < mana ? '#35a7ff' : 'rgba(255,255,255,0.16)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = '#cfe8ff';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${mana}/${maxMana}`, x + maxMana * 22 + 6, y);
  ctx.restore();
}

/**
 * A hero panel. Horizontal by default (portrait left, name, life, mana);
 * compact stacks everything vertically for the player's corner panel.
 * `w` is the panel width for the compact layout.
 */
export function drawHeroPanel(ctx, hero, x, y, isEnemy, opts = {}) {
  ctx.save();
  const accent = isEnemy ? '#e8491d' : '#35a7ff';
  if (opts.compact) {
    const w = opts.w ?? 270;
    const cx = x + w / 2;
    ctx.beginPath();
    ctx.arc(cx, y + 34, 30, 0, Math.PI * 2);
    ctx.fillStyle = isEnemy ? '#3a1c12' : '#12283a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = accent;
    ctx.stroke();
    drawElementGlyph(ctx, isEnemy ? 'ember' : 'tide', cx, y + 34, 32, accent);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(hero.name.toUpperCase(), cx, y + 88);
    ctx.font = '11px Georgia, serif';
    ctx.fillStyle = '#d8cdb4';
    ctx.fillText(isEnemy ? 'Rival Duelist' : 'The Emberfall challenger', cx, y + 106);
    const heartsW = hero.maxLife * 12 + 28;
    drawLifeHearts(ctx, cx - heartsW / 2, y + 128, hero.life, hero.maxLife);
    const manaW = hero.maxMana * 22 + 34;
    drawManaCrystals(ctx, cx - manaW / 2, y + 156, hero.mana, hero.maxMana);
    ctx.restore();
    return;
  }
  ctx.beginPath();
  ctx.arc(x + 34, y + 34, 30, 0, Math.PI * 2);
  ctx.fillStyle = isEnemy ? '#3a1c12' : '#12283a';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = accent;
  ctx.stroke();
  drawElementGlyph(ctx, isEnemy ? 'ember' : 'tide', x + 34, y + 34, 32, accent);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 19px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(hero.name.toUpperCase(), x + 78, y + 26);
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = '#d8cdb4';
  ctx.fillText(isEnemy ? 'Rival Duelist' : 'You · the Emberfall challenger', x + 78, y + 46);
  drawLifeHearts(ctx, x + 78, y + 68, hero.life, hero.maxLife);
  if (opts.showMana) drawManaCrystals(ctx, x + 78, y + 92, hero.mana, hero.maxMana);
  ctx.restore();
}

/** Where every clickable thing sits on the table, for input hit-testing. */
export function layoutGame(game, ui) {
  const hand = game.player.hand;
  const handTotal = hand.length * (HAND_CARD_W + 6) - 6;
  const handX = 310 + Math.max(0, (970 - handTotal) / 2);
  const handRects = hand.map((card, i) => ({
    card,
    x: handX + i * (HAND_CARD_W + 6),
    y: VIEW_H - HAND_CARD_H - 14,
    w: HAND_CARD_W,
    h: HAND_CARD_H,
  }));

  const enemyHandRects = game.enemy.hand.slice(0, 7).map((card, i) => ({
    card,
    x: VIEW_W - 220 + i * 34,
    y: 18,
    w: 30,
    h: 44,
  }));

  const playerRowRects = game.player.row.map((card, i) => ({
    card,
    x: 330 + i * (ROW_CARD_W + 14),
    y: 376,
    w: ROW_CARD_W,
    h: ROW_CARD_H,
  }));
  const enemyRowRects = game.enemy.row.map((card, i) => ({
    card,
    x: 330 + i * (ROW_CARD_W + 14),
    y: 154,
    w: ROW_CARD_W,
    h: ROW_CARD_H,
  }));

  return {
    handRects,
    enemyHandRects,
    playerRowRects,
    enemyRowRects,
    endTurnRect: { x: 1100, y: 556, w: 150, h: 48 },
    enemyHeroRect: { x: 24, y: 14, w: 360, h: 100 },
    playerHeroRect: { x: 24, y: 596, w: 270, h: 190 },
    deckRect: { x: 1160, y: 380, w: 84, h: 120 },
    muteRect: { x: 1230, y: 740, w: 40, h: 40 },
  };
}

/** The green felt table with a wooden rim and a soft centre glow. */
export function drawTableBackground(ctx) {
  ctx.save();
  ctx.fillStyle = '#20242c';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const felt = ctx.createRadialGradient(640, 400, 80, 640, 400, 760);
  felt.addColorStop(0, '#2e6b46');
  felt.addColorStop(1, '#173d27');
  roundRect(ctx, 14, 14, VIEW_W - 28, VIEW_H - 28, 22);
  ctx.fillStyle = felt;
  ctx.fill();
  ctx.strokeStyle = '#8a6a3b';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  roundRect(ctx, 30, 30, VIEW_W - 60, VIEW_H - 60, 16);
  ctx.stroke();
  // Centre line between the two rows.
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(330, 322);
  ctx.lineTo(950, 322);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawEndTurnButton(ctx, rect, enabled, label) {
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fillStyle = enabled ? '#d8a24a' : '#6b6b6b';
  ctx.fill();
  ctx.strokeStyle = '#fff2cf';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#241a08';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.restore();
}

function drawDeckPile(ctx, rect, count) {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    roundRect(ctx, rect.x - i * 3, rect.y - i * 3, rect.w, rect.h, 8);
    ctx.fillStyle = i === 0 ? '#5a2d1a' : '#4a2415';
    ctx.fill();
    ctx.strokeStyle = '#d8a24a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${count}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.font = '11px Georgia, serif';
  ctx.fillText('DECK', rect.x + rect.w / 2, rect.y + rect.h + 14);
  ctx.restore();
}

/** The live duel table: both hands, both rows, life, mana and the log. */
export function drawTable(ctx, game, ui, layout) {
  drawTableBackground(ctx);

  // Opponent's hand as face-down backs, top right.
  for (const r of layout.enemyHandRects) {
    drawCardFace(ctx, r.card, r.x, r.y, r.w, r.h, { faceDown: true });
  }
  ctx.fillStyle = '#e8dcc0';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${game.enemy.hand.length} cards`, VIEW_W - 24, 96);

  drawHeroPanel(ctx, game.enemy, 24, 14, true, { showMana: true });

  // Rows.
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ASHBORNE’S CREATURES', 330, 146);
  ctx.fillText('YOUR CREATURES', 330, 368);
  for (const r of layout.enemyRowRects) {
    drawCardFace(ctx, r.card, r.x, r.y, r.w, r.h, { showText: false });
  }
  for (const r of layout.playerRowRects) {
    drawCardFace(ctx, r.card, r.x, r.y, r.w, r.h, { showText: false });
  }

  // Deck pile and the log line.
  drawDeckPile(ctx, layout.deckRect, game.player.deck.length);
  if (game.phase === 'play') {
    const lastLog = game.log[game.log.length - 1] || '';
    ctx.fillStyle = '#f4ead2';
    ctx.font = 'italic 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(lastLog, 640, 342);
  }

  // Player hero panel (compact, bottom left) and mana.
  drawHeroPanel(ctx, game.player, 24, 596, false, { showMana: true, compact: true, w: 270 });

  // Hand.
  for (const r of layout.handRects) {
    const playable = game.activeSide === 'player' && r.card.cost <= game.player.mana;
    drawCardFace(ctx, r.card, r.x, r.y, r.w, r.h, {
      selected: ui.selectedUid === r.card.uid,
      playable,
    });
  }

  // Targeting hint.
  if (ui.targeting) {
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Choose a target for ${ui.targeting.name} — click an enemy creature or hero`, 640, 548);
  } else if (game.activeSide === 'player' && game.phase === 'play') {
    ctx.fillStyle = '#e8dcc0';
    ctx.font = '13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click a card to play it · keys 1–7 select · Enter plays · Space ends turn', 640, 548);
  } else if (game.activeSide === 'enemy') {
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ashborne is thinking…', 640, 548);
  }

  drawEndTurnButton(ctx, layout.endTurnRect, game.activeSide === 'player', 'END TURN');
}

/** The title screen: name, element wheel, how to play, and the start cue. */
export function drawTitleScreen(ctx, time) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#1a0f2e');
  sky.addColorStop(0.55, '#3d1a3d');
  sky.addColorStop(1, '#7a2e1d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Drifting embers.
  for (let i = 0; i < 40; i++) {
    const ex = (i * 97 + time * 12) % VIEW_W;
    const ey = VIEW_H - ((i * 173 + time * 30) % (VIEW_H + 40)) + 20;
    ctx.fillStyle = `rgba(255,${140 + (i % 60)},60,${0.25 + (i % 10) / 30})`;
    ctx.beginPath();
    ctx.arc(ex, ey, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('A DUEL OF FOUR ELEMENTS', 640, 150);
  ctx.fillStyle = '#fff6e0';
  ctx.font = 'bold 92px Georgia, serif';
  ctx.fillText('EMBERFALL', 640, 250);
  ctx.font = 'bold 92px Georgia, serif';
  ctx.fillStyle = '#ff8a3d';
  ctx.fillText('DUEL', 640, 340);
  ctx.fillStyle = '#f4ead2';
  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillText('Outwit Ashborne, the rival duelist. Spend mana, summon creatures,', 640, 392);
  ctx.fillText('bend the elements — and bring their life to zero.', 640, 420);

  // Element wheel.
  const wheel = ['ember', 'tide', 'thorn', 'stone'];
  wheel.forEach((el, i) => {
    const cx = 640 + (i - 1.5) * 150;
    ctx.beginPath();
    ctx.arc(cx, 500, 52, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    ctx.strokeStyle = ELEMENTS[el].color;
    ctx.lineWidth = 3;
    ctx.stroke();
    drawElementGlyph(ctx, el, cx, 494, 46, ELEMENTS[el].color);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText(ELEMENTS[el].name.toUpperCase(), cx, 566);
  });
  ctx.fillStyle = '#d8cdb4';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('Ember beats Thorn · Thorn beats Stone · Stone beats Tide · Tide beats Ember (+1 damage)', 640, 604);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Georgia, serif';
  const pulse = 0.7 + 0.3 * Math.sin(time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillText('CLICK OR PRESS ENTER TO PLAY', 640, 668);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#d8cdb4';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('Mouse + keyboard · 1–7 select a card · Enter plays it · Space ends your turn · M mutes', 640, 706);
  ctx.restore();
}

/** The win or loss screen, with the match summary. */
export function drawEndScreen(ctx, game) {
  const won = game.phase === 'win';
  ctx.save();
  ctx.fillStyle = won ? 'rgba(20,60,30,0.88)' : 'rgba(50,16,16,0.88)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#ffd94a' : '#ff6b5e';
  ctx.font = 'bold 96px Georgia, serif';
  ctx.fillText(won ? 'VICTORY!' : 'DEFEAT', 640, 300);
  ctx.fillStyle = '#fff6e0';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText(
    won ? 'Ashborne falls — the Emberfall crown is yours.' : 'Your ember gutters out. Ashborne takes the table.',
    640,
    356,
  );
  const s = {
    turns: game.turn,
    yourLife: Math.max(0, game.player.life),
    foeLife: Math.max(0, game.enemy.life),
  };
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillStyle = '#f4ead2';
  ctx.fillText(`Turns played: ${s.turns}    ·    Your life: ${s.yourLife}    ·    Ashborne's life: ${s.foeLife}`, 640, 430);
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = '#d8cdb4';
  ctx.fillText('Press R or click to play again', 640, 500);
  ctx.restore();
}

/** Floating damage numbers that drift up and fade. */
export function drawFloaters(ctx, floaters) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of floaters) {
    ctx.globalAlpha = Math.max(0, 1 - f.age / f.life);
    ctx.fillStyle = f.color;
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillText(f.text, f.x, f.y - f.age * 40);
  }
  ctx.restore();
}
