import { useEffect } from "react";
import useImages from "../../hooks/useImages";
import { useNavigate, useParams } from "react-router";
import arrow from "../../assets/FreeVector-3D-Arrow-Vector-Graphics.png"

const IMAGE_BORDER_BLUR_PX = 10;

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
    const timer = setTimeout(scrollToBottom, 0);

    return () => clearTimeout(timer);
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

      <div className="relative w-full max-w-3xl overflow-hidden">
        <img
          src={image.src}
          alt=""
          aria-hidden="true"
          className="w-full h-auto blur-md scale-[1.03]"
        />
        <div
          className="absolute overflow-hidden"
          style={{
            top: IMAGE_BORDER_BLUR_PX,
            right: IMAGE_BORDER_BLUR_PX,
            bottom: IMAGE_BORDER_BLUR_PX,
            left: IMAGE_BORDER_BLUR_PX,
          }}
        >
          <img src={image.src} alt={image.name} className="w-full h-full object-contain" />
        </div>
      </div>

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
