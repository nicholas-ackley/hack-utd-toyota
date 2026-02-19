from fastapi import FastAPI   
from fastapi.middleware.cors import CORSMiddleware
from routes import chat, recommendation 

app = FastAPI()  # now this works

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # use ["http://localhost:5173"] if you want to restrict it later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(recommendation.router, prefix="/api") 

@app.get("/")
def root():
    return {"message": "Toyota backend running 🚗"}
