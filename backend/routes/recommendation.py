from fastapi import APIRouter, Request
import json, os, math

router = APIRouter()

# ---- Safe JSON load ----
file_path = os.path.join(os.path.dirname(__file__), "..", "response.json")
file_path = os.path.abspath(file_path)

try:
    with open(file_path, "r") as f:
        car_data = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    print(f"⚠️  Warning: could not load {file_path}. Using empty dataset.")
    car_data = []


# ---- API route ----
@router.post("/get-recommendation")
async def get_recommendation(request: Request):
    data = await request.json()
    answers = data.get("answers", {})

    best_car = None
    best_score = -math.inf

    for car in car_data:
        score = 0

        # 1️⃣ Price similarity
        if "price" in car and "maxPrice" in answers:
            diff = abs(car["price"] - float(answers["maxPrice"]))
            score += max(0, 100 - diff / 1000)

        # 2️⃣ Acceleration similarity
        if "acceleration" in car and "speedPreference" in answers:
            diff = abs(car["acceleration"] - float(answers["speedPreference"]))
            score += max(0, 50 - diff * 10)

        # 3️⃣ Fuel type match
        if car.get("fuelType") == answers.get("fuelType"):
            score += 40

        # 4️⃣ Body type match
        if car.get("bodyType") == answers.get("bodyType"):
            score += 30

        # 5️⃣ Household size preference
        if answers.get("householdSize") == "Yes" and car.get("sizeCategory") in ["SUV", "Truck"]:
            score += 20

        # 6️⃣ Commute distance and fuel type
        if answers.get("commuteDistance") == "Yes" and car.get("fuelType") in ["Hybrid", "Electric"]:
            score += 20

        if score > best_score:
            best_score = score
            best_car = car

    return {"car": best_car, "utilityScore": best_score}
