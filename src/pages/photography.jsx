import React from "react";

import random from "../assets/random.png";
import { useNavigate } from "react-router";
import useImages from "../hooks/useImages";
import Masonry from "react-masonry-css";

const Photography = () => {
  const navigate = useNavigate();
  const { data: images, loading, error } = useImages("photography");

  const handleRandomClick = () => {
    if (loading || images.length === 0) return;
    const randomIndex = Math.floor(Math.random() * images.length);
    navigate(`/photography/${randomIndex}`);
  };

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  return (
    <div className="p-4 mx-auto max-w-7xl">
      <img
        onClick={handleRandomClick}
        src={random}
        alt="Random"
        className="w-80 mb-8 h-auto mx-auto cursor-pointer"
      />
      {loading && <p>Loading photographs…</p>}
      {error && <p className="text-red-600">Unable to load photographs.</p>}

      <div className="mx-auto">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex w-auto -ml-4"
          columnClassName="pl-4"
        >
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              className="mb-4 cursor-pointer"
              onClick={() => {
                navigate(`/photography/${idx}`);
              }}
            >
              <img src={img.src} alt={img.name} className="w-full h-auto" />
            </div>
          ))}
        </Masonry>
      </div>
    </div>
  );
};

export default Photography;
