import { db } from "./firebase";
import {
  collection,
  addDoc,
  writeBatch,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  documentId,
  Timestamp,
  FieldValue
} from "firebase/firestore";

// Type definitions
type CarType = "regcar" | "stwagon" | "truck" | "van";
type FuelType = "gasoline" | "electric";

interface Car {
  make: string; // e.g., "Toyota" - prevents cross-brand ID collisions
  model: string;
  trim: string;
  year: number;
  type: CarType;
  fuel: FuelType;
  price: number;
  zeroToSixtySec: number; // positive 0-60 seconds (faster = smaller value)
  pollution: number; // CO₂ g/mi (EV = 0)
  size: number; // 1-3 roominess index
  name?: string; // optional: `${model} ${trim}`
  imageUrl?: string; // optional: URL to car image
  createdAt?: Timestamp | FieldValue; // serverTimestamp on creation
  updatedAt?: Timestamp | FieldValue; // serverTimestamp on update
}

interface CarFilters {
  year?: { min?: number; max?: number };
  type?: CarType;
  fuel?: FuelType;
  priceMax?: number;
  [key: string]: any; // allow additional filters
}

export interface UserPreferences {
  bodyType?: 'regcar' | 'stwagon' | 'truck' | 'van';
  fuelType?: 'gasoline' | 'electric';
  maxPrice?: number;
  speedPreference?: number; // 0-60 time in seconds
  sizePreference?: 1 | 2 | 3;
  householdSize?: 0 | 1; // hsg2
  commuteDistance?: 0 | 1; // coml5
}

/**
 * Normalizes a string to lowercase with spaces replaced by hyphens for stable doc IDs.
 * Trims whitespace and strips punctuation.
 */
