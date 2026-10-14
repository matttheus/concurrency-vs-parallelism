import asyncio
import multiprocessing
import os
import threading
from concurrent.futures import ProcessPoolExecutor

from fastapi import FastAPI

N = 35
app = FastAPI()
pool = ProcessPoolExecutor(mp_context=multiprocessing.get_context("spawn"))


def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)


def who_am_i() -> dict:
    t = threading.current_thread()
    return {"pid": os.getpid(), "thread": f"{t.name} #{t.native_id}"}


def cpu_work() -> dict:
    fib(N)
    return who_am_i()


@app.get("/io")
async def io():
    await asyncio.sleep(1)
    return who_am_i()


@app.get("/cpu")
async def cpu():
    return cpu_work()


@app.get("/cpu-thread")
def cpu_thread():
    return cpu_work()


@app.get("/cpu-parallel")
async def cpu_parallel():
    return await asyncio.get_running_loop().run_in_executor(pool, cpu_work)
