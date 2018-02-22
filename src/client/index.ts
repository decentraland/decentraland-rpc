// SANITY CHECKS

new Function(`
  XMLHttpRequest = function () {
    throw new Error('XMLHttpRequest is disabled. Please use fetch');
  };
`)()

// Exports

export * from './System'

import * as Transports from './transports'

export { Transports }

export * from './EventSubscriber'