function normalizeId(str: string): string {
  if (!str || typeof str !== 'string') {
    throw new Error("normalizeId requires a non-empty string");
  }
  return str
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove punctuation
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validates and normalizes a car object
 */
function validateAndNormalizeCar(car: Partial<Car>): Car {
  // Validate make (required, non-empty)
  const make = String(car.make || "").trim();
  if (!make) {
    throw new Error("make is required and cannot be empty");
  }

  // Validate model (required, non-empty)
  const model = String(car.model || "").trim();
  if (!model) {
    throw new Error("model is required and cannot be empty");
  }

  // Validate trim (required, non-empty)
  const trim = String(car.trim || "").trim();
  if (!trim) {
    throw new Error("trim is required and cannot be empty");
  }

  // Validate type
  const validTypes: CarType[] = ["regcar", "stwagon", "truck", "van"];
  const type = (car.type || "").toLowerCase() as CarType;
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid type: ${car.type}. Must be one of: ${validTypes.join(", ")}`);
  }

  // Validate fuel
  const validFuels: FuelType[] = ["gasoline", "electric"];
  const fuel = (car.fuel || "").toLowerCase() as FuelType;
  if (!validFuels.includes(fuel)) {
    throw new Error(`Invalid fuel: ${car.fuel}. Must be one of: ${validFuels.join(", ")}`);
  }

  // Validate year
  const year = Number(car.year);
  if (isNaN(year) || year < 2020 || year > 2026) {
    throw new Error(`Invalid year: ${car.year}. Must be between 2020 and 2026`);
  }

  // Validate and enforce numeric types
  const price = Number(car.price);
  const zeroToSixtySec = Number(car.zeroToSixtySec);
  const pollution = Number(car.pollution);
  const size = Number(car.size);

  if (isNaN(price) || isNaN(zeroToSixtySec) || isNaN(pollution) || isNaN(size)) {
    throw new Error("price, zeroToSixtySec, pollution, and size must be valid numbers");
  }

  // Generate name if not provided
  const name = car.name || `${model} ${trim}`;

  return {
    make,
    model,
    trim,
    year,
    type,
    fuel,
    price,
    zeroToSixtySec,
    pollution,
    size,
    name
  };
}

/**
 * Upserts one or many cars to the cars collection via a single writeBatch.
 * Uses stable doc IDs: ${make}-${model}-${trim}-${year} (lowercased, spaces→hyphens).
 * Uses merge: true to preserve existing fields not in the update.
 * 
 * @param cars - Single car object or array of car objects
 * @returns Array of document IDs that were written
 */
export async function upsertCars(cars: Car | Car[]): Promise<string[]> {
  const carsArray = Array.isArray(cars) ? cars : [cars];
  const batch = writeBatch(db);
  const carRef = collection(db, "cars");
  const writtenIds: string[] = [];

  // Normalize all cars and compute doc IDs
  const normalizedCars: Array<{ car: Car; docId: string; docRef: ReturnType<typeof doc> }> = [];
  for (const car of carsArray) {
    try {
      const normalizedCar = validateAndNormalizeCar(car);
      const docId = `${normalizeId(normalizedCar.make)}-${normalizeId(normalizedCar.model)}-${normalizeId(normalizedCar.trim)}-${normalizedCar.year}`;
      const docRef = doc(carRef, docId);
      normalizedCars.push({ car: normalizedCar, docId, docRef });
    } catch (error) {
      console.warn(`Skipping car ${car.make || 'unknown'} ${car.model || 'unknown'} ${car.trim || 'unknown'} ${car.year || 'unknown'}:`, error);
    }
  }

  // Batch-check document existence using FieldPath.documentId() with 'in' operator (≤10 at a time)
  const existingDocIds = new Set<string>();
  const docIdChunks: string[][] = [];
  
  // Chunk doc IDs into batches of ≤10
  for (let i = 0; i < normalizedCars.length; i += 10) {
    docIdChunks.push(normalizedCars.slice(i, i + 10).map(nc => nc.docId));
  }

  // Query each chunk to check existence
  for (const docIdChunk of docIdChunks) {
    if (docIdChunk.length === 0) continue;
    
    const existenceQuery = query(
      carRef,
      where(documentId(), "in", docIdChunk)
    );
    const existenceSnapshot = await getDocs(existenceQuery);
    existenceSnapshot.forEach((docSnap) => {
      existingDocIds.add(docSnap.id);
    });
  }

  // Write all cars in a single batch
  for (const { car: normalizedCar, docRef, docId } of normalizedCars) {
    const exists = existingDocIds.has(docId);
    
    // Prepare car data with timestamps
    const carData: any = { 
      ...normalizedCar,
      updatedAt: serverTimestamp() // Always set updatedAt on every write
    };
    
    // Set createdAt only if document doesn't exist
    if (!exists) {
      carData.createdAt = serverTimestamp();
    }
    
    batch.set(docRef, carData, { merge: true });
    writtenIds.push(docId);
  }

  await batch.commit();
  console.log(`✓ Upserted ${writtenIds.length} car(s) to database`);
  return writtenIds;
}

/**
 * Seeds the database with a mock Toyota catalog (2020-2026).
 * Includes at least 12-18 Toyota variants spanning sedans/SUVs/van/trucks/EV.
 * 
 * @returns Array of document IDs that were written
 */
export async function seedToyotaMockCatalog(): Promise<string[]> {
  const toyotaCars: Car[] = [
    // Sedans
    { make: "Toyota", model: "Corolla", trim: "LE", year: 2020, type: "regcar", fuel: "gasoline", price: 20500, zeroToSixtySec: 8.5, pollution: 350, size: 1, imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800" },
    { make: "Toyota", model: "Corolla", trim: "LE", year: 2024, type: "regcar", fuel: "gasoline", price: 22500, zeroToSixtySec: 8.2, pollution: 320, size: 1, imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800" },
    { make: "Toyota", model: "Camry", trim: "SE", year: 2021, type: "regcar", fuel: "gasoline", price: 28500, zeroToSixtySec: 7.8, pollution: 380, size: 2 },
    { make: "Toyota", model: "Camry", trim: "SE", year: 2025, type: "regcar", fuel: "gasoline", price: 30500, zeroToSixtySec: 7.5, pollution: 360, size: 2 },
    { make: "Toyota", model: "Prius", trim: "XLE", year: 2023, type: "regcar", fuel: "gasoline", price: 32000, zeroToSixtySec: 9.2, pollution: 180, size: 1 },
    { make: "Toyota", model: "Prius", trim: "XLE", year: 2024, type: "regcar", fuel: "gasoline", price: 33500, zeroToSixtySec: 9.0, pollution: 175, size: 1 },
    
    // SUVs
    { make: "Toyota", model: "RAV4", trim: "XLE", year: 2020, type: "stwagon", fuel: "gasoline", price: 31500, zeroToSixtySec: 8.0, pollution: 400, size: 2 },
    { make: "Toyota", model: "RAV4", trim: "XLE", year: 2025, type: "stwagon", fuel: "gasoline", price: 36500, zeroToSixtySec: 7.8, pollution: 380, size: 2 },
    { make: "Toyota", model: "Highlander", trim: "XLE", year: 2022, type: "stwagon", fuel: "gasoline", price: 42500, zeroToSixtySec: 7.2, pollution: 450, size: 3 },
    { make: "Toyota", model: "bZ4X", trim: "XLE", year: 2024, type: "stwagon", fuel: "electric", price: 44500, zeroToSixtySec: 6.5, pollution: 0, size: 2 },
    { make: "Toyota", model: "bZ4X", trim: "XLE", year: 2026, type: "stwagon", fuel: "electric", price: 46500, zeroToSixtySec: 6.2, pollution: 0, size: 2 },
    
    // Vans
    { make: "Toyota", model: "Sienna", trim: "XLE", year: 2024, type: "van", fuel: "gasoline", price: 41500, zeroToSixtySec: 8.5, pollution: 420, size: 3 },
    
    // Trucks
    { make: "Toyota", model: "Tacoma", trim: "TRD Sport", year: 2023, type: "truck", fuel: "gasoline", price: 38500, zeroToSixtySec: 7.8, pollution: 480, size: 2 },
    { make: "Toyota", model: "Tundra", trim: "SR5", year: 2025, type: "truck", fuel: "gasoline", price: 45500, zeroToSixtySec: 6.8, pollution: 520, size: 3 },
    
    // Additional variants for more coverage
    { make: "Toyota", model: "Corolla", trim: "XSE", year: 2023, type: "regcar", fuel: "gasoline", price: 24500, zeroToSixtySec: 8.0, pollution: 330, size: 1 },
    { make: "Toyota", model: "Camry", trim: "XLE", year: 2022, type: "regcar", fuel: "gasoline", price: 32500, zeroToSixtySec: 7.6, pollution: 370, size: 2 },
    { make: "Toyota", model: "RAV4", trim: "Limited", year: 2023, type: "stwagon", fuel: "gasoline", price: 38500, zeroToSixtySec: 7.5, pollution: 375, size: 2 },
    { make: "Toyota", model: "4Runner", trim: "SR5", year: 2024, type: "stwagon", fuel: "gasoline", price: 39500, zeroToSixtySec: 7.0, pollution: 460, size: 3 },
    
    // More sedans
    { make: "Toyota", model: "Corolla", trim: "SE", year: 2022, type: "regcar", fuel: "gasoline", price: 23500, zeroToSixtySec: 8.3, pollution: 340, size: 1 },
    { make: "Toyota", model: "Corolla", trim: "LE", year: 2023, type: "regcar", fuel: "gasoline", price: 23000, zeroToSixtySec: 8.4, pollution: 325, size: 1 },
    { make: "Toyota", model: "Camry", trim: "LE", year: 2023, type: "regcar", fuel: "gasoline", price: 29500, zeroToSixtySec: 7.7, pollution: 365, size: 2 },
    { make: "Toyota", model: "Camry", trim: "SE", year: 2024, type: "regcar", fuel: "gasoline", price: 30000, zeroToSixtySec: 7.6, pollution: 355, size: 2 },
    { make: "Toyota", model: "Prius", trim: "LE", year: 2024, type: "regcar", fuel: "gasoline", price: 31000, zeroToSixtySec: 9.3, pollution: 185, size: 1 },
    { make: "Toyota", model: "Prius", trim: "XLE", year: 2025, type: "regcar", fuel: "gasoline", price: 34000, zeroToSixtySec: 9.1, pollution: 170, size: 1 },
    
    // More SUVs
    { make: "Toyota", model: "RAV4", trim: "LE", year: 2023, type: "stwagon", fuel: "gasoline", price: 34500, zeroToSixtySec: 8.1, pollution: 390, size: 2 },
    { make: "Toyota", model: "RAV4", trim: "XLE", year: 2023, type: "stwagon", fuel: "gasoline", price: 36000, zeroToSixtySec: 7.9, pollution: 385, size: 2 },
    { make: "Toyota", model: "RAV4", trim: "Limited", year: 2024, type: "stwagon", fuel: "gasoline", price: 39000, zeroToSixtySec: 7.4, pollution: 370, size: 2 },
    { make: "Toyota", model: "Highlander", trim: "LE", year: 2023, type: "stwagon", fuel: "gasoline", price: 40000, zeroToSixtySec: 7.3, pollution: 445, size: 3 },
    { make: "Toyota", model: "Highlander", trim: "XLE", year: 2024, type: "stwagon", fuel: "gasoline", price: 43500, zeroToSixtySec: 7.1, pollution: 440, size: 3 },
    { make: "Toyota", model: "4Runner", trim: "TRD Off-Road", year: 2023, type: "stwagon", fuel: "gasoline", price: 42000, zeroToSixtySec: 7.2, pollution: 470, size: 3 },
    { make: "Toyota", model: "4Runner", trim: "Limited", year: 2025, type: "stwagon", fuel: "gasoline", price: 48000, zeroToSixtySec: 6.9, pollution: 455, size: 3 },
    { make: "Toyota", model: "Sequoia", trim: "SR5", year: 2024, type: "stwagon", fuel: "gasoline", price: 58000, zeroToSixtySec: 6.5, pollution: 500, size: 3 },
    { make: "Toyota", model: "Venza", trim: "LE", year: 2023, type: "stwagon", fuel: "gasoline", price: 35000, zeroToSixtySec: 8.2, pollution: 390, size: 2 },
    
    // More electric vehicles
    { make: "Toyota", model: "bZ4X", trim: "Limited", year: 2025, type: "stwagon", fuel: "electric", price: 48000, zeroToSixtySec: 6.0, pollution: 0, size: 2 },
    { make: "Toyota", model: "Prius Prime", trim: "SE", year: 2024, type: "regcar", fuel: "electric", price: 33000, zeroToSixtySec: 9.5, pollution: 0, size: 1 },
    { make: "Toyota", model: "Prius Prime", trim: "XLE", year: 2025, type: "regcar", fuel: "electric", price: 36000, zeroToSixtySec: 9.3, pollution: 0, size: 1 },
    
    // More trucks
    { make: "Toyota", model: "Tacoma", trim: "SR", year: 2024, type: "truck", fuel: "gasoline", price: 35000, zeroToSixtySec: 8.0, pollution: 490, size: 2 },
    { make: "Toyota", model: "Tacoma", trim: "TRD Off-Road", year: 2024, type: "truck", fuel: "gasoline", price: 41000, zeroToSixtySec: 7.6, pollution: 475, size: 2 },
    { make: "Toyota", model: "Tundra", trim: "Limited", year: 2024, type: "truck", fuel: "gasoline", price: 52000, zeroToSixtySec: 6.5, pollution: 510, size: 3 },
    { make: "Toyota", model: "Tundra", trim: "Platinum", year: 2025, type: "truck", fuel: "gasoline", price: 58000, zeroToSixtySec: 6.3, pollution: 505, size: 3 },
    
    // More vans
    { make: "Toyota", model: "Sienna", trim: "LE", year: 2023, type: "van", fuel: "gasoline", price: 39000, zeroToSixtySec: 8.6, pollution: 425, size: 3 },
    { make: "Toyota", model: "Sienna", trim: "XLE", year: 2025, type: "van", fuel: "gasoline", price: 43000, zeroToSixtySec: 8.4, pollution: 415, size: 3 },
    { make: "Toyota", model: "Sienna", trim: "Limited", year: 2024, type: "van", fuel: "gasoline", price: 48000, zeroToSixtySec: 8.3, pollution: 410, size: 3 },
  ];

  return await upsertCars(toyotaCars);
}

/**
 * Fetches cars for a user with optional filters.
 * By default filters by year >= 2020 and <= 2026.
 * 
 * Note: Firestore only allows one range filter per query. When priceMax is used,
 * the year filter switches to an "in" list to avoid multiple inequality filters.
 * 
 * @param filters - Optional filter object with:
 *   - year: { min?: number, max?: number } (defaults to 2020-2026)
 *   - type: CarType
 *   - fuel: FuelType
 *   - priceMax: number
 *   - Additional filters as needed
 * @returns Array of car records with document IDs, sorted by price
 */
export async function fetchCarsForUser(filters: CarFilters = {}): Promise<Array<Car & { id: string }>> {
  try {
    console.log('🔍 Fetching cars with filters:', filters);
    const carRef = collection(db, "cars");

    // Use the most basic query possible - just fetch all cars and filter in memory
    // This completely avoids any Firestore query complexity
    const q = query(carRef);
    const querySnapshot = await getDocs(q);

    const cars: Array<Car & { id: string }> = [];
    querySnapshot.forEach((docSnap) => {
      cars.push({ id: docSnap.id, ...docSnap.data() } as Car & { id: string });
    });

    console.log(`✓ Fetched ${cars.length} raw car(s) from database`);

    // Apply all filtering in memory
    let filteredCars = cars;

    // Year filtering
    const yearMin = filters.year?.min ?? 2020;
    const yearMax = filters.year?.max ?? 2026;
    filteredCars = filteredCars.filter(car => car.year >= yearMin && car.year <= yearMax);

    // Price filtering
    if (filters.priceMax !== undefined) {
      filteredCars = filteredCars.filter(car => car.price <= filters.priceMax!);
    }

    // Type filtering
    if (filters.type) {
      filteredCars = filteredCars.filter(car => car.type === filters.type);
    }

    // Fuel filtering
    if (filters.fuel) {
      filteredCars = filteredCars.filter(car => car.fuel === filters.fuel);
    }

    // Sort by price (ascending), then by year (ascending)
    filteredCars.sort((a, b) => {
      if (a.price !== b.price) {
        return a.price - b.price;
      }
      return a.year - b.year;
    });

    console.log(`✓ Filtered to ${filteredCars.length} car(s) after applying all filters`);
    return filteredCars;
  } catch (error: any) {
    console.error('❌ Error fetching cars from database:', error);
    
    // Provide more specific error messages
    if (error?.code === 'permission-denied' || error?.code === 7) {
      throw new Error('Permission denied accessing database. Please check Firestore security rules.');
    } else if (error?.code === 'unavailable' || error?.code === 14) {
      throw new Error('Database is temporarily unavailable. Please try again later.');
    } else if (error?.code === 'failed-precondition') {
      throw new Error('Database query failed due to a precondition error. This might be due to complex query constraints.');
    } else if (error?.message) {
      throw new Error(`Failed to fetch cars: ${error.message}`);
    } else {
      throw new Error(`Failed to fetch cars: ${error}`);
    }
  }
}

/**
 * Adds a single car to the database (legacy function, kept for compatibility).
 * Updated example to match 2020-2026 schema.
 */
export const addCarToDatabase = async () => {
  try {
    const car: Car = {
      make: "Toyota",
      model: "Camry",
      trim: "SE",
      year: 2024,
      type: "regcar",
      fuel: "gasoline",
      price: 30500,
      zeroToSixtySec: 7.5,
      pollution: 360,
      size: 2,
      name: "Camry SE",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "cars"), car);
    console.log("Car added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding car:", error);
    throw error;
  }
};

/**
 * Loads MNL model coefficients from CSV file
 */
async function loadCoefficients(): Promise<Map<string, number>> {
  try {
    console.log('📥 Loading coefficients from CSV...');
    const response = await fetch('/mnl_coefficients.csv');
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`CSV file not found (404). Please ensure mnl_coefficients.csv exists in the public folder.`);
      }
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const text = await response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('CSV file is empty');
    }
    
    console.log('📄 CSV text length:', text.length);
    const lines = text.trim().split('\n');
    console.log('📋 CSV lines:', lines.length);
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }
    
    const coefficients = new Map<string, number>();

    // Skip header line, parse each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const [feature, beta] = line.split(',');
      if (!feature || beta === undefined) {
        console.warn(`⚠️ Skipping malformed line ${i}: "${line}"`);
        continue;
      }

      const featureTrimmed = feature.trim();
      const betaParsed = parseFloat(beta.trim());

      if (isNaN(betaParsed)) {
        console.warn(`⚠️ Invalid beta value for ${featureTrimmed}: "${beta}"`);
        continue;
      }

      coefficients.set(featureTrimmed, betaParsed);
    }

    if (coefficients.size === 0) {
      throw new Error('No valid coefficients found in CSV file');
    }

    console.log('✅ Loaded coefficients:', Array.from(coefficients.entries()));
    return coefficients;
  } catch (error: any) {
    console.error('❌ Error loading coefficients:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to load model coefficients: ${error.message}`);
    }
    throw new Error(`Failed to load model coefficients: ${error}`);
  }
}

