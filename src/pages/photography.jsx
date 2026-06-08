import React, { useState, useEffect, useRef, useCallback } from "react";

import random from "../assets/random.png";
import { useNavigate } from "react-router";
import useImages from "../hooks/useImages";
import Masonry from "react-masonry-css";
import Spinner from "../components/Spinner";

import frame11_0 from "../assets/Frames/1.1/frame0.png";
import frame11_1 from "../assets/Frames/1.1/frame1.png";
import frame11_2 from "../assets/Frames/1.1/frame2.png";
import frame11_3 from "../assets/Frames/1.1/frame3.png";
import frame11_4 from "../assets/Frames/1.1/frame4.png";

import frame43_0 from "../assets/Frames/4.3/frame0.png";
import frame43_1 from "../assets/Frames/4.3/frame1.png";
import frame43_2 from "../assets/Frames/4.3/frame2.png";
import frame43_3 from "../assets/Frames/4.3/frame3.png";
import frame43_4 from "../assets/Frames/4.3/frame4.png";

import bug1 from "../assets/bug1.gif";
import bug2 from "../assets/bug2.gif";
import spider from "../assets/spider.gif";

const FRAME_CONFIG = {
  "1:1": [
    { src: frame11_0, borderPx: 12 },
    { src: frame11_1, borderPx: 22 },
    { src: frame11_2, borderPx: 12 },
    { src: frame11_3, borderPx: 17 },
    { src: frame11_4, borderPx: 25 },
  ],
  "4:3": [
    { src: frame43_0, borderPx: 14 },
    { src: frame43_1, borderPx: 12 },
    { src: frame43_2, borderPx: 10 },
    { src: frame43_3, borderPx: 16 },
    { src: frame43_4, borderPx: 20 },
  ],
  "3:4": [
    { src: frame43_0, borderPx: 20 },
    { src: frame43_1, borderPx: 22 },
    { src: frame43_2, borderPx: 16 },
    { src: frame43_3, borderPx: 16 },
    { src: frame43_4, borderPx: 20 },
  ],
};

const IMAGES_PER_BATCH = 35;

const getSeedFromString = (value) => {
  const input = String(value || "");
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + (input.codePointAt(index) || 0)) >>> 0;
  }

  return hash;
};

const pickFrameForImage = (ratioKey, seedSource) => {
  const frameList = FRAME_CONFIG[ratioKey] || FRAME_CONFIG["1:1"];

  if (!frameList?.length) return null;

  const seed = getSeedFromString(seedSource);
  const frameIndex = seed % frameList.length;

  return frameList[frameIndex];
};

const Photography = () => {
  const navigate = useNavigate();
  const { data: images, loading, error } = useImages("photography");

  const [imageRatioByKey, setImageRatioByKey] = useState({});
  const [visibleCount, setVisibleCount] = useState(IMAGES_PER_BATCH);

  const observer = useRef();

  const safeImages = images || [];

  useEffect(() => {
    setVisibleCount(IMAGES_PER_BATCH);
  }, [safeImages.length]);

  const displayedImages = safeImages.slice(0, visibleCount);

  const lastImageRef = useCallback(
    (node) => {
      if (loading) return;

      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            visibleCount < safeImages.length
          ) {
            setVisibleCount((prev) =>
              Math.min(prev + IMAGES_PER_BATCH, safeImages.length)
            );
          }
        },
        {
          rootMargin: "400px",
        }
      );

      if (node) {
        observer.current.observe(node);
      }
    },
    [loading, visibleCount, safeImages.length]
  );

  const handleImageLoad = (key) => (event) => {
    const loadedImage = event.currentTarget;

    const delta =
      loadedImage.naturalHeight - loadedImage.naturalWidth;

    const isSquare = Math.abs(delta) <= 5;

    const ratioKey = isSquare
      ? "1:1"
      : delta > 0
      ? "3:4"
      : "4:3";

    setImageRatioByKey((prev) =>
      prev[key] === ratioKey
        ? prev
        : {
            ...prev,
            [key]: ratioKey,
          }
    );
  };

  const handleRandomClick = () => {
    if (loading || safeImages.length === 0) return;

    const randomIndex = Math.floor(
      Math.random() * safeImages.length
    );

    navigate(`/photography/${randomIndex}`);
  };

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  return (
    <div className="p-4 mx-auto max-w-7xl overflow-x-hidden">
      <button
        type="button"
        onClick={handleRandomClick}
        className="mx-auto mb-2 block bg-transparent p-0 shadow-none"
        aria-label="Open random photograph"
      >
        <img
          src={random}
          alt="Random"
          className="w-80 h-auto mx-auto cursor-pointer"
        />
      </button>

      {loading && <Spinner text="Loading photographs..." />}

      {error && (
        <p className="text-red-600">
          Unable to load photographs.
        </p>
      )}

      <div className="mx-auto m-10 p-6 overflow-x-hidden">
        {safeImages.length > 0 && (
          <p className="mb-4 text-sm text-white/70">
            Showing {safeImages.length} photographs
          </p>
        )}

        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex w-full justify-center overflow-visible pt-8"
          columnClassName="px-4"
        >
          {displayedImages.map((img, idx) => {
            const key = img.id || idx;
            const ratioKey = imageRatioByKey[key];

            const frame = pickFrameForImage(
              ratioKey,
              img.name || img.id || idx
            );

            const frameBorderPx = frame?.borderPx ?? 6;

            const shouldFlip = ratioKey === "3:4";

            const frameTransform = shouldFlip
              ? "rotate(90deg) scale(1.3333)"
              : undefined;

            const isLast =
              idx === displayedImages.length - 1;

            return (
              <button
                key={key}
                ref={isLast ? lastImageRef : null}
                type="button"
                className="mb-20 sm:mb-12 cursor-pointer block w-full bg-transparent p-0 shadow-none"
                onClick={() =>
                  navigate(`/photography/${idx}`)
                }
                aria-label={`Open photo ${
                  img.name || idx + 1
                }`}
              >
                <div
                  className="relative w-full overflow-hidden"
                  style={{ padding: frameBorderPx }}
                >
                  <img
                    src={img.src}
                    alt={img.name}
                    className="w-full h-auto object-contain"
                    onLoad={handleImageLoad(key)}
                    loading="lazy"
                  />

                  {(() => {
                    const x = randomInt(1, 100);
                    const y = randomInt(1, 500);

                    if (x === 1) {
                      return (
                        <img
                          src={bug1}
                          alt="Bug"
                          className="absolute inset-0 w-full h-full object-contain z-10 transform scale-[0.5]"
                        />
                      );
                    }

                    if (x === 2) {
                      return (
                        <img
                          src={bug2}
                          alt="Bug"
                          className="absolute inset-0 w-full h-full object-contain z-10"
                        />
                      );
                    }

                    if (y === 101) {
                      return (
                        <img
                          src={spider}
                          alt="Spider"
                          className="absolute top-[5px] left-[50%] translate-x-[-50%] w-[100px] h-fit object-contain z-10"
                        />
                      );
                    }

                    return null;
                  })()}

                  {frame?.src && (
                    <img
                      src={frame.src}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      style={
                        frameTransform
                          ? {
                              transform: frameTransform,
                              transformOrigin: "center",
                            }
                          : undefined
                      }
                    />
                  )}
                </div>
              </button>
            );
          })}
        </Masonry>

        {visibleCount < safeImages.length && (
          <div className="py-10 flex justify-center">
            <Spinner text="Loading more..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default Photography;