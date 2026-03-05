import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import ExifReader from "exifreader";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
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

  const [sectionBusy, setSectionBusy] = useState({
    photography: false,
    software: false,
    games: false,
    placeHolder: false,
  });

  const sectionCancelRef = useRef({
    photography: false,
    software: false,
    games: false,
    placeHolder: false,
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

  const beginSectionWork = (section, message) => {
    sectionCancelRef.current[section] = false;
    setSectionBusy((prev) => ({ ...prev, [section]: true }));
    if (message) {
      setSectionStatus(section, message);
    }
  };

  const finishSectionWork = (section) => {
    sectionCancelRef.current[section] = false;
    setSectionBusy((prev) => ({ ...prev, [section]: false }));
  };

  const requestSectionCancel = (section) => {
    sectionCancelRef.current[section] = true;
    setSectionStatus(section, "Cancel requested...");
  };

  const throwIfCancelled = (section) => {
    if (!sectionCancelRef.current[section]) return;
    const error = new Error("Operation cancelled");
    error.name = "OperationCancelled";
    throw error;
  };

  const [photoEditSnapshot, setPhotoEditSnapshot] = useState(null);
  const [softwareEditSnapshot, setSoftwareEditSnapshot] = useState(null);
  const [gamesEditSnapshot, setGamesEditSnapshot] = useState(null);
  const [placeHolderEditSnapshot, setPlaceHolderEditSnapshot] = useState(null);
  const [photoDateSource, setPhotoDateSource] = useState("created");
  const [photoUploadMode, setPhotoUploadMode] = useState("single");
  const [photoMassMeta, setPhotoMassMeta] = useState([]);
  const [photoBulkDateSource, setPhotoBulkDateSource] = useState("created");

  const normalizeExifDate = (value) => {
    if (!value) return "";
    let normalizedValue = value;
    if (typeof value?.toDate === "function") {
      normalizedValue = value.toDate();
    } else if (value?.date) {
      normalizedValue = value.date;
    } else if (value?.value) {
      normalizedValue = value.value;
    }

    if (typeof normalizedValue === "string") {
      const cleaned = normalizedValue.replaceAll("\0", "").trim();
      normalizedValue = cleaned
        .replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3")
        .replace(" ", "T");
    }

    const date = new Date(normalizedValue);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  };

  const getReliableFileDate = (file) => {
    const normalized = normalizeExifDate(file?.lastModified);
    return normalized || new Date().toISOString().slice(0, 10);
  };

  const getTagValue = (tags, key) => {
    const tag = tags?.[key];
    if (!tag) return "";
    if (typeof tag === "string") return tag;
    if (typeof tag?.description === "string" && tag.description.trim()) {
      return tag.description;
    }
    if (Array.isArray(tag?.value)) {
      return tag.value[0] ?? "";
    }
    if (tag?.value) {
      return tag.value;
    }
    return "";
  };

  const parseMetadataSafe = async (file, contextLabel) => {
    try {
      return await ExifReader.load(file);
    } catch (error) {
      console.warn(`[photo] ExifReader.load failed (${contextLabel})`, {
        fileName: file?.name,
        fileType: file?.type,
        error,
      });
      return null;
    }
  };

  const getFirstExifDate = (metadata, keys) => {
    for (const key of keys) {
      const normalized = normalizeExifDate(getTagValue(metadata, key));
      if (normalized) return normalized;
    }
    return "";
  };

  const extractPhotoExifFields = (metadata, file) => {
    const createdDate = getFirstExifDate(metadata, [
      "DateTimeOriginal",
      "DateCreated",
      "SubSecCreateDate",
      "SubSecDateTimeOriginal",
      "DateTimeDigitized",
      "CreateDate",
      "MediaCreateDate",
      "TrackCreateDate",
      "CreationDate",
    ]) || normalizeExifDate(file?.lastModified);

    const modifiedDate =
      getFirstExifDate(metadata, [
        "ModifyDate",
        "DateModified",
        "SubSecModifyDate",
        "FileModifyDate",
        "MetadataDate",
        "MediaModifyDate",
        "TrackModifyDate",
      ]) || normalizeExifDate(file?.lastModified);

    const cameraModel =
      getTagValue(metadata, "Model") ||
      getTagValue(metadata, "LensModel") ||
      getTagValue(metadata, "CameraModelName") ||
      [getTagValue(metadata, "Make"), getTagValue(metadata, "Model")]
        .filter(Boolean)
        .join(" ") ||
      "";

    const latitude =
      getTagValue(metadata, "GPSLatitude") || getTagValue(metadata, "Latitude");
    const longitude =
      getTagValue(metadata, "GPSLongitude") || getTagValue(metadata, "Longitude");
    const location = latitude && longitude ? `${latitude},${longitude}` : "";

    return {
      createdDate,
      modifiedDate,
      cameraModel,
      location,
    };
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
    const fallbackDate = getReliableFileDate(file);
    const base = {
      name: file.name,
      createdDate: fallbackDate,
      modifiedDate: fallbackDate,
      dateCreated: fallbackDate,
      cameraModel: "",
      location: "",
      previewUrl: URL.createObjectURL(file),
    };

    try {
      const metadata = await parseMetadataSafe(file, "parsePhotoFileMeta");
      console.log("[photo] full metadata (multiple)", {
        fileName: file.name,
        metadata,
      });
      const extracted = extractPhotoExifFields(metadata, file);

      return {
        ...base,
        cameraModel: extracted.cameraModel,
        location: extracted.location,
        createdDate: fallbackDate,
        modifiedDate: fallbackDate,
        dateCreated: fallbackDate,
      };
    } catch {
      return base;
    }
  };

  const updatePhotoStagedMeta = (index, field, value) => {
    setPhotoMassMeta((prev) =>
      prev.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handlePhotoModeChange = (mode) => {
    if (photoForm.editItem) return;
    if (mode === photoUploadMode) return;

    clearPhotoMassMeta();
    setPhotoUploadMode(mode);
    setPhotoDateSource("created");
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
    setPhotoDateSource("created");
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
    setPhotoDateSource("created");
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
    setPhotoDateSource("created");
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
    console.log("[photo] handlePhotoFileSelect", {
      mode: photoUploadMode,
      fileCount: files.length,
      fileNames: files.map((file) => file.name),
    });

    if (files.length === 0) {
      clearPhotoMassMeta();
      setPhotoForm((prev) => ({ ...prev, file: null, massFiles: [] }));
      return;
    }

    if (photoUploadMode === "multiple") {
      clearPhotoMassMeta();
      const metadataList = await Promise.all(files.map((file) => parsePhotoFileMeta(file)));
      console.log("[photo] parsed multiple metadata", metadataList);
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
      const metadata = await parseMetadataSafe(singleFile, "handlePhotoFileSelect");
      console.log("[photo] full metadata (single)", {
        fileName: singleFile.name,
        metadata,
      });
      const extracted = extractPhotoExifFields(metadata, singleFile);
      console.log("[photo] parsed single metadata", {
        fileName: singleFile.name,
        extracted,
      });

      setPhotoForm((prev) => {
        const next = { ...prev };
        const { cameraModel, location } = extracted;
        next.dateCreated = getReliableFileDate(singleFile);
        if (cameraModel) {
          next.cameraModel = cameraModel;
        }
        if (location) {
          next.location = location;
        }
        return next;
      });
      console.log("[photo] applied autofill from upload", {
        preferredDateSource: photoDateSource,
        appliedDate: getReliableFileDate(singleFile),
        cameraModel: extracted.cameraModel,
      });
    } catch (error) {
      console.warn("Failed to read EXIF metadata", error);
    }
  };

  const setDateFromExif = async (kind) => {
    const currentFile = photoForm.file || photoForm.massFiles[0];
    console.log("[photo] setDateFromExif requested", {
      kind,
      hasCurrentFile: Boolean(currentFile),
      fileName: currentFile?.name,
    });
    if (!currentFile) return;

    const sourceDate = getReliableFileDate(currentFile);
    setPhotoForm((prev) => ({
      ...prev,
      dateCreated: sourceDate,
    }));
    setPhotoDateSource(kind);
    console.log("[photo] date applied from file metadata", {
      kind,
      fileName: currentFile.name,
      appliedDate: sourceDate,
    });
  };

  const applyPhotoBulkDateSource = (kind) => {
    setPhotoBulkDateSource(kind);
    setPhotoMassMeta((prev) =>
      prev.map((entry) => ({
        ...entry,
        dateCreated:
          kind === "modified"
            ? entry.modifiedDate || entry.createdDate || entry.dateCreated
            : entry.createdDate || entry.modifiedDate || entry.dateCreated,
      }))
    );
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
      const createdDate = getReliableFileDate(singleFile);
      if (!createdDate) return;
      setGamesForm((prev) => ({ ...prev, dateCreated: createdDate }));
    } catch (error) {
      console.warn("Failed to read EXIF metadata", error);
    }
  };

  const setGamesDateFromExif = async (kind) => {
    const currentFile = gamesForm.file || gamesForm.massFiles[0];
    if (!currentFile) return;

    const sourceDate = getReliableFileDate(currentFile);
    if (sourceDate) {
      setGamesForm((prev) => ({
        ...prev,
        dateCreated: sourceDate,
      }));
    }
  };

  const handlePhotographySubmit = async (e) => {
    e.preventDefault();
    if (sectionBusy.photography) return;
    if (!photoForm.file && photoForm.massFiles.length === 0 && !photoForm.editItem) {
      return;
    }

    beginSectionWork("photography", "Saving...");
    try {
      const runPhotoEdit = async () => {
        throwIfCancelled("photography");
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
            throwIfCancelled("photography");
            const meta = photoMassMeta[index] || {};
            const path = `photography/${Date.now()}_${file.name}`;
            const src = await uploadFileToGitHub(file, path);
            throwIfCancelled("photography");
            await addItem("photography", {
              name: meta.name || file.name,
              src,
              path,
              dateCreated:
                meta.dateCreated || meta.createdDate || meta.modifiedDate || new Date().toISOString(),
              cameraModel: meta.cameraModel || "",
              location: meta.location || "",
            });
          }
          return;
        }

        if (!photoForm.file) return;
        throwIfCancelled("photography");
        setSectionStatus("photography", "Uploading to GitHub...");
        const path = `photography/${Date.now()}_${photoForm.file.name}`;
        const src = await uploadFileToGitHub(photoForm.file, path);
        throwIfCancelled("photography");
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
      throwIfCancelled("photography");

      reloadPhotography();
      setSectionStatus("photography", "Upload complete");
      resetPhotoForm();
    } catch (error) {
      console.error(error);
      if (error.name === "OperationCancelled") {
        setSectionStatus("photography", "Cancelled");
      } else {
        setSectionStatus("photography", `Error: ${error.message}`);
      }
    } finally {
      finishSectionWork("photography");
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
      if (sectionBusy[section]) return;
      if (!form.name && !form.editItem) return;

      beginSectionWork(section, "Saving...");
      try {
        throwIfCancelled(section);
        const payload = { name: form.name };
        if (form.url) payload.url = form.url;
        if (form.description) payload.description = form.description;
        if (form.dateCreated) payload.dateCreated = form.dateCreated;

        if (form.editItem) {
          throwIfCancelled(section);
          await updateDoc(doc(db, collection, form.editItem.id), payload);
          setSectionStatus(section, "Update complete");
          if (collection === "software") setSoftwareEditSnapshot(null);
          if (collection === "placeHolder") setPlaceHolderEditSnapshot(null);
        } else {
          throwIfCancelled(section);
          await addItem(collection, payload);
          setSectionStatus(section, "Saved");
        }

        throwIfCancelled(section);
        reload();
        resetSimpleForm(setter);
      } catch (error) {
        console.error(error);
        if (error.name === "OperationCancelled") {
          setSectionStatus(section, "Cancelled");
        } else {
          setSectionStatus(section, `Error: ${error.message}`);
        }
      } finally {
        finishSectionWork(section);
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
    if (sectionBusy.games) return;
    if (!gamesForm.file && gamesForm.massFiles.length === 0 && !gamesForm.editItem) {
      return;
    }

    beginSectionWork("games", "Saving...");
    try {
      const runGamesEdit = async () => {
        throwIfCancelled("games");
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
            throwIfCancelled("games");
            const path = `games/${Date.now()}_${file.name}`;
            const src = await uploadFileToGitHub(file, path);
            throwIfCancelled("games");
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
        throwIfCancelled("games");
        setSectionStatus("games", "Uploading to GitHub...");
        const path = `games/${Date.now()}_${gamesForm.file.name}`;
        const src = await uploadFileToGitHub(gamesForm.file, path);
        throwIfCancelled("games");
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
      throwIfCancelled("games");

      reloadGames();
      setSectionStatus("games", "Upload complete");
      resetGamesForm();
    } catch (error) {
      console.error(error);
      if (error.name === "OperationCancelled") {
        setSectionStatus("games", "Cancelled");
      } else {
        setSectionStatus("games", `Error: ${error.message}`);
      }
    } finally {
      finishSectionWork("games");
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
    if (sectionBusy[collection]) return;
    if (!window.confirm("Delete this item?")) return;

    beginSectionWork(collection, "Deleting...");
    try {
      throwIfCancelled(collection);
      await deleteDoc(doc(db, collection, item.id));
      throwIfCancelled(collection);

      if (collection === "photography" && item.path) {
        try {
          throwIfCancelled(collection);
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
          throwIfCancelled(collection);
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
      if (error.name === "OperationCancelled") {
        setSectionStatus(collection, "Cancelled");
      } else {
        setSectionStatus(collection, `Error: ${error.message}`);
      }
    } finally {
      finishSectionWork(collection);
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
    <div className="px-4 py-8 text-white">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-4xl text-center w-full font-bold underline text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="relative bg-black/60 border border-white/20  p-6">
          {sectionBusy.photography && (
            <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center gap-3">
              <AiOutlineLoading3Quarters className="w-10 h-10 animate-spin text-white" />
              <p className="text-white">Working...</p>
              <button
                type="button"
                onClick={() => requestSectionCancel("photography")}
                className="app-btn app-btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
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
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[260px]">
                <label className="block text-start text-sm font-medium mb-1" htmlFor="photo-file">
                  Image file{photoUploadMode === "multiple" ? "s" : ""}
                </label>
                <input
                  id="photo-file"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileSelect}
                  className={`app-input w-full block ${photoUploadMode === "multiple" ? "h-10" : ""}`}
                  multiple={photoUploadMode === "multiple"}
                  disabled={Boolean(photoForm.editItem)}
                />
              </div>
              {photoUploadMode === "multiple" && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => applyPhotoBulkDateSource("created")}
                    disabled={photoBulkDateSource === "created"}
                    className="app-btn app-btn-secondary h-10 flex-1 sm:flex-none"
                  >
                    Created
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPhotoBulkDateSource("modified")}
                    disabled={photoBulkDateSource === "modified"}
                    className="app-btn app-btn-secondary h-10 flex-1 sm:flex-none"
                  >
                    Modified
                  </button>
                </div>
              )}
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
                        setPhotoDateSource("created");
                      }}
                      className="app-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setDateFromExif("created")}
                      className="app-btn app-btn-secondary"
                      disabled={!photoForm.file && photoForm.massFiles.length === 0}
                    >
                      Use created
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateFromExif("modified")}
                      className="app-btn app-btn-secondary"
                      disabled={!photoForm.file && photoForm.massFiles.length === 0}
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
                {photoMassMeta.length > 0 && (
                  <div className="space-y-3">
                    {photoMassMeta.map((meta, index) => (
                      <div
                        key={meta.previewUrl}
                        className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4 bg-white/10 p-3"
                      >
                        <img
                          src={meta.previewUrl}
                          alt={meta.name}
                          className="w-full h-32 object-cover"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-start">
                          <div>
                            <label
                              htmlFor={`photo-stage-name-${index}`}
                              className="block text-xs mb-1"
                            >
                              Name
                            </label>
                            <input
                              id={`photo-stage-name-${index}`}
                              type="text"
                              value={meta.name || ""}
                              onChange={(e) =>
                                updatePhotoStagedMeta(index, "name", e.target.value)
                              }
                              className="app-input w-full"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`photo-stage-date-${index}`}
                              className="block text-xs mb-1"
                            >
                              Date
                            </label>
                            <input
                              id={`photo-stage-date-${index}`}
                              type="date"
                              value={meta.dateCreated || ""}
                              onChange={(e) =>
                                updatePhotoStagedMeta(index, "dateCreated", e.target.value)
                              }
                              className="app-input w-full"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`photo-stage-camera-${index}`}
                              className="block text-xs mb-1"
                            >
                              Camera model
                            </label>
                            <input
                              id={`photo-stage-camera-${index}`}
                              type="text"
                              value={meta.cameraModel || ""}
                              onChange={(e) =>
                                updatePhotoStagedMeta(index, "cameraModel", e.target.value)
                              }
                              className="app-input w-full"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`photo-stage-location-${index}`}
                              className="block text-xs mb-1"
                            >
                              Location
                            </label>
                            <input
                              id={`photo-stage-location-${index}`}
                              type="text"
                              value={meta.location || ""}
                              onChange={(e) =>
                                updatePhotoStagedMeta(index, "location", e.target.value)
                              }
                              className="app-input w-full"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
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

        <section className="relative bg-black/60 border border-white/20  p-6">
          {sectionBusy.software && (
            <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center gap-3">
              <AiOutlineLoading3Quarters className="w-10 h-10 animate-spin text-white" />
              <p className="text-white">Working...</p>
              <button
                type="button"
                onClick={() => requestSectionCancel("software")}
                className="app-btn app-btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
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

        <section className="relative bg-black/60 border border-white/20  p-6">
          {sectionBusy.games && (
            <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center gap-3">
              <AiOutlineLoading3Quarters className="w-10 h-10 animate-spin text-white" />
              <p className="text-white">Working...</p>
              <button
                type="button"
                onClick={() => requestSectionCancel("games")}
                className="app-btn app-btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
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

        <section className="relative bg-black/60 border border-white/20  p-6">
          {sectionBusy.placeHolder && (
            <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center gap-3">
              <AiOutlineLoading3Quarters className="w-10 h-10 animate-spin text-white" />
              <p className="text-white">Working...</p>
              <button
                type="button"
                onClick={() => requestSectionCancel("placeHolder")}
                className="app-btn app-btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
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