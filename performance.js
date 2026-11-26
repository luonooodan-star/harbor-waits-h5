'use strict';

function poseSpeaker(name) {
  const body = document.getElementById('body');
  if (!body) return;
  const playingScene = document.body.classList.contains('game-on');
  body.classList.toggle('speaking', playingScene && name === '林遥' && state?.room !== 'after');
  for (const image of document.querySelectorAll('#figures .resident')) {
    const speaking = playingScene && name === image.dataset.speaker && image.dataset.art !== 'xiaoman-later';
    if (image.classList.contains('speaking') === speaking) continue;
    image.classList.toggle('speaking', speaking);
    image.src = artUrl(image.dataset.art + (speaking ? '-talk' : ''));
    if (speaking) harborSound.presence?.(image.dataset.art);
  }
}

function showCityLight(action) {
  const world = document.getElementById('world');
  const lit = state.room === 'after' && state.ending === 'city' &&
    (state.epStep > 0 || action === 0 || state.finished);
  world.classList.toggle('landing-lamp-lit', lit);
}
