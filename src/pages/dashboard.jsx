import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { addItem } from "../utils/firestore";
import { uploadFileToGitHub, deleteFileFromGitHub } from "../utils/github";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import useImages from "../hooks/useImages";
import exifr from "exifr";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collection, setCollection] = useState("photography");
  const [file, setFile] = useState(null);
  const [massFiles, setMassFiles] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const {
    data: items,
    loading: itemsLoading,
    error: itemsError,
    reload,
  } = useImages(collection);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
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
    if (
      collection === "photography" &&
      !file &&
      massFiles.length === 0 &&
      !editItem
    )
      return;

    setStatus("Saving...");
    try {
      // handle edit case first
      if (editItem) {
        const updateRef = doc(db, collection, editItem.id);
        const updates = { name };
        if (collection === "photography") {
          if (dateCreated) updates.dateCreated = dateCreated;
          if (description) updates.description = description;
          if (cameraModel) updates.cameraModel = cameraModel;
          if (location) updates.location = location;
        } else {
          if (description) updates.description = description;
          if (url) updates.url = url;
        }
        await updateDoc(updateRef, updates);
        reload();
        setStatus("Update complete");
        setFile(null);
        setMassFiles([]);
        setEditItem(null);
        setName("");
        setUrl("");
        setDescription("");
        setDateCreated("");
        setCameraModel("");
        setLocation("");
        return;
      }

      if (collection === "photography") {
        if (massFiles.length > 0) {
          // multiple files upload
          for (const f of massFiles) {
            const path = `photography/${Date.now()}_${f.name}`;
            const rawUrl = await uploadFileToGitHub(f, path);
            const docData = {
              name: f.name,
              src: rawUrl,
              dateCreated: dateCreated || new Date().toISOString(),
            };
            await addItem("photography", { ...docData, path });
          }
        } else {
          // single file
          setStatus("Uploading to GitHub...");
          const path = `photography/${Date.now()}_${file.name}`;
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
        }
      } else if (collection === "software" || collection === "games") {
        const doc = { name };
        if (description) doc.description = description;
        if (url) doc.url = url;
        await addItem(collection, doc);
      }

      reload();
      setStatus("Upload complete");
      setFile(null);
      setMassFiles([]);
      setEditItem(null);
      setName("");
      setUrl("");
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
    const files = Array.from(e.target.files);
    if (files.length > 1) {
      setMassFiles(files);
      setFile(null);
      // auto-fill some info from first file
      setName("");
    } else {
      const f = files[0];
      setFile(f);
      setMassFiles([]);
      if (!f) return;
      setName(f.name);
      try {
        const meta = await exifr.parse(f);
        if (meta) {
          if (meta.DateTimeOriginal) {
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
    }
  };

  const handleDelete = async (item) => {
    if (!item || !item.id) {
      console.warn("handleDelete called with invalid item", item);
      return;
    }
    if (!window.confirm("Delete this item?")) return;
    setStatus("Deleting…");
    try {
      await deleteDoc(doc(db, collection, item.id));
      if (collection === "photography" && item.path) {
        console.log("deleting remote file at path", item.path);
        try {
          await deleteFileFromGitHub(item.path);
        } catch (ghErr) {
          console.error("GitHub deletion failed", ghErr);
          setStatus(`Firestore deleted; GitHub error: ${ghErr.message}`);
          reload();
          return;
        }
      } else if (collection === "photography") {
        console.log("no path stored for item, skipping GitHub delete");
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
        <div>
          <label className="mr-2">Type</label>
          <select
            value={collection}
            onChange={(e) => {
              setCollection(e.target.value);
              // reset form fields
              setFile(null);
              setName("");
              setUrl("");
              setDescription("");
              setDateCreated("");
              setCameraModel("");
              setLocation("");
              setStatus("");
            }}
            className="border px-2 py-1 text-black mr-4"
          >
            <option value="photography">Photography</option>
            <option value="software">Software</option>
            <option value="games">Games</option>
          </select>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 underline"
          >
            Log out
          </button>
        </div>
      </div>
      {status && <p className="mb-2 text-white">{status}</p>}
      {itemsError && <p className="text-red-500">{itemsError.message}</p>}
      {itemsLoading ? (
        <p>Loading entries…</p>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-4">
          {items
            .filter((p) => {
              if (!p.id) {
                console.warn("Dashboard: skipping item without id", p);
                return false;
              }
              return true;
            })
            .map((p) => (
              <div key={p.id || p.path} className="relative group">
                {collection === "photography" ? (
                  <img
                    src={p.src}
                    alt={p.name || "photo"}
                    className="w-full h-auto object-cover rounded"
                  />
                ) : (
                  <div className="p-4 bg-gray-700 rounded">
                    <h3 className="font-semibold text-center">{p.name}</h3>
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-sm block text-center break-words"
                      >
                        {p.url}
                      </a>
                    )}
                    {p.description && (
                      <p className="text-xs mt-1 text-gray-300">
                        {p.description}
                      </p>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(p)}
                  className="absolute top-1 right-1 bg-white bg-opacity-75 text-red-600 rounded px-1 py-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditItem(p);
                    setName(p.name || "");
                    setDescription(p.description || "");
                    setDateCreated(p.dateCreated || "");
                    setCameraModel(p.cameraModel || "");
                    setLocation(p.location || "");
                  }}
                  className="absolute top-1 left-1 bg-blue-500 bg-opacity-75 text-white rounded px-1 py-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Edit
                </button>
              </div>
            ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {collection && !editItem && (
          <div>
            <label className="block text-sm font-medium mb-1">Image file</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="text-black"
              multiple={collection === 'photography'}
            />
          </div>
        )}
        {editItem && (
          <p className="text-yellow-400">Editing item; file upload disabled</p>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">
            Name{collection !== "photography" ? "" : " (optional)"}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded bg-white text-black"
          />
        </div>
        {collection === "photography" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Date created (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateCreated}
                  onChange={(e) => setDateCreated(e.target.value)}
                  className="w-full border px-3 py-2 rounded bg-white text-black"
                />
                <button
                  type="button"
                  onClick={() => {
                    const f = file || massFiles[0];
                    if (f) {
                      exifr
                        .parse(f)
                        .then((m) => {
                          if (m && m.DateTimeOriginal) {
                            const d = new Date(m.DateTimeOriginal);
                            setDateCreated(d.toISOString().slice(0, 10));
                          }
                        })
                        .catch(() => {});
                    }
                  }}
                  className="bg-gray-200 px-2 rounded"
                >
                  use created
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const f = file || massFiles[0];
                    if (f) {
                      exifr
                        .parse(f)
                        .then((m) => {
                          if (m && m.ModifyDate) {
                            const d = new Date(m.ModifyDate);
                            setDateCreated(d.toISOString().slice(0, 10));
                          }
                        })
                        .catch(() => {});
                    }
                  }}
                  className="bg-gray-200 px-2 rounded"
                >
                  use modified
                </button>
              </div>
            </div>
          </>
        )}
        {collection === "photography" && (
          <>
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
          </>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded bg-white text-black"
            disabled={massFiles.length > 0}
          />
        </div>
        {editItem && (
          <button
            type="button"
            onClick={() => {
              // revert form
              setEditItem(null);
              setFile(null);
              setName("");
              setUrl("");
              setDescription("");
              setDateCreated("");
              setCameraModel("");
              setLocation("");
              setStatus("");
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
          >
            Cancel Edit
          </button>
        )}
        {(collection === 'software' || collection === 'games') && (
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full border px-3 py-2 rounded bg-white text-black"
            />
          </div>
        )}
        {collection && collection !== 'photography' && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Date created (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateCreated}
                onChange={(e) => setDateCreated(e.target.value)}
                className="w-full border px-3 py-2 rounded bg-white text-black"
              />
            </div>
          </div>
        )}
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          {editItem ? "Update" : "Upload"}
        </button>
      </form>
    </div>
  );
};

export default Dashboard;
