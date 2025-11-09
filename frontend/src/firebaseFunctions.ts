import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  writeBatch, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  QueryConstraint,
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
    { make: "Toyota", model: "Corolla", trim: "LE", year: 2020, type: "regcar", fuel: "gasoline", price: 20500, zeroToSixtySec: 8.5, pollution: 350, size: 1 },
    { make: "Toyota", model: "Corolla", trim: "LE", year: 2024, type: "regcar", fuel: "gasoline", price: 22500, zeroToSixtySec: 8.2, pollution: 320, size: 1 },
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
  const carRef = collection(db, "cars");
  const constraints: QueryConstraint[] = [];

  // Default year filter: 2020-2026
  const yearMin = filters.year?.min ?? 2020;
  const yearMax = filters.year?.max ?? 2026;

  // Firestore limitation: only one range filter per query
  // If priceMax is used, we can't use year range, so use "in" list instead
  const hasPriceMax = filters.priceMax !== undefined;
  const yearCount = yearMax - yearMin + 1;
  
  if (hasPriceMax) {
    // Use "in" list for years (Firestore limit is 10 values)
    // If range exceeds 10, chunk into multiple queries and union results
    if (yearCount > 10) {
      // Chunk years into batches of ≤10 and union results
      const allCars: Array<Car & { id: string }> = [];
      const chunks: number[][] = [];
      
      for (let start = yearMin; start <= yearMax; start += 10) {
        const end = Math.min(start + 9, yearMax);
        chunks.push([]);
        for (let y = start; y <= end; y++) {
          chunks[chunks.length - 1].push(y);
        }
      }
      
      // Execute queries for each chunk
      for (const yearChunk of chunks) {
        const chunkConstraints: QueryConstraint[] = [
          where("year", "in", yearChunk),
          where("price", "<=", filters.priceMax!),
          orderBy("price", "asc"),
          orderBy("year", "asc") // Deterministic secondary sort for pagination
        ];
        
        // Optional equality filters
        if (filters.type) {
          chunkConstraints.push(where("type", "==", filters.type));
        }
        if (filters.fuel) {
          chunkConstraints.push(where("fuel", "==", filters.fuel));
        }
        
        const chunkQuery = query(carRef, ...chunkConstraints);
        const chunkSnapshot = await getDocs(chunkQuery);
        chunkSnapshot.forEach((docSnap) => {
          allCars.push({ id: docSnap.id, ...docSnap.data() } as Car & { id: string });
        });
      }
      
      // Merge and deduplicate (in case of overlap, though there shouldn't be)
      const uniqueCars = Array.from(
        new Map(allCars.map(car => [car.id, car])).values()
      );
      
      // Sort by price, then year (already sorted per chunk, but ensure global sort)
      uniqueCars.sort((a, b) => {
        if (a.price !== b.price) return a.price - b.price;
        return a.year - b.year;
      });
      
      console.log(`✓ Fetched ${uniqueCars.length} car(s) from database (chunked queries)`);
      return uniqueCars;
    } else {
      // Use "in" list for years (fits within limit)
      const yearList: number[] = [];
      for (let y = yearMin; y <= yearMax; y++) {
        yearList.push(y);
      }
      constraints.push(where("year", "in", yearList));
      
      // Now we can use price range and order by price first, then year
      // Note: This query requires a composite index (year in + price <= + orderBy price, year)
      // Firestore console will provide a one-click link to create it
      constraints.push(where("price", "<=", filters.priceMax!));
      constraints.push(orderBy("price", "asc"));
      constraints.push(orderBy("year", "asc")); // Deterministic secondary sort for pagination
    }
  } else {
    // No price filter, so we can use year range
    constraints.push(where("year", ">=", yearMin));
    constraints.push(where("year", "<=", yearMax));
    
    // When using year range, first orderBy must be year (Firestore requirement)
    // Add price as secondary sort for deterministic pagination
    // Note: This query requires a composite index (year range + orderBy year, price)
    constraints.push(orderBy("year", "asc"));
    constraints.push(orderBy("price", "asc")); // Deterministic secondary sort for pagination
  }

  // Optional equality filters (these don't conflict with range filters)
  if (filters.type) {
    constraints.push(where("type", "==", filters.type));
  }
  if (filters.fuel) {
    constraints.push(where("fuel", "==", filters.fuel));
  }

  const q = query(carRef, ...constraints);
  const querySnapshot = await getDocs(q);
  
  const cars: Array<Car & { id: string }> = [];
  querySnapshot.forEach((docSnap) => {
    cars.push({ id: docSnap.id, ...docSnap.data() } as Car & { id: string });
  });

  console.log(`✓ Fetched ${cars.length} car(s) from database`);
  return cars;
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
*/
