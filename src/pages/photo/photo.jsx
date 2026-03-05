import { useEffect } from "react";
import useImages from "../../hooks/useImages";
import { useNavigate, useParams } from "react-router";
import arrow from "../../assets/FreeVector-3D-Arrow-Vector-Graphics.png"
import PixiImageGlow from "../../components/PixiImageGlow";

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
    <div className="p-4 max-w-5xl mx-auto flex flex-col items-center text-center">
      <h1 className="text-2xl font-bold mb-4 italic">{image.name}</h1>

      <PixiImageGlow
        src={image.src}
        alt={image.name}
        borderPx={IMAGE_BORDER_BLUR_PX}
        blurStrength={IMAGE_GLOW_STRENGTH}
        className="w-full max-w-3xl"
      />

      <div className="mt-6 w-full flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goToPrevious}
          disabled={!canGoPrevious}
          className={`relative shadow-none bg-transparent -secondary w-[250px] h-auto hover:bg-transparent -scale-x-100 ${
            canGoPrevious ? "" : "opacity-40 cursor-not-allowed"
          }`}
        >
          <img src={arrow} alt="Next" className="w-fit h-auto" />
        </button>

        <div className="flex-1 text-center">
          <p className="text-lg text-red-500">{image.description}</p>
          
          {image.dateCreated && (
            <p className="mt-2 text-lg text-red-500">
              <b>Date:</b> {image.dateCreated}
            </p>
          )}
          {image.location && (
            <p className="mt-2 text-lg text-red-500">
              <b>Location:</b> {image.location}
            </p>
          )}
          {image.cameraModel && (
          <p className="mt-2 text-lg text-red-500">
              <b>Camera:</b> {image.cameraModel}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={goToNext}
          disabled={!canGoNext}
          className={`relative shadow-none bg-transparent -secondary w-[250px] h-auto hover:bg-transparent ${
            canGoNext ? "" : "opacity-40 cursor-not-allowed"
          }`}
        >
          <img src={arrow} alt="Next" className="w-fit h-auto rotate-x-180" />
        </button>
      </div>
    </div>
  );
};

export default Photo;
