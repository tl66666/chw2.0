/**
 * App audio manager.
 *
 * Uses packaged static wav files. Missing/unsupported files are disabled per
 * key, so audio never blocks normal mini-program flows.
 */
var SOUND_MAP = {
  button_tap: '/audio/button_tap.wav',
  page_navigate: '/audio/page_navigate.wav',
  checkin_success: '/audio/checkin_success.wav',
  card_flip_start: '/audio/card_flip_start.wav',
  card_flip_reveal: '/audio/card_flip_reveal.wav',
  rarity_r: '/audio/rarity_r.wav',
  rarity_sr: '/audio/rarity_sr.wav',
  rarity_ssr: '/audio/rarity_ssr.wav',
  rarity_ur: '/audio/rarity_ur.wav',
  achievement_unlock: '/audio/achievement_unlock.wav',
  photo_upload: '/audio/photo_upload.wav'
};

var AudioEngine = {
  _pool: {},
  _failed: {},
  _enabled: true,
  _muted: false,

  _get: function(key) {
    if (this._failed[key]) return null;
    var src = SOUND_MAP[key];
    if (!src || !wx.createInnerAudioContext) return null;

    if (!this._pool[key]) {
      var audio = wx.createInnerAudioContext();
      audio.src = src;
      audio.volume = key === 'achievement_unlock' ? 0.7 : 0.48;
      audio.obeyMuteSwitch = true;
      var self = this;
      audio.onError(function() {
        self._failed[key] = true;
        try { audio.destroy(); } catch (e) {}
        delete self._pool[key];
      });
      this._pool[key] = audio;
    }
    return this._pool[key];
  },

  play: function(key) {
    if (!this._enabled || this._muted) return false;
    try {
      var audio = this._get(key);
      if (!audio) return false;
      audio.stop();
      audio.seek(0);
      audio.play();
      return true;
    } catch (e) {
      this._failed[key] = true;
      return false;
    }
  },

  preload: function(keys) {
    keys = keys || Object.keys(SOUND_MAP);
    for (var i = 0; i < keys.length; i++) this._get(keys[i]);
  },

  setEnabled: function(enabled) {
    this._enabled = !!enabled;
  },

  setMuted: function(muted) {
    this._muted = !!muted;
  },

  getAudioManager: function() {
    return this;
  }
};

module.exports = AudioEngine;
