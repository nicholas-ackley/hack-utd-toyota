import requests, os
from dotenv import load_dotenv
load_dotenv()

HEADERS = {
    "x-rapidapi-key": os.getenv("TOYOTA_API_KEY"),
    "x-rapidapi-host": "car-api2.p.rapidapi.com"
}

def get_toyota_models(limit=5):
    url = "https://car-api2.p.rapidapi.com/api/models"
    params = {"make": "toyota", "limit": limit}
    res = requests.get(url, headers=HEADERS, params=params)
    return res.json()
