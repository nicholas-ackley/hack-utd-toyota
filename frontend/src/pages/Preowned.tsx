import React, { useState } from "react";
import Navbar from "../navbar/Navbar";
import "../styles/Preowned.css";
import Camry from "../images/camry.jpg";
import Rav4 from "../images/rav4.jpg";
import Taco from "../images/taco.jpg";
import Le from "../images/le.jpg";
import Supra from "../images/supra-homepage.png";
import Highlander from "../images/xle.jpg";
import Prius from "../images/le.jpg";
import Sequoia from "../images/taco.jpg";

interface Car {
  id: number;
  name: string;
  year: number;
  msrp: number;
  mileage: number;
  image: string;
  description: string;
}

const Preowned: React.FC = () => {
  const allCars: Car[] = [
    { id: 1, name: "Toyota Camry SE", year: 2021, msrp: 24900, mileage: 28000, image: Camry, description: "Sporty and efficient with a comfortable interior." },
    { id: 2, name: "Toyota RAV4 XLE", year: 2020, msrp: 26500, mileage: 34000, image: Rav4, description: "Spacious compact SUV great for daily drives and trips." },
    { id: 3, name: "Toyota Tacoma SR5", year: 2019, msrp: 29500, mileage: 41000, image: Taco, description: "Reliable pickup with solid off-road capability." },
    { id: 4, name: "Toyota Corolla LE", year: 2022, msrp: 21900, mileage: 15000, image: Le, description: "Compact sedan offering great fuel economy and tech." },
    { id: 5, name: "Toyota Supra GR", year: 2021, msrp: 49900, mileage: 12000, image: Supra, description: "Performance coupe with precision handling and speed." },
    { id: 6, name: "Toyota Highlander XLE", year: 2020, msrp: 37900, mileage: 36000, image: Highlander, description: "Family SUV with comfort, technology, and power." },
    { id: 7, name: "Toyota Prius Prime", year: 2019, msrp: 23900, mileage: 42000, image: Prius, description: "Hybrid innovation with excellent fuel economy." },
    { id: 8, name: "Toyota Sequoia Platinum", year: 2018, msrp: 48900, mileage: 52000, image: Sequoia, description: "Full-size SUV built for strength and luxury." },
  ];

  const [cars, setCars] = useState<Car[]>(allCars);
  const [filters, setFilters] = useState({ year: "all", maxPrice: "50000", maxMiles: "60000" });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredCars = allCars.filter((car) => {
    const yearMatch = filters.year === "all" || car.year === Number(filters.year);
    const priceMatch = car.msrp <= Number(filters.maxPrice);
    const mileageMatch = car.mileage <= Number(filters.maxMiles);
    return yearMatch && priceMatch && mileageMatch;
  });

  return (
    <>
      <Navbar />
      <div className="preowned-container">
        <h1 className="preowned-title">Certified Pre-Owned Toyota Vehicles</h1>
        <p className="preowned-subtitle">
          Browse available models that combine reliability, performance, and value.
        </p>

        {/* --- FILTER BAR --- */}
        <div className="filter-bar">
          <select name="year" value={filters.year} onChange={handleFilterChange}>
            <option value="all">All Years</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
            <option value="2020">2020</option>
            <option value="2019">2019</option>
            <option value="2018">2018</option>
          </select>

          <div className="range-group">
            <label>Max Price: ${filters.maxPrice}</label>
            <input
              type="range"
              name="maxPrice"
              min="20000"
              max="60000"
              step="1000"
              value={filters.maxPrice}
              onChange={handleFilterChange}
            />
          </div>

          <div className="range-group">
            <label>Max Mileage: {filters.maxMiles} mi</label>
            <input
              type="range"
              name="maxMiles"
              min="10000"
              max="80000"
              step="5000"
              value={filters.maxMiles}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        {/* --- CAR GRID --- */}
        <div className="preowned-grid">
          {filteredCars.map((car) => (
            <div key={car.id} className="preowned-card" data-aos="fade-up">
              <img src={car.image} alt={car.name} className="preowned-image" />
              <div className="preowned-info">
                <h2>{car.name}</h2>
                <p><strong>Year:</strong> {car.year}</p>
                <p><strong>MSRP:</strong> ${car.msrp.toLocaleString()}</p>
                <p><strong>Mileage:</strong> {car.mileage.toLocaleString()} mi</p>
                <p className="description">{car.description}</p>
                <button className="details-btn">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Preowned;
