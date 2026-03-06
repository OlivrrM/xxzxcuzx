import React, { useState, useEffect } from "react";

import random from "../assets/random.png";
import { useNavigate } from "react-router";
import useImages from "../hooks/useImages";
import Masonry from "react-masonry-css";
import InfiniteScroll from "react-infinite-scroll-component";

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

const FRAME_CONFIG = {
  "1:1": [
    { src: frame11_0, borderPx: 18 },
    { src: frame11_1, borderPx: 18 },
    { src: frame11_2, borderPx: 18 },
    { src: frame11_3, borderPx: 20 },
    { src: frame11_4, borderPx: 20 },
  ],
  "4:3": [
    { src: frame43_0, borderPx: 2 },
    { src: frame43_1, borderPx: 2 },
    { src: frame43_2, borderPx: 2 },
    { src: frame43_3, borderPx: 2 },
    { src: frame43_4, borderPx: 2 },
  ],
  "3:4": [
    { src: frame43_0, borderPx: 2 },
    { src: frame43_1, borderPx: 2 },
    { src: frame43_2, borderPx: 2 },
    { src: frame43_3, borderPx: 2 },
    { src: frame43_4, borderPx: 2 },
  ],
};

const RATIO_TARGETS = {
  "1:1": 1,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
};

const getRatioBucket = (width, height, tolerance = 0.06) => {
  if (!width || !height) return "1:1";
  const ratio = width / height;

  let bestKey = "1:1";
  let bestDelta = Number.POSITIVE_INFINITY;

  Object.entries(RATIO_TARGETS).forEach(([key, target]) => {
    const delta = Math.abs(ratio - target) / target;
    if (delta < bestDelta) {
      bestDelta = delta;
      bestKey = key;
    }
  });

  if (bestDelta <= tolerance) {
    return bestKey;
  }

  return bestKey;
};

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
  const [imageFlipByKey, setImageFlipByKey] = useState({});
  const [displayedImages, setDisplayedImages] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (images.length > 0) {
      setDisplayedImages(images.slice(0, 20));
      setHasMore(images.length > 20);
    }
  }, [images]);

  const fetchMoreData = () => {
    if (displayedImages.length >= images.length) {
      setHasMore(false);
      return;
    }
    const nextBatch = images.slice(displayedImages.length, displayedImages.length + 20);
    setDisplayedImages(prev => [...prev, ...nextBatch]);
  };

  const handleImageLoad = (key) => (event) => {
    const loadedImage = event.currentTarget;
    const shouldFlip = loadedImage.naturalHeight > loadedImage.naturalWidth;
    const ratioBucket = getRatioBucket(
      loadedImage.naturalWidth,
      loadedImage.naturalHeight
    );
    setImageRatioByKey((prev) =>
      prev[key] === ratioBucket
        ? prev
        : {
          ...prev,
          [key]: ratioBucket,
        }
    );
    setImageFlipByKey((prev) =>
      prev[key] === shouldFlip
        ? prev
        : {
          ...prev,
          [key]: shouldFlip,
        }
    );
  };

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
    <div className="p-4 mx-auto max-w-7xl overflow-x-hidden">
      <button
        type="button"
        onClick={handleRandomClick}
        className="mx-auto mb-16 block bg-transparent p-0 shadow-none"
        aria-label="Open random photograph"
      >
        <img
          src={random}
          alt="Random"
          className="w-80 h-auto mx-auto cursor-pointer"
        />
      </button>
      {loading && <p>Loading photographs…</p>}
      {error && <p className="text-red-600">Unable to load photographs.</p>}

      <div className="mx-auto m-10 p-6 overflow-x-hidden">
        <InfiniteScroll
          dataLength={displayedImages.length}
          next={fetchMoreData}
          hasMore={hasMore}
          loader={<h4>Loading...</h4>}
        >
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex w-auto -ml-12"
            columnClassName="pl-12"
          >
            {displayedImages.map((img, idx) => {
              const key = img.id || idx;
              const ratioKey = imageRatioByKey[key] || "1:1";
            const frame = pickFrameForImage(ratioKey, img.name || img.id || idx);
            const shouldFlipFrame = imageFlipByKey[key] || false;
            const frameBorderPx = frame?.borderPx ?? 6;

            return (
              <button
                key={key}
                type="button"
                className="mb-12 cursor-pointer block w-full bg-transparent p-0 shadow-none"
                onClick={() => {
                  navigate(`/photography/${idx}`);
                }}
                aria-label={`Open photo ${img.name || idx + 1}`}
              >
                <div className="relative h-auto mx-auto overflow-hidden">
                  <div
                    className="absolute z-0 overflow-hidden flex items-center justify-center"
                    style={{
                      top: frameBorderPx,
                      right: frameBorderPx,
                      bottom: frameBorderPx,
                      left: frameBorderPx,
                    }}
                  >
                    <img
                      src={img.src}
                      alt={img.name}
                      className="w-auto h-auto max-w-full max-h-full object-contain"
                      onLoad={handleImageLoad(key)}
                      loading="lazy"
                    />
                  </div>
                  {frame?.src && (
                    <img
                      src={frame.src}
                      alt=""
                      aria-hidden="true"
                      className="relative scale-[1.1] z-10 w-auto h-auto max-w-full object-contain pointer-events-none"
                      style={shouldFlipFrame ? { transform: "scaleX(-1)" } : undefined}
                    />
                  )}
                </div>
              </button>
            );
          })}
          </Masonry>
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default Photography;
