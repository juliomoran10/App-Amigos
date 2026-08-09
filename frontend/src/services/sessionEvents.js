let handler = null;

export function setSessionExpiredHandler(cb) {
  handler = cb;
}

export function emitSessionExpired() {
  if (handler) {
    handler();
  }
}
