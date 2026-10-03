// ===== WhynotGenZ Data Store =====
// All data persists in localStorage.
// Starts completely empty — team builds everything from scratch.

const Store = {
  _listeners: [],

  init() {
    // No seed data — completely empty workspace
  },

  get(key) {
    try {
      const data = localStorage.getItem('whynotgenz_' + key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  set(key, value) {
    localStorage.setItem('whynotgenz_' + key, JSON.stringify(value));
    this._notify(key);
  },

  _notify(key) {
    this._listeners.forEach(fn => fn(key));
  },

  onChange(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  },

  reset() {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('whynotgenz_')) localStorage.removeItem(k);
    });
  }
};
