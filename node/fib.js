const { isMainThread, parentPort, workerData, threadId } = require('node:worker_threads');

const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2));

if (!isMainThread) {
  fib(workerData);
  parentPort.postMessage({ pid: process.pid, threadId });
}

module.exports = fib;
