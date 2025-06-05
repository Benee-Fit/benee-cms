// Declare the withResolvers method for TypeScript
declare global {
  interface PromiseConstructor {
    withResolvers<T = any>(): {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => void;
      reject: (reason?: any) => void;
    };
  }
}

// Polyfill for Promise.withResolvers
if (typeof Promise.withResolvers !== 'function') {
  Object.defineProperty(Promise, 'withResolvers', {
    value: () => {
      let resolve: (value: any) => void = () => {};
      let reject: (reason?: any) => void = () => {};
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    },
    configurable: true,
    writable: true
  });
}

export {};
