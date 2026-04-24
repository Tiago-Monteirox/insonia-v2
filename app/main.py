from contextlib import asynccontextmanager
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Código aqui roda UMA VEZ quando o servidor sobe
    print("Servidor subindo...")
    yield
    # Código aqui roda quando o servidor desce
    print("Servidor descendo...")


app = FastAPI(title="Insonia v2", lifespan=lifespan)


@app.get("/health")
async def health_check():
    return {"status": "ok"}

