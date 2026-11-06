function read(): string {
  const h = location.hash.replace(/^#/, '');
  return h.split('?')[0] || '/';
}

class Router {
  path = $state(read());

  constructor() {
    window.addEventListener('hashchange', () => {
      this.path = read();
    });
  }
}

export const router = new Router();

export function go(path: string) {
  if (location.hash !== `#${path}`) location.hash = path;
}
