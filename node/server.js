const express = require('express');
const { Worker, threadId } = require('node:worker_threads');
const fib = require('./fib');

const N = 40;
const app = express();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const whoAmI = () => ({ pid: process.pid, threadId });

app.get('/io', async (req, res) => {
  await sleep(1000);
  res.json(whoAmI());
});

app.get('/cpu', (req, res) => {
  fib(N);
  res.json(whoAmI());
});

app.get('/cpu-parallel', (req, res, next) => {
  new Worker(require.resolve('./fib'), { workerData: N })
    .once('message', (result) => res.json(result))
    .once('error', next);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Express listening on http://localhost:${port}`));
