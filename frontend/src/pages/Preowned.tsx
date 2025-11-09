import React from "react";
import Navbar from "../navbar/Navbar";
import "../styles/Preowned.css";
import Camry from "../images/camry.jpg";
import Rav4 from "../images/rav4.jpg";
import Taco from "../images/taco.jpg";
import Le from "../images/le.jpg";


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
  const preownedCars: Car[] = [
    {
      id: 1,
      name: "Toyota Camry SE",
      year: 2021,
      msrp: 24900,
      mileage: 28000,
      image: Camry,
      description: "Sporty and efficient with a comfortable interior.",
    },
    {
      id: 2,
      name: "Toyota RAV4 XLE",
      year: 2020,
      msrp: 26500,
      mileage: 34000,
      image: Rav4,
      description: "Spacious compact SUV great for daily drives and trips.",
    },
    {
      id: 3,
      name: "Toyota Tacoma SR5",
      year: 2019,
      msrp: 29500,
      mileage: 41000,
      image: Taco,
      description: "Reliable pickup with solid off-road capability.",
    },
    {
      id: 4,
      name: "Toyota Corolla LE",
      year: 2022,
      msrp: 21900,
      mileage: 15000,
      image: Le,
      description: "Compact sedan offering great fuel economy and tech.",
    },
  ];

  return (
    <>
      <Navbar />
      <div className="preowned-container">
        <h1 className="preowned-title">Certified Pre-Owned Toyota Vehicles</h1>
        <p className="preowned-subtitle">
          Browse available models that combine reliability, performance, and value.
        </p>

        <div className="preowned-grid">
          {preownedCars.map((car) => (
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
