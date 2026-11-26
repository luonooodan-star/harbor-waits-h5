'use strict';
(() => {
  const storageKey = 'harbor.ui.language.v1';
  const languages = {'zh-CN':'简体中文', 'zh-TW':'繁體中文', en:'English'};
  const catalog = new Map(harborPhrases.map(row => [row[0], row]));
  const escape = key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp([...catalog.keys()].sort((a,b) => b.length-a.length).map(escape).join('|'), 'g');
  const originals = new WeakMap();
  const attributes = ['alt','title','aria-label','aria-valuetext','placeholder'];
  let language = 'zh-CN';
  try {
    const saved = localStorage.getItem(storageKey);
    if (Object.hasOwn(languages, saved)) language = saved;
  } catch {}

  function translate(source) {
    if (language === 'zh-CN' || !/[\u3400-\u9fff]/.test(source)) return source;
    const column = language === 'en' ? 2 : 1;
    const result = source.replace(pattern, key => catalog.get(key)[column]);
    return language === 'zh-TW' ? result.replaceAll('“', '「').replaceAll('”', '」') : result;
  }

  // Remember the source for each live text or attribute. The game can replace it
  // at any time, including halfway through a conversation or an animated puzzle.
  function update(node, field, current, write) {
    if (!current) return;
    let fields = originals.get(node);
    const previous = fields?.get(field);
    const source = previous?.rendered === current ? previous.source : current;
    const rendered = translate(source);
    if (!previous && source === rendered) return;
    if (!fields) originals.set(node, fields = new Map());
    fields.set(field, {source, rendered});
    if (current !== rendered) write(rendered);
  }

  function visit(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      update(node,'text',node.data, value => {node.data = value;});
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.matches('script,style,select.language-picker,symbol,[translate=no]')) return;
    for (const attr of attributes) {
      if (node.hasAttribute(attr)) update(node,attr,node.getAttribute(attr),value => node.setAttribute(attr,value));
    }
    for (const child of node.childNodes) visit(child);
  }

  const pickers = [];
  function selectLanguage(value) {
    language = value;
    document.documentElement.lang = value;
    for (const picker of pickers) picker.value = value;
    visit(document.documentElement);
  }

  function makePicker() {
    const picker = document.createElement('select');
    picker.className = 'language-picker';
    picker.setAttribute('aria-label','语言 / 語言 / Language');
    for (const [value, text] of Object.entries(languages)) picker.add(new Option(text,value));
    picker.addEventListener('keydown', event => event.stopPropagation());
    picker.addEventListener('change', () => {
      selectLanguage(picker.value);
      try {localStorage.setItem(storageKey,language);} catch {}
    });
    pickers.push(picker);
    return picker;
  }
  document.getElementById('sound').before(makePicker());
  document.getElementById('panel').prepend(makePicker());
  document.querySelector('#chapter-film footer').prepend(makePicker());
  selectLanguage(language);
  new MutationObserver(changes => {
    for (const change of changes) {
      if (change.type === 'childList') {
        for (const child of change.addedNodes) visit(child);
      } else if (change.type === 'attributes') {
        const node = change.target, attr = change.attributeName;
        update(node,attr,node.getAttribute(attr),value => node.setAttribute(attr,value));
      } else visit(change.target);
    }
  }).observe(document.documentElement, {subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});
})();
