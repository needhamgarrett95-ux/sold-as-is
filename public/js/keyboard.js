// Sold As-Is — custom in-game numeric keyboard
// Replaces the device keyboard for full UI immersion
const GameKB = {
  activeInput: null,
  buf: '',
  onDone: null,
  contextFn: null,

  init() {
    if (document.getElementById('game-kb')) return;
    const html = `
    <div class="kb-overlay" id="kb-overlay"></div>
    <div class="kb" id="game-kb">
      <div class="kb-context" id="kb-context"></div>
      <div class="kb-display"><span id="kb-val"></span><span class="kb-cursor">|</span></div>
      <div class="kb-grid">
        <div class="kb-key" data-k="1">1</div>
        <div class="kb-key" data-k="2">2</div>
        <div class="kb-key" data-k="3">3</div>
        <div class="kb-key" data-k="4">4</div>
        <div class="kb-key" data-k="5">5</div>
        <div class="kb-key" data-k="6">6</div>
        <div class="kb-key" data-k="7">7</div>
        <div class="kb-key" data-k="8">8</div>
        <div class="kb-key" data-k="9">9</div>
        <div class="kb-key fn" data-k="clear">C</div>
        <div class="kb-key" data-k="0">0</div>
        <div class="kb-key fn" data-k="back">⌫</div>
      </div>
      <div class="kb-grid" style="margin-top:8px;grid-template-columns:1fr 1fr;">
        <div class="kb-key fn" data-k="cancel">Cancel</div>
        <div class="kb-key go" data-k="go">Done</div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    const kb = document.getElementById('game-kb');
    const overlay = document.getElementById('kb-overlay');
    overlay.addEventListener('click', () => this.close(false));
    kb.addEventListener('click', (e) => {
      const k = e.target.dataset && e.target.dataset.k;
      if (!k) return;
      // Click sound
      if (typeof AudioEngine !== 'undefined' && AudioEngine.playTap) {
        try { AudioEngine.playTap(); } catch (err) {}
      }
      if (k === 'clear') this.buf = '';
      else if (k === 'back') this.buf = this.buf.slice(0, -1);
      else if (k === 'cancel') return this.close(false);
      else if (k === 'go') return this.close(true);
      else if (this.buf.length < 7) this.buf += k;
      this.render();
    });
  },

  fmt(n) { return n ? '$' + Number(n).toLocaleString() : ''; },

  render() {
    document.getElementById('kb-val').textContent = this.fmt(this.buf);
    const ctx = document.getElementById('kb-context');
    if (ctx) {
      if (this.contextFn) {
        const html = this.contextFn(parseInt(this.buf, 10) || 0);
        ctx.innerHTML = html || '';
        ctx.style.display = html ? '' : 'none';
      } else {
        ctx.style.display = 'none';
      }
    }
  },

  // Attach to an input element. onDone receives the numeric value.
  attach(input, onDone, contextFn) {
    if (!input || input.dataset.kbAttached) return;
    input.dataset.kbAttached = '1';
    input.setAttribute('readonly', 'readonly');
    input.setAttribute('inputmode', 'none');
    input.addEventListener('click', (e) => {
      e.preventDefault();
      this.open(input, onDone, contextFn);
    });
    input.addEventListener('focus', (e) => {
      e.preventDefault();
      input.blur();
      this.open(input, onDone, contextFn);
    });
  },

  open(input, onDone, contextFn) {
    this.init();
    this.activeInput = input;
    this.onDone = onDone || null;
    this.contextFn = contextFn || null;
    this.buf = input.dataset.raw || '';
    this.render();
    document.getElementById('game-kb').classList.add('show');
    document.getElementById('kb-overlay').classList.add('show');
  },

  close(commit) {
    const val = parseInt(this.buf, 10) || 0;
    if (commit && this.activeInput) {
      this.activeInput.dataset.raw = this.buf;
      this.activeInput.value = this.fmt(this.buf);
      if (this.onDone) this.onDone(val);
    }
    document.getElementById('game-kb').classList.remove('show');
    document.getElementById('kb-overlay').classList.remove('show');
    this.activeInput = null;
    this.onDone = null;
    this.contextFn = null;
    this.buf = '';
  },
};

// QWERTY keyboard for text search
const GameQWERTY = {
  activeInput: null,
  buf: '',
  shift: false,

  init() {
    if (document.getElementById('game-qwerty')) return;
    const rows = [
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l'],
      ['shift','z','x','c','v','b','n','m','back'],
      ['clear','space','go'],
    ];
    const html = `
    <div class="kb-overlay" id="qwerty-overlay"></div>
    <div class="kb qwerty" id="game-qwerty">
      <div class="kb-display text"><span id="qwerty-val"></span><span class="kb-cursor">|</span></div>
      ${rows.map((row, ri) => `
        <div class="kb-grid qrow" style="grid-template-columns:repeat(${row.length},1fr);${ri===1?'padding:0 12px;':''}">
          ${row.map(k => {
            if (k === 'shift') return `<div class="kb-key fn" data-k="shift">⇧</div>`;
            if (k === 'back') return `<div class="kb-key fn" data-k="back">⌫</div>`;
            if (k === 'clear') return `<div class="kb-key fn" data-k="clear">C</div>`;
            if (k === 'space') return `<div class="kb-key fn wide" data-k="space" style="grid-column:span 2;">Space</div>`;
            if (k === 'go') return `<div class="kb-key go" data-k="go">Done</div>`;
            return `<div class="kb-key" data-k="${k}">${k}</div>`;
          }).join('')}
        </div>`).join('')}
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    const kb = document.getElementById('game-qwerty');
    const overlay = document.getElementById('qwerty-overlay');
    overlay.addEventListener('click', () => this.close(false));
    kb.addEventListener('click', (e) => {
      const k = e.target.dataset && e.target.dataset.k;
      if (!k) return;
      if (typeof AudioEngine !== 'undefined' && AudioEngine.playTap) {
        try { AudioEngine.playTap(); } catch (err) {}
      }
      if (k === 'shift') {
        this.shift = !this.shift;
        kb.querySelectorAll('.kb-key[data-k]').forEach(key => {
          const kk = key.dataset.k;
          if (kk.length === 1) key.textContent = this.shift ? kk.toUpperCase() : kk.toLowerCase();
        });
        e.target.classList.toggle('active', this.shift);
      }
      else if (k === 'back') this.buf = this.buf.slice(0, -1);
      else if (k === 'clear') this.buf = '';
      else if (k === 'space') this.buf += ' ';
      else if (k === 'go') return this.close(true);
      else if (this.buf.length < 30) this.buf += this.shift ? k.toUpperCase() : k;
      document.getElementById('qwerty-val').textContent = this.buf;
    });
  },

  attach(input, onDone) {
    if (!input || input.dataset.qkbAttached) return;
    input.dataset.qkbAttached = '1';
    input.setAttribute('readonly', 'readonly');
    input.setAttribute('inputmode', 'none');
    const open = (e) => {
      e.preventDefault();
      this.open(input, onDone);
    };
    input.addEventListener('click', open);
    input.addEventListener('focus', (e) => { e.preventDefault(); input.blur(); open(e); });
  },

  open(input, onDone) {
    this.init();
    this.activeInput = input;
    this.onDone = onDone || null;
    this.buf = input.value || '';
    this.shift = false;
    document.getElementById('qwerty-val').textContent = this.buf;
    document.getElementById('game-qwerty').classList.add('show');
    document.getElementById('qwerty-overlay').classList.add('show');
  },

  close(commit) {
    if (commit && this.activeInput) {
      this.activeInput.value = this.buf;
      // Trigger input event for live search
      this.activeInput.dispatchEvent(new Event('input', { bubbles: true }));
      if (this.onDone) this.onDone(this.buf);
    }
    document.getElementById('game-qwerty').classList.remove('show');
    document.getElementById('qwerty-overlay').classList.remove('show');
    this.activeInput = null;
    this.onDone = null;
    this.contextFn = null;
    this.buf = '';
  },
};

