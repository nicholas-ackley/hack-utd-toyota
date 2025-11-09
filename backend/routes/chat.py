from fastapi import APIRouter, Request
from openai import OpenAI
import requests, os
from dotenv import load_dotenv
from pathlib import Path

# ✅ Load environment
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)

# ✅ Initialize clients
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ✅ Toyota API config
TOYOTA_API_URL = "https://car-api2.p.rapidapi.com/api/models"
HEADERS = {
    "x-rapidapi-key": os.getenv("TOYOTA_API_KEY"),
    "x-rapidapi-host": os.getenv("TOYOTA_API_HOST"),
}

router = APIRouter()

@router.post("/chat")
async def chat(request: Request):
    data = await request.json()
    user_msg = data.get("message", "").strip().lower()

    # --- 1️⃣ Fetch Toyota data if relevant ---
    car_info = ""
    if "toyota" in user_msg or "car" in user_msg:
        try:
            res = requests.get(
                TOYOTA_API_URL,
                headers=HEADERS,
                params={"make": "toyota", "limit": 5},
                timeout=10
            )
            data = res.json()
            models = [m["name"] for m in data.get("data", [])]
            if models:
                car_info = f"Here are a few Toyota models: {', '.join(models)}."
            else:
                car_info = "I couldn’t find any Toyota models right now."
        except Exception as e:
            car_info = f"Error contacting Toyota API: {e}"

    # --- 2️⃣ Generate GPT response ---
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.7,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Tori, a professional Toyota virtual assistant. "
                    "Respond with clarity and confidence. "
                    "Highlight Toyota’s reliability, safety, and technology. "
                    "Use short paragraphs or bullet points for lists."
                ),
            },
            {
                "role": "user",
                "content": f"{user_msg}\n\nVehicle data:\n{car_info}",
            },
        ],
    )

    ai_response = completion.choices[0].message.content
    return {"response": ai_response}
