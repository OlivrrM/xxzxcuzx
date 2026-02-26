import useImages from "../../hooks/useImages";
import { useParams } from "react-router";

const Photo = () => {
  const { index } = useParams();
  const { data: images, loading, error } = useImages("photography");

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

  const idx = parseInt(index, 10);
  const image = !isNaN(idx) ? images[idx] : null;

  if (!image) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Photo not found</h1>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{image.name}</h1>
      <img src={image.src} alt={image.name} className="w-full h-auto" />
      <p className="mt-4 text-lg text-red-500">{image.description}</p>
      <p className="mt-2 text-lg text-red-500">{image.date}</p>
      <p className="mt-2 text-lg text-red-500">{image.location}</p>
      <p className="mt-2 text-lg text-red-500">Camera: {image.cameraModel}</p>
    </div>
  );
};

export default Photo;
