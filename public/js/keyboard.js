// Sold As-Is — custom in-game numeric keyboard
// Replaces the device keyboard for full UI immersion
const GameKB = {
  activeInput: null,
  buf: '',
  onDone: null,

  init() {
    if (document.getElementById('game-kb')) return;
    const html = `
    <div class="kb-overlay" id="kb-overlay"></div>
    <div class="kb" id="game-kb">
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
  },

  // Attach to an input element. onDone receives the numeric value.
  attach(input, onDone) {
    if (!input || input.dataset.kbAttached) return;
    input.dataset.kbAttached = '1';
    input.setAttribute('readonly', 'readonly');
    input.setAttribute('inputmode', 'none');
    input.addEventListener('click', (e) => {
      e.preventDefault();
      this.open(input, onDone);
    });
    input.addEventListener('focus', (e) => {
      e.preventDefault();
      input.blur();
      this.open(input, onDone);
    });
  },

  open(input, onDone) {
    this.init();
    this.activeInput = input;
    this.onDone = onDone || null;
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
    this.buf = '';
  },
};
