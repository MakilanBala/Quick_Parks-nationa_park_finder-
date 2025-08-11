import React from "react";
import "./ParkLookUp.css";

export default function ParkLookUp({ children }) {
  return (
    <div className="park-lookup-wrapper">
      <div className="park-lookup-card">
        <h2>Find Your Perfect National Park</h2>
        {children}
      </div>
    </div>
  );
}