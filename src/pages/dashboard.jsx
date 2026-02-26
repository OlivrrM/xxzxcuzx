import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { addItem } from "../utils/firestore";
import { uploadFileToGitHub, deleteFileFromGitHub } from "../utils/github";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import useImages from "../hooks/useImages";
import exifr from "exifr";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const {
    data: photos,
    loading: photosLoading,
    error: photosError,
    reload,
  } = useImages("photography");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dateCreated, setDateCreated] = useState("");
  const [cameraModel, setCameraModel] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setStatus("Uploading to GitHub...");
    try {
      const path = `photography/${Date.now()}_${file.name}`;
      // attach path so we can delete later

      const rawUrl = await uploadFileToGitHub(file, path);
      setStatus("Saving record to Firestore...");
      const doc = {
        name: name || file.name,
        src: rawUrl,
        dateCreated: dateCreated || new Date().toISOString(),
        description,
        cameraModel,
        location,
      };
      await addItem("photography", { ...doc, path });
      reload();
      setStatus("Upload complete");
      setFile(null);
      setName("");
      setDescription("");
      setDateCreated("");
      setCameraModel("");
      setLocation("");
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleFileSelect = async (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (!f) return;
    try {
      const meta = await exifr.parse(f);
      if (meta) {
        if (meta.DateTimeOriginal) {
          // format yyyy-mm-dd
          const d = new Date(meta.DateTimeOriginal);
          setDateCreated(d.toISOString().slice(0, 10));
        }
        if (meta.Model) setCameraModel(meta.Model);
        if (meta.GPSLatitude && meta.GPSLongitude) {
          setLocation(`${meta.GPSLatitude},${meta.GPSLongitude}`);
        }
      }
    } catch (err) {
      console.warn("failed to read metadata", err);
    }
  };

  const handleDelete = async (item) => {
    if (!item || !item.id) {
      console.warn("handleDelete called with invalid item", item);
      return;
    }
    if (!window.confirm("Delete this photo?")) return;
    setStatus("Deleting…");
    try {
      await deleteDoc(doc(db, "photography", item.id));
      if (item.path) {
        console.log('deleting remote file at path', item.path);
        try {
          await deleteFileFromGitHub(item.path);
        } catch (ghErr) {
          console.error('GitHub deletion failed', ghErr);
          // still proceed, but inform user
          setStatus(`Firestore deleted; GitHub error: ${ghErr.message}`);
          reload();
          return;
        }
      } else {
        console.log('no path stored for item, skipping GitHub delete');
      }
      setStatus("Deleted");
      reload();
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto text-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 underline"
        >
          Log out
        </button>
      </div>
      {status && <p className="mb-2 text-white">{status}</p>}
      {photosError && <p className="text-red-500">{photosError.message}</p>}
      {photosLoading ? (
        <p>Loading entries…</p>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-4">
          {photos.filter(p => {
                    if (!p.id) {
                      console.warn('Dashboard: skipping photo without id', p);
                      return false;
                    }
                    return true;
                  }).map((p) => (
            <div key={p.id || p.path} className="relative group">
              <img
                src={p.src}
                alt={p.name || "photo"}
                className="w-full h-auto object-cover rounded"
              />
              <button
                type="button"
                onClick={() => handleDelete(p)}
                className="absolute top-1 right-1 bg-white bg-opacity-75 text-red-600 rounded px-1 py-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Photo file</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            required
            className="text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded bg-white text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Date created (optional)
          </label>
          <input
            type="date"
            value={dateCreated}
            onChange={(e) => setDateCreated(e.target.value)}
            className="w-full border px-3 py-2 rounded bg-white text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Camera model (optional)
          </label>
          <input
            type="text"
            value={cameraModel}
            onChange={(e) => setCameraModel(e.target.value)}
            className="w-full border px-3 py-2 rounded bg-white text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Location (optional)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border px-3 py-2 rounded bg-white text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded bg-white text-black"
          />
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Upload Photo
        </button>
      </form>
    </div>
  );
};

export default Dashboard;
