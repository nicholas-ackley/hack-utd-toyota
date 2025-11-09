from fastapi import FastAPI   # ✅ <-- you forgot this line
from fastapi.middleware.cors import CORSMiddleware
from routes import chat, recommendation  # ✅ include both route files

app = FastAPI()  # now this works

# ✅ Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # use ["http://localhost:5173"] if you want to restrict it later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Register routes
app.include_router(chat.router, prefix="/api")
app.include_router(recommendation.router, prefix="/api")  # 👈 add this one

@app.get("/")
def root():
    return {"message": "Toyota backend running 🚗"}
