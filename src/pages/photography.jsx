import React from "react";

import random from "../assets/random.png";
import { useNavigate } from "react-router";
import useImages from "../hooks/useImages";

const Photography = () => {
  const navigate = useNavigate();
  const { data: images, loading, error } = useImages("photography");

  const handleRandomClick = () => {
    if (loading || images.length === 0) return;
    const randomIndex = Math.floor(Math.random() * images.length);
    navigate(`/photography/${randomIndex}`);
  };

  return (
    <div className="p-4">
      <img
        onClick={handleRandomClick}
        src={random}
        alt="Random"
        className="w-80 mb-8 h-auto mx-auto cursor-pointer"
      />
      {loading && <p>Loading photographs…</p>}
      {error && <p className="text-red-600">Unable to load photographs.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="mb-4 cursor-pointer"
            onClick={() => {
              navigate(`/photography/${idx}`);
            }}
          >
            <img src={img.src} alt={img.name} className="w-full h-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Photography;
