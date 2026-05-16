from fastapi import FastAPI

app = FastAPI(title="Novaryn AI Platform")

@app.get("/")
def home():
    return {"message": "Novaryn Backend Running"}