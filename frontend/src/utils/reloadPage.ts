/** Reloads the current page. A module of its own so tests can stand in for it: jsdom cannot reload. */
export function reloadPage() {
  window.location.reload()
}
