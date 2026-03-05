import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import exifr from "exifr";
import { useAuth } from "../contexts/AuthContext";
import useImages from "../hooks/useImages";
import { addItem } from "../utils/firestore";
import { uploadFileToGitHub, deleteFileFromGitHub } from "../utils/github";
import { db } from "../firebase";
import GenericEntryForm from "../components/dashboard/GenericEntryForm";
import ItemList from "../components/dashboard/ItemList";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    data: photographyItems,
    loading: photographyLoading,
    error: photographyError,
    reload: reloadPhotography,
  } = useImages("photography");
  const {
    data: softwareItems,
    loading: softwareLoading,
    error: softwareError,
    reload: reloadSoftware,
  } = useImages("software");
  const {
    data: gamesItems,
    loading: gamesLoading,
    error: gamesError,
    reload: reloadGames,
  } = useImages("games");
  const {
    data: placeHolderItems,
    loading: placeHolderLoading,
    error: placeHolderError,
    reload: reloadPlaceHolder,
  } = useImages("placeHolder");

  const [status, setStatus] = useState({
    photography: "",
    software: "",
    games: "",
    placeHolder: "",
  });

  const [photoForm, setPhotoForm] = useState({
    file: null,
    massFiles: [],
    editItem: null,
    name: "",
    description: "",
    dateCreated: "",
    cameraModel: "",
    location: "",
  });

  const [softwareForm, setSoftwareForm] = useState({
    editItem: null,
    name: "",
    url: "",
    description: "",
    dateCreated: "",
  });

  const [gamesForm, setGamesForm] = useState({
    file: null,
    massFiles: [],
    editItem: null,
    name: "",
    url: "",
    description: "",
    dateCreated: "",
  });

  const [placeHolderForm, setPlaceHolderForm] = useState({
    editItem: null,
    name: "",
    url: "",
    description: "",
    dateCreated: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const setSectionStatus = (section, message) => {
    setStatus((prev) => ({ ...prev, [section]: message }));
  };

  const [photoEditSnapshot, setPhotoEditSnapshot] = useState(null);
  const [softwareEditSnapshot, setSoftwareEditSnapshot] = useState(null);
  const [gamesEditSnapshot, setGamesEditSnapshot] = useState(null);
  const [placeHolderEditSnapshot, setPlaceHolderEditSnapshot] = useState(null);
  const [photoDateSource, setPhotoDateSource] = useState(null);
  const [photoUploadMode, setPhotoUploadMode] = useState("single");
  const [photoMassMeta, setPhotoMassMeta] = useState([]);
  const [photoBulkDateSource, setPhotoBulkDateSource] = useState("created");

  const normalizeExifDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  };

  const clearPhotoMassMeta = () => {
    photoMassMeta.forEach((meta) => {
      if (meta.previewUrl) {
        URL.revokeObjectURL(meta.previewUrl);
      }
    });
    setPhotoMassMeta([]);
  };

  const parsePhotoFileMeta = async (file) => {
    const base = {
      name: file.name,
      createdDate: "",
      modifiedDate: "",
      cameraModel: "",
      location: "",
      previewUrl: URL.createObjectURL(file),
    };

    try {
      const metadata = await exifr.parse(file);
      if (!metadata) return base;

      return {
        ...base,
        createdDate: normalizeExifDate(metadata.DateTimeOriginal),
        modifiedDate: normalizeExifDate(metadata.ModifyDate),
        cameraModel: metadata.Model || "",
        location:
          metadata.GPSLatitude && metadata.GPSLongitude
            ? `${metadata.GPSLatitude},${metadata.GPSLongitude}`
            : "",
      };
    } catch {
      return base;
    }
  };

  const handlePhotoModeChange = (mode) => {
    if (photoForm.editItem) return;
    if (mode === photoUploadMode) return;

    clearPhotoMassMeta();
    setPhotoUploadMode(mode);
    setPhotoDateSource(null);
    setPhotoBulkDateSource("created");
    setPhotoForm((prev) => ({
      ...prev,
      file: null,
      massFiles: [],
      name: "",
      description: "",
      dateCreated: "",
      cameraModel: "",
      location: "",
    }));
  };

  const resetPhotoForm = () => {
    clearPhotoMassMeta();
    setPhotoForm({
      file: null,
      massFiles: [],
      editItem: null,
      name: "",
      description: "",
      dateCreated: "",
      cameraModel: "",
      location: "",
    });
    setPhotoEditSnapshot(null);
    setPhotoDateSource(null);
    setPhotoBulkDateSource("created");
    setPhotoUploadMode("single");
  };

  const resetSimpleForm = (setter) => {
    setter({
      editItem: null,
      name: "",
      url: "",
      description: "",
      dateCreated: "",
    });
  };

  const resetGamesForm = () => {
    setGamesForm({
      file: null,
      massFiles: [],
      editItem: null,
      name: "",
      url: "",
      description: "",
      dateCreated: "",
    });
    setGamesEditSnapshot(null);
  };

  const clearPhotoForm = () => {
    clearPhotoMassMeta();
    setPhotoForm((prev) => ({
      ...prev,
      file: null,
      massFiles: [],
      name: "",
      description: "",
      dateCreated: "",
      cameraModel: "",
      location: "",
    }));
    setPhotoDateSource(null);
    setPhotoBulkDateSource("created");
  };

  const clearGamesForm = () => {
    setGamesForm((prev) => ({
      ...prev,
      file: null,
      massFiles: [],
      name: "",
      url: "",
      description: "",
      dateCreated: "",
    }));
  };

  const clearSimpleFormFields = (setter) => {
    setter((prev) => ({
      ...prev,
      name: "",
      url: "",
      description: "",
      dateCreated: "",
    }));
  };

  const revertPhotoForm = () => {
    if (!photoEditSnapshot) return;
    clearPhotoMassMeta();
    setPhotoForm((prev) => ({
      ...prev,
      file: null,
      massFiles: [],
      ...photoEditSnapshot,
    }));
    setPhotoDateSource(null);
    setPhotoBulkDateSource("created");
    setPhotoUploadMode("single");
  };

  const revertGamesForm = () => {
    if (!gamesEditSnapshot) return;
    setGamesForm((prev) => ({
      ...prev,
      file: null,
      massFiles: [],
      ...gamesEditSnapshot,
    }));
  };

  const revertSimpleForm = (setter, snapshot) => {
    if (!snapshot) return;
    setter((prev) => ({ ...prev, ...snapshot }));
  };

  const handlePhotoFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      clearPhotoMassMeta();
      setPhotoForm((prev) => ({ ...prev, file: null, massFiles: [] }));
      return;
    }

    if (photoUploadMode === "multiple") {
      clearPhotoMassMeta();
      const metadataList = await Promise.all(files.map((file) => parsePhotoFileMeta(file)));
      setPhotoMassMeta(metadataList);
      setPhotoForm((prev) => ({
        ...prev,
        file: null,
        massFiles: files,
        name: "",
        description: "",
        cameraModel: "",
        location: "",
      }));
      return;
    }

    clearPhotoMassMeta();
    const [singleFile] = files;
    setPhotoForm((prev) => ({
      ...prev,
      file: singleFile,
      massFiles: [],
      name: singleFile.name,
    }));

    try {
      const metadata = await exifr.parse(singleFile);
      if (!metadata) return;

      setPhotoForm((prev) => {
        const next = { ...prev };
        const createdDate = normalizeExifDate(metadata.DateTimeOriginal);
        const modifiedDate = normalizeExifDate(metadata.ModifyDate);
        if (photoDateSource === "modified" && modifiedDate) {
          next.dateCreated = modifiedDate;
        } else if (createdDate) {
          next.dateCreated = createdDate;
        }
        if (metadata.Model) {
          next.cameraModel = metadata.Model;
        }
        if (metadata.GPSLatitude && metadata.GPSLongitude) {
          next.location = `${metadata.GPSLatitude},${metadata.GPSLongitude}`;
        }
        return next;
      });
    } catch (error) {
      console.warn("Failed to read EXIF metadata", error);
    }
  };

  const setDateFromExif = async (kind) => {
    const currentFile = photoForm.file || photoForm.massFiles[0];
    if (!currentFile) return;

    try {
      const metadata = await exifr.parse(currentFile);
      if (!metadata) return;

      const sourceDate =
        kind === "created" ? metadata.DateTimeOriginal : metadata.ModifyDate;

      if (sourceDate) {
        const date = new Date(sourceDate);
        setPhotoForm((prev) => ({
          ...prev,
          dateCreated: date.toISOString().slice(0, 10),
        }));
        setPhotoDateSource(kind);
      }
    } catch {
      // no-op
    }
  };

  const applyPhotoBulkDateSource = (kind) => {
    setPhotoBulkDateSource(kind);
  };

  const handleGamesFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      setGamesForm((prev) => ({ ...prev, file: null, massFiles: [] }));
      return;
    }

    if (files.length > 1) {
      setGamesForm((prev) => ({
        ...prev,
        file: null,
        massFiles: files,
        name: "",
      }));
      return;
    }

    const singleFile = files[0];
    setGamesForm((prev) => ({
      ...prev,
      file: singleFile,
      massFiles: [],
      name: singleFile.name,
    }));

    try {
      const metadata = await exifr.parse(singleFile);
      if (!metadata?.DateTimeOriginal) return;
      const date = new Date(metadata.DateTimeOriginal);
      setGamesForm((prev) => ({ ...prev, dateCreated: date.toISOString().slice(0, 10) }));
    } catch (error) {
      console.warn("Failed to read EXIF metadata", error);
    }
  };

  const setGamesDateFromExif = async (kind) => {
    const currentFile = gamesForm.file || gamesForm.massFiles[0];
    if (!currentFile) return;

    try {
      const metadata = await exifr.parse(currentFile);
      if (!metadata) return;

      const sourceDate =
        kind === "created" ? metadata.DateTimeOriginal : metadata.ModifyDate;

      if (sourceDate) {
        const date = new Date(sourceDate);
        setGamesForm((prev) => ({
          ...prev,
          dateCreated: date.toISOString().slice(0, 10),
        }));
      }
    } catch {
      // no-op
    }
  };

  const handlePhotographySubmit = async (e) => {
    e.preventDefault();
    if (!photoForm.file && photoForm.massFiles.length === 0 && !photoForm.editItem) {
      return;
    }

    setSectionStatus("photography", "Saving...");
    try {
      const runPhotoEdit = async () => {
        const updates = { name: photoForm.name };
        if (photoForm.description) updates.description = photoForm.description;
        if (photoForm.dateCreated) updates.dateCreated = photoForm.dateCreated;
        if (photoForm.cameraModel) updates.cameraModel = photoForm.cameraModel;
        if (photoForm.location) updates.location = photoForm.location;

        await updateDoc(doc(db, "photography", photoForm.editItem.id), updates);
        reloadPhotography();
        setSectionStatus("photography", "Update complete");
        resetPhotoForm();
      };

      const runPhotoUpload = async () => {
        if (photoForm.massFiles.length > 0) {
          for (const [index, file] of photoForm.massFiles.entries()) {
            const meta = photoMassMeta[index] || {};
            const selectedDate =
              photoBulkDateSource === "modified"
                ? meta.modifiedDate
                : meta.createdDate;
            const path = `photography/${Date.now()}_${file.name}`;
            const src = await uploadFileToGitHub(file, path);
            await addItem("photography", {
              name: meta.name || file.name,
              src,
              path,
              dateCreated:
                selectedDate || meta.createdDate || meta.modifiedDate || new Date().toISOString(),
              cameraModel: meta.cameraModel || "",
              location: meta.location || "",
            });
          }
          return;
        }

        if (!photoForm.file) return;
        setSectionStatus("photography", "Uploading to GitHub...");
        const path = `photography/${Date.now()}_${photoForm.file.name}`;
        const src = await uploadFileToGitHub(photoForm.file, path);
        await addItem("photography", {
          name: photoForm.name || photoForm.file.name,
          src,
          path,
          dateCreated: photoForm.dateCreated || new Date().toISOString(),
          description: photoForm.description,
          cameraModel: photoForm.cameraModel,
          location: photoForm.location,
        });
      };

      if (photoForm.editItem) {
        await runPhotoEdit();
        return;
      }

      await runPhotoUpload();

      reloadPhotography();
      setSectionStatus("photography", "Upload complete");
      resetPhotoForm();
    } catch (error) {
      console.error(error);
      setSectionStatus("photography", `Error: ${error.message}`);
    }
  };

  const createSimpleSubmitHandler = ({
    section,
    form,
    setter,
    collection,
    reload,
  }) => {
    return async (e) => {
      e.preventDefault();
      if (!form.name && !form.editItem) return;

      setSectionStatus(section, "Saving...");
      try {
        const payload = { name: form.name };
        if (form.url) payload.url = form.url;
        if (form.description) payload.description = form.description;
        if (form.dateCreated) payload.dateCreated = form.dateCreated;

        if (form.editItem) {
          await updateDoc(doc(db, collection, form.editItem.id), payload);
          setSectionStatus(section, "Update complete");
          if (collection === "software") setSoftwareEditSnapshot(null);
          if (collection === "placeHolder") setPlaceHolderEditSnapshot(null);
        } else {
          await addItem(collection, payload);
          setSectionStatus(section, "Saved");
        }

        reload();
        resetSimpleForm(setter);
      } catch (error) {
        console.error(error);
        setSectionStatus(section, `Error: ${error.message}`);
      }
    };
  };

  const handleSoftwareSubmit = createSimpleSubmitHandler({
    section: "software",
    form: softwareForm,
    setter: setSoftwareForm,
    collection: "software",
    reload: reloadSoftware,
  });

  const handleGamesSubmit = async (e) => {
    e.preventDefault();
    if (!gamesForm.file && gamesForm.massFiles.length === 0 && !gamesForm.editItem) {
      return;
    }

    setSectionStatus("games", "Saving...");
    try {
      const runGamesEdit = async () => {
        const updates = { name: gamesForm.name };
        if (gamesForm.description) updates.description = gamesForm.description;
        if (gamesForm.dateCreated) updates.dateCreated = gamesForm.dateCreated;
        if (gamesForm.url) updates.url = gamesForm.url;

        await updateDoc(doc(db, "games", gamesForm.editItem.id), updates);
        reloadGames();
        setSectionStatus("games", "Update complete");
        resetGamesForm();
      };

      const runGamesUpload = async () => {
        if (gamesForm.massFiles.length > 0) {
          for (const file of gamesForm.massFiles) {
            const path = `games/${Date.now()}_${file.name}`;
            const src = await uploadFileToGitHub(file, path);
            await addItem("games", {
              name: file.name,
              src,
              path,
              dateCreated: gamesForm.dateCreated || new Date().toISOString(),
            });
          }
          return;
        }

        if (!gamesForm.file) return;
        setSectionStatus("games", "Uploading to GitHub...");
        const path = `games/${Date.now()}_${gamesForm.file.name}`;
        const src = await uploadFileToGitHub(gamesForm.file, path);
        await addItem("games", {
          name: gamesForm.name || gamesForm.file.name,
          src,
          path,
          dateCreated: gamesForm.dateCreated || new Date().toISOString(),
          description: gamesForm.description,
          url: gamesForm.url,
        });
      };

      if (gamesForm.editItem) {
        await runGamesEdit();
        return;
      }

      await runGamesUpload();

      reloadGames();
      setSectionStatus("games", "Upload complete");
      resetGamesForm();
    } catch (error) {
      console.error(error);
      setSectionStatus("games", `Error: ${error.message}`);
    }
  };

  const handlePlaceHolderSubmit = createSimpleSubmitHandler({
    section: "placeHolder",
    form: placeHolderForm,
    setter: setPlaceHolderForm,
    collection: "placeHolder",
    reload: reloadPlaceHolder,
  });

  const handleDelete = async (collection, item) => {
    if (!item?.id) return;
    if (!window.confirm("Delete this item?")) return;

    setSectionStatus(collection, "Deleting...");
    try {
      await deleteDoc(doc(db, collection, item.id));

      if (collection === "photography" && item.path) {
        try {
          await deleteFileFromGitHub(item.path);
        } catch (error) {
          setSectionStatus(
            "photography",
            `Firestore deleted; GitHub error: ${error.message}`
          );
          reloadPhotography();
          return;
        }
      }

      if (collection === "games" && item.path) {
        try {
          await deleteFileFromGitHub(item.path);
        } catch (error) {
          setSectionStatus("games", `Firestore deleted; GitHub error: ${error.message}`);
          reloadGames();
          return;
        }
      }

      if (collection === "photography") reloadPhotography();
      if (collection === "software") reloadSoftware();
      if (collection === "games") reloadGames();
      if (collection === "placeHolder") reloadPlaceHolder();

      setSectionStatus(collection, "Deleted");
    } catch (error) {
      console.error(error);
      setSectionStatus(collection, `Error: ${error.message}`);
    }
  };

  const photoClearDisabled =
    !photoForm.file &&
    photoForm.massFiles.length === 0 &&
    photoMassMeta.length === 0 &&
    !photoForm.name &&
    !photoForm.description &&
    !photoForm.dateCreated &&
    !photoForm.cameraModel &&
    !photoForm.location;

  const gamesClearDisabled =
    !gamesForm.file &&
    gamesForm.massFiles.length === 0 &&
    !gamesForm.name &&
    !gamesForm.url &&
    !gamesForm.description &&
    !gamesForm.dateCreated;

  const softwareClearDisabled =
    !softwareForm.name &&
    !softwareForm.url &&
    !softwareForm.description &&
    !softwareForm.dateCreated;

  const placeHolderClearDisabled =
    !placeHolderForm.name &&
    !placeHolderForm.url &&
    !placeHolderForm.description &&
    !placeHolderForm.dateCreated;

  let photoSubmitDisabled;
  if (photoForm.editItem) {
    photoSubmitDisabled =
      !photoEditSnapshot ||
      (photoForm.name === photoEditSnapshot.name &&
        photoForm.description === photoEditSnapshot.description &&
        photoForm.dateCreated === photoEditSnapshot.dateCreated &&
        photoForm.cameraModel === photoEditSnapshot.cameraModel &&
        photoForm.location === photoEditSnapshot.location &&
        !photoForm.file &&
        photoForm.massFiles.length === 0);
  } else if (photoUploadMode === "single") {
    photoSubmitDisabled = !photoForm.file;
  } else {
    photoSubmitDisabled = photoForm.massFiles.length === 0;
  }

  const gamesSubmitDisabled = gamesForm.editItem
    ? !gamesEditSnapshot || (
      gamesForm.name === gamesEditSnapshot.name &&
      gamesForm.url === gamesEditSnapshot.url &&
      gamesForm.description === gamesEditSnapshot.description &&
      gamesForm.dateCreated === gamesEditSnapshot.dateCreated &&
      !gamesForm.file &&
      gamesForm.massFiles.length === 0
    )
    : !gamesForm.file && gamesForm.massFiles.length === 0;

  const softwareSubmitDisabled = softwareForm.editItem
    ? !softwareForm.name?.trim() ||
      !softwareEditSnapshot ||
      (
        softwareForm.name === softwareEditSnapshot.name &&
        softwareForm.url === softwareEditSnapshot.url &&
        softwareForm.description === softwareEditSnapshot.description &&
        softwareForm.dateCreated === softwareEditSnapshot.dateCreated
      )
    : !softwareForm.name?.trim();
  const placeHolderSubmitDisabled = placeHolderForm.editItem
    ? !placeHolderForm.name?.trim() ||
      !placeHolderEditSnapshot ||
      (
        placeHolderForm.name === placeHolderEditSnapshot.name &&
        placeHolderForm.url === placeHolderEditSnapshot.url &&
        placeHolderForm.description === placeHolderEditSnapshot.description &&
        placeHolderForm.dateCreated === placeHolderEditSnapshot.dateCreated
      )
    : !placeHolderForm.name?.trim();

  const photoRevertDisabled =
    !photoForm.editItem ||
    !photoEditSnapshot ||
    (photoForm.name === photoEditSnapshot.name &&
      photoForm.description === photoEditSnapshot.description &&
      photoForm.dateCreated === photoEditSnapshot.dateCreated &&
      photoForm.cameraModel === photoEditSnapshot.cameraModel &&
      photoForm.location === photoEditSnapshot.location &&
      !photoForm.file &&
      photoForm.massFiles.length === 0);

  const gamesRevertDisabled =
    !gamesForm.editItem ||
    !gamesEditSnapshot ||
    (gamesForm.name === gamesEditSnapshot.name &&
      gamesForm.url === gamesEditSnapshot.url &&
      gamesForm.description === gamesEditSnapshot.description &&
      gamesForm.dateCreated === gamesEditSnapshot.dateCreated &&
      !gamesForm.file &&
      gamesForm.massFiles.length === 0);

  const softwareRevertDisabled =
    !softwareForm.editItem ||
    !softwareEditSnapshot ||
    (softwareForm.name === softwareEditSnapshot.name &&
      softwareForm.url === softwareEditSnapshot.url &&
      softwareForm.description === softwareEditSnapshot.description &&
      softwareForm.dateCreated === softwareEditSnapshot.dateCreated);

  const placeHolderRevertDisabled =
    !placeHolderForm.editItem ||
    !placeHolderEditSnapshot ||
    (placeHolderForm.name === placeHolderEditSnapshot.name &&
      placeHolderForm.url === placeHolderEditSnapshot.url &&
      placeHolderForm.description === placeHolderEditSnapshot.description &&
      placeHolderForm.dateCreated === placeHolderEditSnapshot.dateCreated);

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto text-white">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-4xl text-center w-full font-bold underline text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="bg-black/60 border border-white/20  p-6">
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 className="text-3xl font-semibold text-start">Photography</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePhotoModeChange("single")}
                disabled={photoForm.editItem || photoUploadMode === "single"}
                className={`app-btn app-btn-secondary ${
                  photoUploadMode === "single" ? "opacity-70" : ""
                }`}
              >
                Single
              </button>
              <button
                type="button"
                onClick={() => handlePhotoModeChange("multiple")}
                disabled={photoForm.editItem || photoUploadMode === "multiple"}
                className={`app-btn app-btn-secondary ${
                  photoUploadMode === "multiple" ? "opacity-70" : ""
                }`}
              >
                Multiple
              </button>
            </div>
          </div>

          <form onSubmit={handlePhotographySubmit} className="w-full space-y-4 mb-6">
            <div>
              <label className="block text-start text-sm font-medium mb-1" htmlFor="photo-file">
                Image file{photoUploadMode === "multiple" ? "s" : ""}
              </label>
              <input
                id="photo-file"
                type="file"
                accept="image/*"
                onChange={handlePhotoFileSelect}
                className="app-input w-full block"
                multiple={photoUploadMode === "multiple"}
                disabled={Boolean(photoForm.editItem)}
              />
            </div>

            {photoUploadMode === "single" && (
              <>
                <div>
                  <label className="block text-start text-sm font-medium mb-1" htmlFor="photo-name">
                    Name (optional)
                  </label>
                  <input
                    id="photo-name"
                    type="text"
                    value={photoForm.name}
                    onChange={(e) => setPhotoForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="app-input w-full"
                  />
                </div>

                <div>
                  <label
                    className="block text-start text-sm font-medium mb-1"
                    htmlFor="photo-date-created"
                  >
                    Date created (optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="photo-date-created"
                      type="date"
                      value={photoForm.dateCreated}
                      onChange={(e) => {
                        setPhotoForm((prev) => ({ ...prev, dateCreated: e.target.value }));
                        setPhotoDateSource(null);
                      }}
                      className="app-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setDateFromExif("created")}
                      className="app-btn app-btn-secondary"
                      disabled={photoDateSource === "created"}
                    >
                      Use created
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateFromExif("modified")}
                      className="app-btn app-btn-secondary"
                      disabled={photoDateSource === "modified"}
                    >
                      Use modified
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    className="block text-start text-sm font-medium mb-1"
                    htmlFor="photo-camera-model"
                  >
                    Camera model (optional)
                  </label>
                  <input
                    id="photo-camera-model"
                    type="text"
                    value={photoForm.cameraModel}
                    onChange={(e) =>
                      setPhotoForm((prev) => ({ ...prev, cameraModel: e.target.value }))
                    }
                    className="app-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-start text-sm font-medium mb-1" htmlFor="photo-location">
                    Location (optional)
                  </label>
                  <input
                    id="photo-location"
                    type="text"
                    value={photoForm.location}
                    onChange={(e) => setPhotoForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="app-input w-full"
                  />
                </div>

                <div>
                  <label
                    className="block text-start text-sm font-medium mb-1"
                    htmlFor="photo-description"
                  >
                    Description (optional)
                  </label>
                  <textarea
                    id="photo-description"
                    value={photoForm.description}
                    onChange={(e) =>
                      setPhotoForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="app-input w-full min-h-24"
                  />
                </div>
              </>
            )}

            {photoUploadMode === "multiple" && (
              <>
                <div>
                  <p className="block text-start text-sm font-medium mb-1">Date source for all files</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => applyPhotoBulkDateSource("created")}
                      disabled={photoBulkDateSource === "created"}
                      className="app-btn app-btn-secondary"
                    >
                      Created
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPhotoBulkDateSource("modified")}
                      disabled={photoBulkDateSource === "modified"}
                      className="app-btn app-btn-secondary"
                    >
                      Modified
                    </button>
                  </div>
                </div>

                {photoMassMeta.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photoMassMeta.map((meta) => {
                      const activeDate =
                        photoBulkDateSource === "modified"
                          ? meta.modifiedDate || meta.createdDate
                          : meta.createdDate || meta.modifiedDate;

                      return (
                        <div key={meta.previewUrl} className="relative group">
                          <img
                            src={meta.previewUrl}
                            alt={meta.name}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/75 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity p-2 text-start">
                            <p className="truncate">
                              <b>Name:</b> {meta.name}
                            </p>
                            <p className="truncate">
                              <b>Model:</b> {meta.cameraModel || "—"}
                            </p>
                            <p>
                              <b>
                                Date ({photoBulkDateSource === "modified" ? "modified" : "created"}
                                ):
                              </b>{" "}
                              {activeDate || "—"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2">
              {photoForm.editItem && (
                <button type="button" onClick={resetPhotoForm} className="app-btn app-btn-secondary">
                  Cancel
                </button>
              )}
              {photoForm.editItem && (
                <button
                  type="button"
                  onClick={revertPhotoForm}
                  className="app-btn app-btn-secondary"
                  disabled={photoRevertDisabled}
                >
                  Revert
                </button>
              )}
              <button
                type="button"
                onClick={clearPhotoForm}
                className="app-btn app-btn-secondary"
                disabled={photoClearDisabled}
              >
                Clear
              </button>
              <button
                type="submit"
                className="app-btn app-btn-primary"
                disabled={photoSubmitDisabled}
              >
                {photoForm.editItem ? "Save" : "Upload"}
              </button>
            </div>
          </form>

          <ItemList
            section="photography"
            items={photographyItems}
            loading={photographyLoading}
            onEdit={(item) =>
              {
                clearPhotoMassMeta();
                setPhotoUploadMode("single");
                const snapshot = {
                  name: item.name || "",
                  description: item.description || "",
                  dateCreated: item.dateCreated || "",
                  cameraModel: item.cameraModel || "",
                  location: item.location || "",
                };
                setPhotoEditSnapshot(snapshot);
                setPhotoForm((prev) => ({
                  ...prev,
                  editItem: item,
                  ...snapshot,
                }));
              }
            }
            onDelete={(item) => handleDelete("photography", item)}
          />

          {status.photography && (
            <p className="mt-3 text-sm text-green-300">{status.photography}</p>
          )}
          {photographyError && (
            <p className="mt-2 text-red-400">{photographyError.message}</p>
          )}
        </section>

        <section className="bg-black/60 border border-white/20  p-6">
          <h2 className="text-3xl font-semibold text-start mb-4">Software</h2>

          <GenericEntryForm
            section="software"
            isEditing={Boolean(softwareForm.editItem)}
            formValues={softwareForm}
            onSubmit={handleSoftwareSubmit}
            onChange={(field, value) =>
              setSoftwareForm((prev) => ({ ...prev, [field]: value }))
            }
            onCancelEdit={() => {
              resetSimpleForm(setSoftwareForm);
              setSoftwareEditSnapshot(null);
            }}
            onRevert={() => revertSimpleForm(setSoftwareForm, softwareEditSnapshot)}
            onClear={() => clearSimpleFormFields(setSoftwareForm)}
            submitDisabled={softwareSubmitDisabled}
            clearDisabled={softwareClearDisabled}
            revertDisabled={softwareRevertDisabled}
          />

          <ItemList
            section="software"
            items={softwareItems}
            loading={softwareLoading}
            onEdit={(item) =>
              {
                const snapshot = {
                  name: item.name || "",
                  url: item.url || "",
                  description: item.description || "",
                  dateCreated: item.dateCreated || "",
                };
                setSoftwareEditSnapshot(snapshot);
                setSoftwareForm({ editItem: item, ...snapshot });
              }
            }
            onDelete={(item) => handleDelete("software", item)}
          />

          {status.software && (
            <p className="mt-3 text-sm text-green-300">{status.software}</p>
          )}
          {softwareError && <p className="mt-2 text-red-400">{softwareError.message}</p>}
        </section>

        <section className="bg-black/60 border border-white/20  p-6">
          <h2 className="text-3xl text-start font-semibold mb-4">Games</h2>

            <GenericEntryForm
              section="games"
              isEditing={Boolean(gamesForm.editItem)}
              formValues={gamesForm}
              onSubmit={handleGamesSubmit}
              onChange={(field, value) =>
                setGamesForm((prev) => ({ ...prev, [field]: value }))
              }
              onCancelEdit={resetGamesForm}
              onRevert={revertGamesForm}
              onClear={clearGamesForm}
              onFileSelect={handleGamesFileSelect}
              onUseCreatedDate={() => setGamesDateFromExif("created")}
              onUseModifiedDate={() => setGamesDateFromExif("modified")}
              disableDescription={gamesForm.massFiles.length > 0}
              submitDisabled={gamesSubmitDisabled}
              clearDisabled={gamesClearDisabled}
              revertDisabled={gamesRevertDisabled}
            />

            <ItemList
              section="games"
              items={gamesItems}
              loading={gamesLoading}
              onEdit={(item) =>
                {
                  const snapshot = {
                    name: item.name || "",
                    url: item.url || "",
                    description: item.description || "",
                    dateCreated: item.dateCreated || "",
                  };
                  setGamesEditSnapshot(snapshot);
                  setGamesForm({
                    file: null,
                    massFiles: [],
                    editItem: item,
                    ...snapshot,
                  });
                }
              }
              onDelete={(item) => handleDelete("games", item)}
            />

            {status.games && <p className="mt-3 text-sm text-green-300">{status.games}</p>}
            {gamesError && <p className="mt-2 text-red-400">{gamesError.message}</p>}
        </section>

        <section className="bg-black/60 border border-white/20  p-6">
          <h2 className="text-3xl text-start font-semibold mb-4">Place Holder</h2>

          <GenericEntryForm
            section="placeHolder"
            isEditing={Boolean(placeHolderForm.editItem)}
            formValues={placeHolderForm}
            onSubmit={handlePlaceHolderSubmit}
            onChange={(field, value) =>
              setPlaceHolderForm((prev) => ({ ...prev, [field]: value }))
            }
            onCancelEdit={() => {
              resetSimpleForm(setPlaceHolderForm);
              setPlaceHolderEditSnapshot(null);
            }}
            onRevert={() => revertSimpleForm(setPlaceHolderForm, placeHolderEditSnapshot)}
            onClear={() => clearSimpleFormFields(setPlaceHolderForm)}
            submitDisabled={placeHolderSubmitDisabled}
            clearDisabled={placeHolderClearDisabled}
            revertDisabled={placeHolderRevertDisabled}
          />

          <ItemList
            section="placeHolder"
            items={placeHolderItems}
            loading={placeHolderLoading}
            onEdit={(item) =>
              {
                const snapshot = {
                  name: item.name || "",
                  url: item.url || "",
                  description: item.description || "",
                  dateCreated: item.dateCreated || "",
                };
                setPlaceHolderEditSnapshot(snapshot);
                setPlaceHolderForm({ editItem: item, ...snapshot });
              }
            }
            onDelete={(item) => handleDelete("placeHolder", item)}
          />

          {status.placeHolder && (
            <p className="mt-3 text-sm text-green-300">{status.placeHolder}</p>
          )}
          {placeHolderError && (
            <p className="mt-2 text-red-400">{placeHolderError.message}</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;