/**
 * Encodes a car into the model's feature format and computes utility score
 */
function computeCarUtility(
  car: Car,
  preferences: UserPreferences,
  coefficients: Map<string, number>
): number {
  try {
    let utility = 0;
  
  // Type features (one-hot encoded, van is base)
  const typeBase = 'van';
  if (car.type !== typeBase) {
    const typeFeature = `type_${car.type}`;
    const typeCoef = coefficients.get(typeFeature) || 0;
    utility += typeCoef;
  }
  
  // Fuel features (one-hot encoded, gasoline is base)
  const fuelBase = 'gasoline';
  if (car.fuel !== fuelBase) {
    const fuelFeature = `fuel_${car.fuel}`;
    const fuelCoef = coefficients.get(fuelFeature) || 0;
    utility += fuelCoef;
  }
  
  // Numeric features (rough scaling to match training data scale)
  const priceCoef = coefficients.get('price') || 0;
  utility += priceCoef * (car.price / 10000); // Rough scaling (divide by 10k)
  
  // Speed: Convert 0-60 time to match model's speed scale (model expects top speed ~85-140)
  // Inverse relationship: lower 0-60 time = higher speed value
  const speedCoef = coefficients.get('speed') || 0;
  // Convert 0-60 time (6-10 sec) to speed-like scale (85-140)
  // Formula: speed = 140 - (zeroToSixtySec - 6) * 13.75
  const speedValue = Math.max(85, Math.min(140, 140 - (car.zeroToSixtySec - 6) * 13.75));
  utility += speedCoef * (speedValue / 100); // Rough scaling
  
  const pollutionCoef = coefficients.get('pollution') || 0;
  utility += pollutionCoef * (car.pollution / 100); // Rough scaling
  
  const sizeCoef = coefficients.get('size') || 0;
  utility += sizeCoef * car.size;
  
  // Interaction features
  // Note: college is excluded from questionnaire, so set to 0
  const college = 0;
  const hsg2 = preferences.householdSize || 0;
  const coml5 = preferences.commuteDistance || 0;
  
  // college × fuel_electric (college excluded, so this will be 0)
  if (car.fuel === 'electric') {
    const interactionCoef = coefficients.get('college_x_fuel_electric') || 0;
    utility += interactionCoef * college; // Will be 0 since college = 0
  }
  
  // hsg2 × size
  const hsg2SizeCoef = coefficients.get('hsg2_x_size') || 0;
  utility += hsg2SizeCoef * hsg2 * car.size;
  
    // coml5 × price
    const coml5PriceCoef = coefficients.get('coml5_x_price') || 0;
    utility += coml5PriceCoef * coml5 * (car.price / 10000);

    return utility;
  } catch (error) {
    console.error('❌ Error computing utility for car:', car.name || `${car.model} ${car.trim}`, error);
    // Return a very low utility score so this car gets ranked last
    return -999;
  }
}

