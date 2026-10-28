/* Same-origin API transport. Provider keys exist only in server environment variables. */
window.VoraleafFitnessApi = Object.freeze({
  request(path, options = {}) {
    const url = new URL(path, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/fitness/')) {
      return Promise.reject(new Error('Unsupported fitness API route.'));
    }
    return fetch(url, { method: 'GET', cache: 'no-store', credentials: 'same-origin', signal: options.signal, headers: { Accept: 'application/json' } });
  },
  getStatus(options = {}) {
    return this.request('/api/fitness/status', options);
  }
});
