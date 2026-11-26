'use strict';

const endingArchivePrefix = 'harbor.welcome.ending-archive.v1.';
const sessionEndings = new Set();
let endingArchiveWriteFailed = false;

function rememberEnding(key) {
  if (!Object.hasOwn(endings, key)) return;
  sessionEndings.add(key);
  try {
    // Separate markers allow two tabs to finish different endings independently.
    const marker = endingArchivePrefix + key;
    if (localStorage.getItem(marker) !== '1') localStorage.setItem(marker, '1');
  } catch {
    endingArchiveWriteFailed = true;
  }
}

function importCompletedEndings() {
  for (const slot of [saveKey, chapterSaveKey, finaleSaveKey]) {
    const saved = readSave(slot);
    if (saved?.finished && saved.room === 'after') rememberEnding(saved.ending);
  }
}

function collectedEndings() {
  importCompletedEndings();
  try {
    for (const key of Object.keys(endings)) {
      if (localStorage.getItem(endingArchivePrefix + key) === '1') sessionEndings.add(key);
    }
  } catch {
    // The current play session can still open the entries it has earned.
  }
  return sessionEndings;
}

// Preserve finished saves from the previous demo before a player starts over.
window.addEventListener('DOMContentLoaded', importCompletedEndings, {once:true});

function openEndingArchive(onClose) {
  const exit = typeof onClose === 'function' ? onClose : closePanel;

  function openEntry(key) {
    const ending = endings[key];
    const rows = ending.steps.map(([action, , , line]) =>
      '<li><h3>' + action + '</h3><p>' + line + '</p></li>'
    ).join('');
    const body =
      '<figure class="ending-archive-photo"><img alt=""><figcaption><strong>' +
      ending.place + '</strong><span>' + ending.when + '</span></figcaption></figure>' +
      '<p class="panel-text">'+ending.reflection+'</p><p class="ending-coda">'+ending.coda+'</p>'+
      '<ol class="ending-archive-memory">' + rows + '</ol>';
    const back = () => openIndex(key);
    sheet('COLLECTED EPILOGUE', ending.title, body, [['返回收藏', back, true]], back);
    inner.querySelector('.ending-archive-photo img').src = artUrl(ending.art);
  }

  function openIndex(focusKey) {
    const unlocked = collectedEndings();
    const keys = Object.keys(endings);
    const body =
      '<p class="ending-archive-counter" id="ending-archive-count">已收录 <strong>' +
      unlocked.size + ' / ' + keys.length + '</strong></p>' +
      '<ul class="ending-archive-grid" aria-label="尾声馆藏"></ul>' +
      (endingArchiveWriteFailed ? '<p class="caption">浏览器暂时无法保存收藏，本次游玩仍可回看。</p>' : '');
    sheet('EPILOGUE ARCHIVE', '结局收藏', body, [['合上档案', exit]], exit);
    const grid = inner.querySelector('.ending-archive-grid');
    let returnFocus;
    for (const [index, key] of keys.entries()) {
      const item = document.createElement('li');
      const serial = '<span class="ending-archive-number">卷 ' + ['一','二','三','四'][index] + '</span>';
      if (unlocked.has(key)) {
        const ending = endings[key];
        const card = button('', () => openEntry(key), 'ending-archive-card');
        card.setAttribute('aria-label', '回看《' + ending.title + '》');
        card.innerHTML = '<img alt="">' + serial + '<strong>' + ending.title + '</strong>' + icon('arrow');
        card.querySelector('img').src = artUrl(ending.art);
        item.append(card);
        if (focusKey === key) returnFocus = card;
      } else {
        item.className = 'ending-archive-sealed';
        item.innerHTML = serial + '<span class="ending-archive-seal">尚未抵达</span>';
      }
      grid.append(item);
    }
    returnFocus?.focus();
  }

  openIndex();
}