/**
 * Gets car recommendations based on user preferences.
 * Uses the trained MNL model coefficients to score and rank cars.
 * 
 * @param preferences - User preferences from questionnaire
 * @param topN - Number of top recommendations to return (default: 3)
 * @returns Array of top recommended cars with utility scores
 */
export async function getCarRecommendations(
  preferences: UserPreferences,
  topN: number = 3
): Promise<Array<Car & { id: string; utilityScore: number }>> {
  try {
    console.log('🔍 Starting recommendation calculation...');
    console.log('📊 User preferences:', preferences);

    // Load coefficients
    let coefficients: Map<string, number>;
    try {
      coefficients = await loadCoefficients();
      console.log('📈 Loaded coefficients:', coefficients.size, 'features');
      
      if (coefficients.size === 0) {
        throw new Error('No coefficients loaded from CSV file. Please check if mnl_coefficients.csv exists in the public folder.');
      }
    } catch (error: any) {
      console.error('❌ Error loading coefficients:', error);
      throw new Error(`Failed to load model coefficients: ${error.message || error}`);
    }

    // Build filters from preferences
    const filters: CarFilters = {
      year: { min: 2020, max: 2026 }
    };

    if (preferences.bodyType) {
      filters.type = preferences.bodyType;
    }

    if (preferences.fuelType) {
      filters.fuel = preferences.fuelType;
    }

    if (preferences.maxPrice) {
      filters.priceMax = preferences.maxPrice;
    }

    console.log('🔍 Fetching cars with filters:', filters);

    // Fetch cars from Firestore
    let cars: Array<Car & { id: string }>;
    try {
      cars = await fetchCarsForUser(filters);
      console.log('🚗 Fetched cars:', cars.length);
    } catch (error: any) {
      console.error('❌ Error fetching cars:', error);
      throw new Error(`Failed to fetch cars from database: ${error.message || error}. Make sure the database is seeded with cars and check Firestore security rules.`);
    }

    if (cars.length === 0) {
      console.warn('⚠️ No cars found with current filters');

      // Try fetching without filters to see if database is empty
      try {
        const allCars = await fetchCarsForUser({});
        if (allCars.length === 0) {
          console.warn('⚠️ Database appears to be empty. Attempting to seed...');
          try {
            await seedToyotaMockCatalog();
            console.log('✅ Database seeded successfully. Retrying fetch...');
            cars = await fetchCarsForUser(filters);
            console.log('🚗 Fetched cars after seeding:', cars.length);
          } catch (seedError: any) {
            console.error('❌ Error seeding database:', seedError);
            throw new Error(`Database is empty and seeding failed: ${seedError.message || seedError}. Please seed the database manually.`);
          }
        } else {
          // Database has cars but none match the current filters - try broader search
          console.warn('⚠️ No cars match current filters, trying broader search...');
          // Remove restrictive filters and try again
          const broadFilters = {
            year: { min: 2020, max: 2026 },
            // Remove type and fuel filters to get more results
          };
          cars = await fetchCarsForUser(broadFilters);
          console.log('🚗 Fetched cars with broader filters:', cars.length);

          if (cars.length === 0) {
            return []; // Still no cars found even with broad filters
          }
        }
      } catch (checkError: any) {
        console.error('❌ Error checking database:', checkError);
        throw new Error(`Failed to check database: ${checkError.message || checkError}`);
      }
    }

    // Score each car
    const scoredCars = cars.map(car => {
      try {
        const utility = computeCarUtility(car, preferences, coefficients);
        console.log(`📊 ${car.name || `${car.model} ${car.trim}`}: utility = ${utility.toFixed(3)}`);
        return {
          ...car,
          utilityScore: utility
        };
      } catch (error) {
        console.error(`❌ Error computing utility for ${car.name || `${car.model} ${car.trim}`}:`, error);
        return {
          ...car,
          utilityScore: -999 // Very low score for cars with errors
        };
      }
    });

    // Sort by utility score (highest first)
    scoredCars.sort((a, b) => b.utilityScore - a.utilityScore);

    // Return top N cars
    const topCars = scoredCars.slice(0, topN);

    console.log(`✅ Top ${topCars.length} recommendation(s):`, topCars.map(c => ({
      name: c.name,
      utility: c.utilityScore.toFixed(3)
    })));

    return topCars;
  } catch (error: any) {
    console.error('❌ Error getting car recommendations:', error);
    throw error;
  }
}

