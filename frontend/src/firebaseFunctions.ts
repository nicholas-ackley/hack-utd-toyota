import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export const addCarToDatabase = async () => {
  try {
    const docRef = await addDoc(collection(db, "cars"), {
      name: "Toyota Camry",
      year: 2024,
      price: 30000
    });
    console.log("Car added with ID:", docRef.id);
  } catch (error) {
    console.error("Error adding car:", error);
  }
};
