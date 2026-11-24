const stage = document.querySelector('.stage');
const field = document.querySelector('.field');
const intro = document.querySelector('#intro');
const win = document.querySelector('#win');
const start = document.querySelector('#start');
const again = document.querySelector('#again');
const reset = document.querySelector('#reset');
const statusLine = document.querySelector('.status');
const reward = document.querySelector('.reward');
const isPortrait = stage.classList.contains('portrait');
let winTimer;
let active = false;

function finish(message) {
  active = false;
  stage.classList.add('finished');
  reward.hidden = false;
  statusLine.textContent = message;
  field.inert = true;
  winTimer = setTimeout(() => {
    win.hidden = false;
    again.focus();
  }, 1500);
}

const side = 3;
const solved = Array.from({ length: side * side }, (_, index) => index);
const empty = solved.at(-1);
const scramble = [5, 2, 1, 0, 3, 4, 7, 6, 3, 4];
const hints = [3, 6];
let positions;
let gap;
let moves;
const tiles = isPortrait ? solved.slice(0, empty).map((value) => {
  const tile = document.createElement('button');
  tile.className = 'tile';
  tile.setAttribute('aria-label', `Move portrait tile ${value + 1}`);
  tile.style.backgroundPosition = `${(value % side) * 100 / (side - 1)}% ${Math.floor(value / side) * 100 / (side - 1)}%`;
  tile.onclick = () => slide(value);
  field.append(tile);
  return tile;
}) : [];

function swap(index) {
  [positions[gap], positions[index]] = [positions[index], positions[gap]];
  gap = index;
}

function adjacent(index) {
  return Math.abs(index % side - gap % side) + Math.abs(Math.floor(index / side) - Math.floor(gap / side)) === 1;
}

function drawPortrait() {
  const hint = hints[moves];
  positions.forEach((value, index) => {
    const tile = tiles[value];
    if (!tile) return;
    tile.style.left = `${index % side * 100 / side}%`;
    tile.style.top = `${Math.floor(index / side) * 100 / side}%`;
    tile.classList.toggle('hint', index === hint);
    tile.tabIndex = adjacent(index) && (hint === undefined || hint === index) ? 0 : -1;
  });
}

function slide(value) {
  const index = positions.indexOf(value);
  const hint = hints[moves];
  if (!active || !adjacent(index) || (hint !== undefined && hint !== index)) return;
  swap(index);
  moves++;
  drawPortrait();
  if (positions.every((value, index) => value === index)) {
    finish('Portrait restored!');
    return;
  }
  statusLine.textContent = moves < 2 ? 'Tap the glowing tile.' : 'Finish the portrait.';
  if (moves === 1 && document.activeElement === tiles[value]) field.querySelector('.hint').focus();
}

const objects = [...document.querySelectorAll('.object')];
const tray = document.querySelector('.tray');
const checklist = [...document.querySelectorAll('.tray span')];
let foundCount = 0;

function flyToChecklist(object, target) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const from = object.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const flying = document.createElement('span');
  flying.className = 'flying';
  flying.append(object.querySelector('img').cloneNode());
  flying.setAttribute('aria-hidden', 'true');
  flying.style.left = `${from.left + from.width / 2}px`;
  flying.style.top = `${from.top + from.height / 2}px`;
  document.body.append(flying);
  const dx = to.left + to.width / 2 - from.left - from.width / 2;
  const dy = to.top + to.height / 2 - from.top - from.height / 2;
  const animation = flying.animate([
    { transform: 'translate(-50%, -50%) scale(1)' },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.75)` },
  ], { duration: 420, easing: 'ease-out' });
  animation.addEventListener('finish', () => flying.remove());
}

objects.forEach((object, index) => {
  object.onclick = () => {
    if (!active || object.hidden) return;
    tray.classList.remove('hint');
    objects[0].classList.remove('hint');
    flyToChecklist(object, checklist[index].querySelector('b'));
    object.hidden = true;
    checklist[index].classList.add('found');
    checklist[index].querySelector('small').hidden = false;
    foundCount++;
    statusLine.textContent = `${foundCount} of ${objects.length} found`;
    if (foundCount === objects.length) finish('The king is ready for the ball!');
  };
});

function restart() {
  clearTimeout(winTimer);
  active = false;
  stage.classList.remove('finished');
  reward.hidden = true;
  win.hidden = true;
  intro.hidden = false;
  reset.hidden = true;
  field.inert = true;
  statusLine.textContent = '';
  if (isPortrait) {
    positions = [...solved];
    gap = empty;
    moves = 0;
    scramble.forEach(swap);
    drawPortrait();
  } else {
    foundCount = 0;
    tray.classList.remove('hint');
    objects.forEach((object, index) => {
      object.hidden = false;
      object.classList.remove('hint');
      checklist[index].classList.remove('found');
      checklist[index].querySelector('small').hidden = true;
    });
  }
}

start.onclick = () => {
  active = true;
  intro.hidden = true;
  reset.hidden = false;
  field.inert = false;
  if (isPortrait) {
    statusLine.textContent = 'Tap the glowing tile.';
  } else {
    statusLine.textContent = '0 of 4 found';
    tray.classList.add('hint');
    objects[0].classList.add('hint');
  }
  field.querySelector('.hint').focus();
};
reset.onclick = again.onclick = () => {
  restart();
  start.focus();
};
restart();