// Usage examples (commented):
/*
// Seed the Toyota catalog
await seedToyotaMockCatalog();

// Fetch electric cars under $50,000
const electricCars = await fetchCarsForUser({
  fuel: "electric",
  priceMax: 50000
});
console.log("Electric cars:", electricCars);

// Get recommendations based on user preferences
const recommendations = await getCarRecommendations({
  bodyType: 'stwagon',
  fuelType: 'electric',
  maxPrice: 50000,
  speedPreference: 7.0,
  sizePreference: 2,
  householdSize: 1,
  commuteDistance: 1
}, 3);
console.log("Top 3 recommendations:", recommendations);
*/

/**
 * Gets the top 3 most compatible cars for given user preferences.
 * This is the main function to call from the frontend for car recommendations.
 *
 * @param preferences - User's questionnaire answers
 * @returns Promise of top 3 cars with their compatibility scores
 */
export async function getTop3CompatibleCars(preferences: UserPreferences): Promise<Array<Car & { id: string; utilityScore: number }>> {
  return getCarRecommendations(preferences, 3);
}

// Debug function to test recommendation system
export async function debugRecommendations() {
  try {
    console.log('🧪 Starting debug test...');

    // Test coefficient loading
    const coeffs = await loadCoefficients();
    console.log('🧪 Coefficients loaded:', coeffs.size);

    // Test car fetching
    const cars = await fetchCarsForUser();
    console.log('🧪 Cars fetched:', cars.length);

    if (cars.length === 0) {
      console.warn('🧪 No cars found! Make sure to seed the database first.');
      console.log('🧪 Run: await seedToyotaMockCatalog()');
      return;
    }

    // Test utility calculation with sample preferences
    const testPrefs = {
      bodyType: 'regcar' as const,
      fuelType: 'electric' as const,
      maxPrice: 50000,
      speedPreference: 8.0,
      sizePreference: 2 as const,
      householdSize: 1 as const,
      commuteDistance: 0 as const
    };

    const utility = computeCarUtility(cars[0], testPrefs, coeffs);
    console.log('🧪 Sample utility calculation:', utility);

    // Test full recommendations
    const recs = await getCarRecommendations(testPrefs, 3);
    console.log('🧪 Full recommendations test:', recs.length, 'results');

    console.log('✅ Debug test completed successfully!');
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}