// Custom dropdown (replaces native <select>)
const GameDropdown = {
  // Convert a native select into a custom dropdown
  // selectEl: the <select> element, onChange: callback(value)
  enhance(selectEl, onChange) {
    if (!selectEl || selectEl.dataset.ddEnhanced) return;
    selectEl.dataset.ddEnhanced = '1';

    const wrap = document.createElement('div');
    wrap.className = 'dd-wrap';
    selectEl.parentNode.insertBefore(wrap, selectEl);
    wrap.appendChild(selectEl);
    selectEl.style.display = 'none';
    // Visibility is controlled on the WRAP — never let the select's own
    // "hidden" class leak onto the button (that once hid a filter forever),
    // but DO start the wrap hidden when the select starts hidden
    if (selectEl.classList.contains('hidden')) wrap.classList.add('hidden');
    selectEl._ddWrap = wrap;

    const btn = document.createElement('button');
    btn.className = 'dd-btn ' + (selectEl.className || '').split(/\s+/).filter(c => c && c !== 'hidden').join(' ');
    btn.type = 'button';
    wrap.appendChild(btn);

    const menu = document.createElement('div');
    menu.className = 'dd-menu hidden';
    wrap.appendChild(menu);

    const render = () => {
      const opts = [...selectEl.options];
      const sel = opts[selectEl.selectedIndex];
      btn.innerHTML = `<span>${sel ? sel.text : ''}</span><span class="dd-arrow">▾</span>`;
      menu.innerHTML = opts.map((o, i) =>
        `<div class="dd-item${i === selectEl.selectedIndex ? ' sel' : ''}" data-v="${o.value}">${o.text}</div>`
      ).join('');
    };
    render();
    selectEl._ddRender = render;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.dd-menu').forEach(m => { if (m !== menu) m.classList.add('hidden'); });
      menu.classList.toggle('hidden');
    });
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.dd-item');
      if (!item) return;
      selectEl.value = item.dataset.v;
      render();
      menu.classList.add('hidden');
      if (onChange) onChange(item.dataset.v);
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.addEventListener('click', () => menu.classList.add('hidden'));
  },
};
