/**
 * 音效管理器
 * 代码生成WAV写入临时文件再播放，小程序兼容方案
 */
var AudioEngine = {
  _pool: {},
  _enabled: true,
  _muted: false,
  _ready: false,
  _fs: null,
  _tmpDir: '',

  _init: function() {
    if (this._ready) return;
    try { this._fs = wx.getFileSystemManager(); } catch(e) {}
    try { this._tmpDir = wx.env.USER_DATA_PATH + '/audio/'; } catch(e) {
      this._tmpDir = '';
    }
    if (this._tmpDir) {
      try {
        this._fs.accessSync(this._tmpDir);
      } catch(e) {
        try { this._fs.mkdirSync(this._tmpDir, true); } catch(e2) {}
      }
    }
    this._ready = true;
  },

  // 生成极短WAV(ArrayBuffer)
  _genWav: function(freq, duration, type, vol) {
    var sr = 8000;
    var samples = Math.ceil(sr * duration);
    var dataLen = samples;
    var buf = new ArrayBuffer(44 + dataLen);
    var view = new DataView(buf);
    var dv = new Uint8Array(buf);
    vol = (vol || 0.4);

    this._wstr(dv, 0, 'RIFF');
    view.setUint32(4, 36 + dataLen, true);
    this._wstr(dv, 8, 'WAVE');
    this._wstr(dv, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, sr, true);
    view.setUint16(32, 1, true);
    view.setUint16(34, 8, true);
    this._wstr(dv, 36, 'data');
    view.setUint32(40, dataLen, true);

    for (var i = 0; i < samples; i++) {
      var t = i / sr, val = 0;
      if (type === 'sine') val = Math.sin(2 * Math.PI * freq * t);
      else if (type === 'square') val = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
      else if (type === 'saw') val = 2 * ((freq * t) % 1) - 1;
      else if (type === 'sweep') { var f2 = freq + t * freq * 3; val = Math.sin(2 * Math.PI * f2 * t); }
      else if (type === 'noise') val = Math.random() * 2 - 1;
      var env = Math.exp(-t * (2 / duration));
      dv[44 + i] = Math.floor(((val * env * vol) + 1) * 127.5);
    }
    return buf;
  },

  _wstr: function(buf, off, s) { for (var i = 0; i < s.length; i++) buf[off + i] = s.charCodeAt(i); },

  _buildMap: function() {
    if (this._buildDone) return;
    this._init();
    var self = this;
    var g = function(f, d, t, v) { return self._genWav(f, d, t, v); };

    this._soundMap = {
      'button_tap':        g(1600, 0.05, 'sine', 0.3),
      'page_navigate':     g(600, 0.08, 'sweep', 0.25),
      'checkin_success':   g(800, 0.15, 'sine', 0.3),
      'card_flip_start':   g(300, 0.1, 'saw', 0.12),
      'card_flip_reveal':  g(500, 0.2, 'sweep', 0.22),
      'rarity_r':          g(440, 0.12, 'sine', 0.25),
      'rarity_sr':         g(550, 0.15, 'sine', 0.25),
      'rarity_ssr':        g(700, 0.18, 'sine', 0.28),
      'rarity_ur':         g(880, 0.25, 'sine', 0.3),
      'achievement_unlock':g(1000, 0.3, 'sine', 0.3),
      'photo_upload':      g(700, 0.08, 'sweep', 0.2)
    };
    this._buildDone = true;
  },

  _getFile: function(key) {
    var self = this;
    if (!this._pool[key]) {
      if (!this._buildDone) this._buildMap();
      var buf = this._soundMap[key];
      if (!buf) return null;
      var fpath = this._tmpDir + 'sfx_' + key + '.wav';
      if (this._fs) {
        try {
          this._fs.writeFileSync(fpath, buf, 'binary');
        } catch(e) {
          return null;
        }
      }
      var audio = wx.createInnerAudioContext();
      audio.src = fpath;
      audio.volume = 0.55;
      audio.obeyMuteSwitch = false;
      audio.onError(function(err) {
        // 静默处理
      });
      this._pool[key] = audio;
    }
    return this._pool[key];
  },

  play: function(key) {
    if (!this._enabled || this._muted) return;
    try {
      var audio = this._getFile(key);
      if (audio) {
        audio.stop();
        audio.seek(0);
        audio.play();
      }
    } catch(e) {}
  },

  preload: function(keys) {
    var self = this;
    keys.forEach(function(k) { self._getFile(k); });
  },

  setEnabled: function(e) { this._enabled = e; },
  setMuted: function(m) { this._muted = m; },
  getAudioManager: function() { return this; }
};

module.exports = AudioEngine;
