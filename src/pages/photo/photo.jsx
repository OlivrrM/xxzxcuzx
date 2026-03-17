import { useEffect } from "react";
import useImages from "../../hooks/useImages";
import { useNavigate, useParams } from "react-router";
import arrow from "../../assets/FreeVector-3D-Arrow-Vector-Graphics.png"
import PixiImageGlow from "../../components/PixiImageGlow";
import kitten from "../../assets/kitten.gif"

const IMAGE_BORDER_BLUR_PX = 0;
const IMAGE_GLOW_STRENGTH = 0;

const Photo = () => {
  const { index } = useParams();
  const navigate = useNavigate();
  const { data: images, loading, error } = useImages("photography");
  const resolvedImages = images ?? [];
  const idx = Number.parseInt(index, 10);
  const invalidIndex = Number.isNaN(idx);
  const image = invalidIndex ? null : resolvedImages[idx];
  const maxIndex = resolvedImages.length - 1;
  const canGoPrevious = idx > 0;
  const canGoNext = idx < maxIndex;

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  useEffect(() => {
    if (!image) return;

    const scrollToBottom = () => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "auto",
      });
    };

    scrollToBottom();
    const rafId = requestAnimationFrame(scrollToBottom);
    const timerShort = setTimeout(scrollToBottom, 120);
    const timerLong = setTimeout(scrollToBottom, 400);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerShort);
      clearTimeout(timerLong);
    };
  }, [image?.id, image?.src, idx]);

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Photo</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Photo</h1>
        <p className="text-red-600">Failed to load image data.</p>
      </div>
    );
  }

  const goToPrevious = () => {
    if (!canGoPrevious) return;
    navigate(`/photography/${idx - 1}`);
  };

  const goToNext = () => {
    if (!canGoNext) return;
    navigate(`/photography/${idx + 1}`);
  };

  if (!image) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Photo not found</h1>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 max-w-5xl mx-auto flex flex-col items-center text-center">
      <h1 className="text-2xl font-bold mb-4 italic">{image.name}</h1>

      <div className="relative w-full flex justify-center">

        <PixiImageGlow
          src={image.src}
          alt={image.name}
          borderPx={IMAGE_BORDER_BLUR_PX}
          blurStrength={IMAGE_GLOW_STRENGTH}
          className="w-full max-w-xs sm:max-w-2xl md:max-w-3xl h-auto rounded-md"
        />

        {randomInt(1, 10) == 5 && (
          <img
            src={kitten}
            alt="Kitten"
            className="left-[-50px] bottom-0 w-[50px] absolute"
          />
        )}
      </div>

      {/* Desktop: arrows left/right, big. Mobile: arrows bottom, 50% width each. */}
      <div className="mt-6 w-full hidden sm:flex flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={goToPrevious}
          disabled={!canGoPrevious}
          className={`relative shadow-none bg-transparent -secondary w-[120px] h-[120px] hover:bg-transparent -scale-x-100 ${
            canGoPrevious ? "" : "opacity-40 cursor-not-allowed"
          }`}
        >
          <img src={arrow} alt="Previous" className="w-full h-full object-contain" />
        </button>

        <div className="flex-1 text-center px-2">
          <p className="text-base sm:text-lg text-red-500">{image.description}</p>
          {image.dateCreated && (
            <p className="mt-2 text-base sm:text-lg text-red-500">
              <b>Date:</b> {image.dateCreated}
            </p>
          )}
          {image.location && (
            <p className="mt-2 text-base sm:text-lg text-red-500">
              <b>Location:</b> {image.location}
            </p>
          )}
          {image.cameraModel && (
            <p className="mt-2 text-base sm:text-lg text-red-500">
              <b>Camera:</b> {image.cameraModel}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={goToNext}
          disabled={!canGoNext}
          className={`relative shadow-none bg-transparent -secondary w-[120px] h-[120px] hover:bg-transparent ${
            canGoNext ? "" : "opacity-40 cursor-not-allowed"
          }`}
        >
          <img src={arrow} alt="Next" className="w-full h-full object-contain rotate-x-180" />
        </button>
      </div>

      {/* Mobile: arrows at bottom, 50% width each, not fixed, no shadow, no padding */}
      <div className="w-full flex sm:hidden mt-6">
        <button
          type="button"
          onClick={goToPrevious}
          disabled={!canGoPrevious}
          className={`w-1/2 h-16 bg-transparent flex items-center justify-center -scale-x-100 border-none shadow-none p-0 m-0 ${
            canGoPrevious ? "" : "opacity-40 cursor-not-allowed"
          }`}
        >
          <img src={arrow} alt="Previous" className="w-10 h-10 object-contain" />
        </button>
        <button
          type="button"
          onClick={goToNext}
          disabled={!canGoNext}
          className={`w-1/2 h-16 bg-transparent flex items-center justify-center border-none shadow-none p-0 m-0 ${
            canGoNext ? "" : "opacity-40 cursor-not-allowed"
          }`}
        >
          <img src={arrow} alt="Next" className="w-10 h-10 object-contain rotate-x-180" />
        </button>
      </div>
    </div>
  );
};

export default Photo;
