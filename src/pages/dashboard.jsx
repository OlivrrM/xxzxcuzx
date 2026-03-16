import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import ExifReader from "exifreader";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useAuth } from "../contexts/AuthContext";
import useImages from "../hooks/useImages";
import { addItem } from "../utils/firestore";
import { deleteFileFromGitHub } from "../utils/github";
import { db } from "../firebase";
import GenericEntryForm from "../components/dashboard/GenericEntryForm";
import ItemList from "../components/dashboard/ItemList";
import {
  sectionConfigs,
  normalizeCredits,
  compressAndUploadFile,
  uploadDetailImages,
} from "./dashboardConfig";

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
    data: billboardItems,
    loading: billboardLoading,
    error: billboardError,
    reload: reloadBillboard,
  } = useImages("billboard");

  const [status, setStatus] = useState({
    photography: "",
    software: "",
    games: "",
    billboard: "",
  });

  const [sectionBusy, setSectionBusy] = useState({
    photography: false,
    software: false,
    games: false,
    billboard: false,
  });

  const sectionCancelRef = useRef({
    photography: false,
    software: false,
    games: false,
    billboard: false,
  });

  const [photoForm, setPhotoForm] = useState(sectionConfigs.photography.initialForm());
  const [softwareForm, setSoftwareForm] = useState(sectionConfigs.software.initialForm());
  const [gamesForm, setGamesForm] = useState(sectionConfigs.games.initialForm());

  const isValidHexColor = (value) => /^#[0-9A-Fa-f]{6}$/.test(value || "");

  const [billboardForm, setBillboardForm] = useState(sectionConfigs.billboard.initialForm());

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

  const getStatusClass = (message) => {
    if (!message) return "";
    if (/^(Error:|No file)/i.test(message)) return "text-red-400";
    return "text-green-300";
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
  const [billboardEditSnapshot, setBillboardEditSnapshot] = useState(null);
  const [photoDateSource, setPhotoDateSource] = useState("created");
  const [photoUploadMode, setPhotoUploadMode] = useState("single");
  const [photoMassMeta, setPhotoMassMeta] = useState([]);
  const [photoBulkDateSource, setPhotoBulkDateSource] = useState("created");
  const [photoTransferDate, setPhotoTransferDate] = useState("");

  const resetSimpleForm = (setter) => setter({ editItem: null, name: "", url: "", description: "", dateCreated: "" });

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
    return normalized || "00-00-0000";
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
    ]) || "00-00-0000";

    const modifiedDate =
      getFirstExifDate(metadata, [
        "ModifyDate",
        "DateTime",
        "DateModified",
        "SubSecModifyDate",
        "FileModifyDate",
        "MetadataDate",
        "MediaModifyDate",
        "TrackModifyDate",
      ]) || getReliableFileDate(file);

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
      const resolvedCreated = extracted.createdDate || "00-00-0000";
      const resolvedModified = extracted.modifiedDate || fallbackDate;

      return {
        ...base,
        cameraModel: extracted.cameraModel,
        location: extracted.location,
        createdDate: resolvedCreated,
        modifiedDate: resolvedModified,
        dateCreated:
          photoBulkDateSource === "modified"
            ? resolvedModified || resolvedCreated || "00-00-0000"
            : resolvedCreated || resolvedModified || "00-00-0000",
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
    setPhotoTransferDate("");
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
    setPhotoTransferDate("");
  };

  const resetSoftwareForm = () => {
    setSoftwareForm(sectionConfigs.software.initialForm());
  };

  const resetBillboardForm = () => {
    setBillboardForm(sectionConfigs.billboard.initialForm());
  };

  const resetGamesForm = () => {
    setGamesForm(sectionConfigs.games.initialForm());
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
    setPhotoTransferDate("");
  };

  const clearGamesForm = () => {
    setGamesForm((prev) => ({
      ...prev,
      file: null,
      massFiles: [],
      name: "",
      gameType: "",
      textColor: "",
      borderColor: "",
      macLink: "",
      iosLink: "",
      androidLink: "",
      windowsLink: "",
      linuxLink: "",
      steamLink: "",
      romhackingLink: "",
      releasedStatus: "",
      updated: "",
      published: "",
      credits: [],
      creditName: "",
      creditRole: "",
      detailFiles: [],
      detailImages: [],
      detailImagePaths: [],
      hackPatchLink: "",
      url: "",
      description: "",
    }));
  };

  const isPcOrHackGameType = (value) => value === "pc games" || value === "hacks";

  const uploadGamesDetailImages = (files) => uploadDetailImages(files, "games/details");

  const areCreditsEqual = (left, right) => {
    const normalizedLeft = normalizeCredits(left);
    const normalizedRight = normalizeCredits(right);
    if (normalizedLeft.length !== normalizedRight.length) return false;

    return normalizedLeft.every((credit, index) => {
      const other = normalizedRight[index];
      return credit.name === other.name && credit.role === other.role;
    });
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
    setPhotoTransferDate("");
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
        const { createdDate, modifiedDate, cameraModel, location } = extracted;
        next.dateCreated =
          photoDateSource === "modified"
            ? modifiedDate || createdDate || "00-00-0000"
            : createdDate || modifiedDate || "00-00-0000";
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
        appliedDate:
          photoDateSource === "modified"
            ? extracted.modifiedDate || extracted.createdDate || "00-00-0000"
            : extracted.createdDate || extracted.modifiedDate || "00-00-0000",
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

    try {
      const metadata = await parseMetadataSafe(currentFile, "setDateFromExif");
      
      console.log("[photo] full metadata for setDateFromExif ", metadata);
      
      const extracted = extractPhotoExifFields(metadata, currentFile);
      const sourceDate =
        kind === "created" ? extracted.createdDate : extracted.modifiedDate;
      const resolvedDate = sourceDate || "00-00-0000";

      setPhotoForm((prev) => ({
        ...prev,
        dateCreated: resolvedDate,
      }));
      setPhotoDateSource(kind);
      console.log("[photo] date applied from selected source", {
        kind,
        fileName: currentFile.name,
        appliedDate: resolvedDate,
      });
    } catch (error) {
      setPhotoForm((prev) => ({
        ...prev,
        dateCreated: "00-00-0000",
      }));
      setPhotoDateSource(kind);
      console.warn("[photo] failed applying selected source date; using fallback", {
        kind,
        fileName: currentFile.name,
        error,
      });
    }
  };

  const applyPhotoBulkDateSource = (kind) => {
    setPhotoBulkDateSource(kind);
    setPhotoMassMeta((prev) =>
      prev.map((entry) => ({
        ...entry,
        dateCreated:
          kind === "modified"
            ? entry.modifiedDate || entry.createdDate || entry.dateCreated || "00-00-0000"
            : entry.createdDate || entry.modifiedDate || entry.dateCreated || "00-00-0000",
      }))
    );
  };

  const transferPhotoBulkDate = () => {
    if (!photoTransferDate) return;

    setPhotoMassMeta((prev) =>
      prev.map((entry) => ({
        ...entry,
        dateCreated: photoTransferDate,
      }))
    );
    setPhotoTransferDate("");
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
      }));
      return;
    }

    const singleFile = files[0];
    setGamesForm((prev) => ({
      ...prev,
      file: singleFile,
      massFiles: [],
    }));
  };

  const handleSoftwareFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      setSoftwareForm((prev) => ({ ...prev, file: null, massFiles: [] }));
      return;
    }

    if (files.length > 1) {
      setSoftwareForm((prev) => ({ ...prev, file: null, massFiles: files }));
      return;
    }

    setSoftwareForm((prev) => ({ ...prev, file: files[0], massFiles: [] }));
  };

  const handleBillboardFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length === 1) {
      setBillboardForm((prev) => ({
        ...prev,
        file: files[0],
        massFiles: [],
      }));
    } else {
      setBillboardForm((prev) => ({
        ...prev,
        file: null,
        massFiles: files,
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
            const src = await compressAndUploadFile(file, path);
            throwIfCancelled("photography");
            await addItem("photography", {
              name: meta.name || file.name,
              src,
              path,
              dateCreated:
                meta.dateCreated || meta.createdDate || meta.modifiedDate || "00-00-0000",
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
        const src = await compressAndUploadFile(photoForm.file, path);
        throwIfCancelled("photography");
        await addItem("photography", {
          name: photoForm.name || photoForm.file.name,
          src,
          path,
          dateCreated: photoForm.dateCreated || "00-00-0000",
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
          if (collection === "billboard") setBillboardEditSnapshot(null);
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

  const handleSoftwareSubmit = async (e) => {
    e.preventDefault();
    if (sectionBusy.software) return;
    if (!softwareForm.file && (softwareForm.massFiles?.length ?? 0) === 0 && !softwareForm.editItem) {
      setSectionStatus("software", "No file selected — choose a file or use mass upload.");
      return;
    }

    beginSectionWork("software", "Saving...");
    try {
      const runSoftwareEdit = async () => {
        throwIfCancelled("software");
        const updates = { name: softwareForm.name };
        if (softwareForm.url) updates.url = softwareForm.url;
        if (softwareForm.description) updates.description = softwareForm.description;
        if (softwareForm.dateCreated) updates.dateCreated = softwareForm.dateCreated;
        if (softwareForm.subtext1) updates.subtext1 = softwareForm.subtext1;
        if (softwareForm.subtext2) updates.subtext2 = softwareForm.subtext2;
        if (softwareForm.blurb) updates.blurb = softwareForm.blurb;

        if ((softwareForm.detailFiles?.length ?? 0) > 0) {
          setSectionStatus("software", "Uploading additional images...");
          const uploadedDetails = await uploadGamesDetailImages(softwareForm.detailFiles);
          const existingImages = Array.isArray(softwareForm.detailImages) ? softwareForm.detailImages : [];
          const existingPaths = Array.isArray(softwareForm.detailImagePaths)
            ? softwareForm.detailImagePaths
            : [];

          updates.detailImages = [...existingImages, ...uploadedDetails.map((entry) => entry.src)];
          updates.detailImagePaths = [
            ...existingPaths,
            ...uploadedDetails.map((entry) => entry.path),
          ];
        }

        if (softwareForm.file) {
          setSectionStatus("software", "Uploading replacement image...");
          const replacementPath = `software/${Date.now()}_${softwareForm.file.name}`;
          const replacementSrc = await compressAndUploadFile(softwareForm.file, replacementPath);
          throwIfCancelled("software");
          updates.path = replacementPath;
          updates.src = replacementSrc;

          if (softwareForm.editItem?.path) {
            try {
              await deleteFileFromGitHub(softwareForm.editItem.path);
            } catch (error) {
              console.warn("Failed to delete old software image from GitHub", error);
            }
          }
        }

        await updateDoc(doc(db, "software", softwareForm.editItem.id), updates);
        reloadSoftware();
        setSectionStatus("software", "Update complete");
        resetSoftwareForm();
      };

      const runSoftwareUpload = async () => {
        if ((softwareForm.massFiles?.length ?? 0) > 0) {
          for (const file of (softwareForm.massFiles || [])) {
            throwIfCancelled("software");
            const path = `software/${Date.now()}_${file.name}`;
            const src = await compressAndUploadFile(file, path);
            throwIfCancelled("software");
            let uploadedDetailImages = [];
            if ((softwareForm.detailFiles?.length ?? 0) > 0) {
              setSectionStatus("software", "Uploading additional images...");
              uploadedDetailImages = await uploadGamesDetailImages(softwareForm.detailFiles);
              throwIfCancelled("software");
            }
            await addItem("software", {
              name: file.name,
              src,
              path,
              url: softwareForm.url,
              description: softwareForm.description,
              dateCreated: softwareForm.dateCreated,
              subtext1: softwareForm.subtext1,
              subtext2: softwareForm.subtext2,
              blurb: softwareForm.blurb,
              ...(uploadedDetailImages.length > 0
                ? {
                    detailImages: uploadedDetailImages.map((entry) => entry.src),
                    detailImagePaths: uploadedDetailImages.map((entry) => entry.path),
                  }
                : {}),
            });
          }
          return;
        }

        if (!softwareForm.file) {
          setSectionStatus("software", "No file selected for upload.");
          return;
        }
        throwIfCancelled("software");
        setSectionStatus("software", "Uploading to GitHub...");
        const path = `software/${Date.now()}_${softwareForm.file.name}`;
        const src = await compressAndUploadFile(softwareForm.file, path);
        throwIfCancelled("software");
        let uploadedDetailImages = [];
        if ((softwareForm.detailFiles?.length ?? 0) > 0) {
          setSectionStatus("software", "Uploading additional images...");
          uploadedDetailImages = await uploadGamesDetailImages(softwareForm.detailFiles);
          throwIfCancelled("software");
        }
        await addItem("software", {
          name: softwareForm.name || softwareForm.file.name,
          src,
          path,
          url: softwareForm.url,
          description: softwareForm.description,
          dateCreated: softwareForm.dateCreated,
          subtext1: softwareForm.subtext1,
          subtext2: softwareForm.subtext2,
          blurb: softwareForm.blurb,
          ...(uploadedDetailImages.length > 0
            ? {
                detailImages: uploadedDetailImages.map((entry) => entry.src),
                detailImagePaths: uploadedDetailImages.map((entry) => entry.path),
              }
            : {}),
        });
      };

      if (softwareForm.editItem) {
        await runSoftwareEdit();
        return;
      }

      await runSoftwareUpload();
      throwIfCancelled("software");

      reloadSoftware();
      setSectionStatus("software", "Upload complete");
      resetSoftwareForm();
    } catch (error) {
      console.error("Software submit error:", error);
      setSectionStatus("software", `Error: ${error.message}`);
    } finally {
      finishSectionWork("software");
    }
  };

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
        const updates = {
          ...sectionConfigs.games.buildPayload(gamesForm),
          ...(gamesForm.file && !gamesForm.name ? { name: gamesForm.file.name } : {}),
        };

        if (isPcOrHackGameType(gamesForm.gameType) && gamesForm.detailFiles.length > 0) {
          setSectionStatus("games", "Uploading additional images...");
          const uploadedDetails = await uploadGamesDetailImages(gamesForm.detailFiles);
          const existingImages = Array.isArray(gamesForm.detailImages) ? gamesForm.detailImages : [];
          const existingPaths = Array.isArray(gamesForm.detailImagePaths)
            ? gamesForm.detailImagePaths
            : [];

          updates.detailImages = [...existingImages, ...uploadedDetails.map((entry) => entry.src)];
          updates.detailImagePaths = [
            ...existingPaths,
            ...uploadedDetails.map((entry) => entry.path),
          ];
        }

        if (gamesForm.file) {
          setSectionStatus("games", "Uploading replacement image...");
          const replacementPath = `games/${Date.now()}_${gamesForm.file.name}`;
          const replacementSrc = await compressAndUploadFile(gamesForm.file, replacementPath);
          throwIfCancelled("games");
          updates.path = replacementPath;
          updates.src = replacementSrc;

          if (gamesForm.editItem?.path) {
            try {
              await deleteFileFromGitHub(gamesForm.editItem.path);
            } catch (error) {
              console.warn("Failed to delete old games image from GitHub", error);
            }
          }
        }

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
            const src = await compressAndUploadFile(file, path);
            throwIfCancelled("games");
            let uploadedDetailImages = [];
            if (isPcOrHackGameType(gamesForm.gameType) && gamesForm.detailFiles.length > 0) {
              setSectionStatus("games", "Uploading additional images...");
              uploadedDetailImages = await uploadGamesDetailImages(gamesForm.detailFiles);
              throwIfCancelled("games");
            }
            await addItem("games", {
              ...sectionConfigs.games.buildPayload(gamesForm),
              name: gamesForm.name || file.name,
              src,
              path,
              ...(uploadedDetailImages.length > 0
                ? sectionConfigs.games.mergeDetailImages(
                    gamesForm.detailImages,
                    gamesForm.detailImagePaths,
                    uploadedDetailImages
                  )
                : {}),
            });
          }
          return;
        }

        if (!gamesForm.file) return;
        throwIfCancelled("games");
        setSectionStatus("games", "Uploading to GitHub...");
        const path = `games/${Date.now()}_${gamesForm.file.name}`;
        const src = await compressAndUploadFile(gamesForm.file, path);
        throwIfCancelled("games");
        let uploadedDetailImages = [];
        if (isPcOrHackGameType(gamesForm.gameType) && gamesForm.detailFiles.length > 0) {
          setSectionStatus("games", "Uploading additional images...");
          uploadedDetailImages = await uploadGamesDetailImages(gamesForm.detailFiles);
          throwIfCancelled("games");
        }
        await addItem("games", {
          ...sectionConfigs.games.buildPayload(gamesForm),
          name: gamesForm.name || gamesForm.file.name,
          src,
          path,
          ...(uploadedDetailImages.length > 0
            ? sectionConfigs.games.mergeDetailImages(
                gamesForm.detailImages,
                gamesForm.detailImagePaths,
                uploadedDetailImages
              )
            : {}),
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

  const handleBillboardSubmit = async (e) => {
    e.preventDefault();
    if (sectionBusy.billboard) return;
    if (!billboardForm.file && billboardForm.massFiles.length === 0 && !billboardForm.editItem) {
      return;
    }

    beginSectionWork("billboard", "Saving...");
    try {
      const runBillboardEdit = async () => {
        throwIfCancelled("billboard");
        const updates = { name: billboardForm.name };
        if (billboardForm.blurb) updates.blurb = billboardForm.blurb;
        if (billboardForm.url) updates.url = billboardForm.url;
        if (billboardForm.dateCreated) updates.dateCreated = billboardForm.dateCreated;

        if (billboardForm.file) {
          setSectionStatus("billboard", "Uploading replacement image...");
          const replacementPath = `billboard/${Date.now()}_${billboardForm.file.name}`;
          const replacementSrc = await compressAndUploadFile(billboardForm.file, replacementPath);
          throwIfCancelled("billboard");
          updates.path = replacementPath;
          updates.src = replacementSrc;

          if (billboardForm.editItem?.path) {
            try {
              await deleteFileFromGitHub(billboardForm.editItem.path);
            } catch (error) {
              console.warn("Failed to delete old billboard image from GitHub", error);
            }
          }
        }

        await updateDoc(doc(db, "billboard", billboardForm.editItem.id), updates);
        reloadBillboard();
        setSectionStatus("billboard", "Update complete");
        resetBillboardForm();
      };

      const runBillboardUpload = async () => {
        if (billboardForm.massFiles.length > 0) {
          for (const file of billboardForm.massFiles) {
            throwIfCancelled("billboard");
            const path = `billboard/${Date.now()}_${file.name}`;
            const src = await compressAndUploadFile(file, path);
            throwIfCancelled("billboard");
            await addItem("billboard", {
              name: file.name,
              src,
              path,
              blurb: billboardForm.blurb,
              url: billboardForm.url,
              dateCreated: billboardForm.dateCreated,
            });
          }
          return;
        }

        if (!billboardForm.file) return;
        throwIfCancelled("billboard");
        setSectionStatus("billboard", "Uploading to GitHub...");
        const path = `billboard/${Date.now()}_${billboardForm.file.name}`;
        const src = await compressAndUploadFile(billboardForm.file, path);
        throwIfCancelled("billboard");
        await addItem("billboard", {
          name: billboardForm.name || billboardForm.file.name,
          src,
          path,
          blurb: billboardForm.blurb,
          url: billboardForm.url,
          dateCreated: billboardForm.dateCreated,
        });
      };

      if (billboardForm.editItem) {
        await runBillboardEdit();
        return;
      }

      await runBillboardUpload();
      throwIfCancelled("billboard");

      reloadBillboard();
      setSectionStatus("billboard", "Upload complete");
      resetBillboardForm();
    } catch (error) {
      console.error("Billboard submit error:", error);
      setSectionStatus("billboard", `Error: ${error.message}`);
    } finally {
      finishSectionWork("billboard");
    }
  };

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

          if (Array.isArray(item.detailImagePaths) && item.detailImagePaths.length > 0) {
            for (const detailPath of item.detailImagePaths) {
              try {
                await deleteFileFromGitHub(detailPath);
              } catch (detailError) {
                console.warn("Failed to delete games detail image from GitHub", detailError);
              }
            }
          }
        } catch (error) {
          setSectionStatus("games", `Firestore deleted; GitHub error: ${error.message}`);
          reloadGames();
          return;
        }
      }

      if (collection === "photography") reloadPhotography();
      if (collection === "software") reloadSoftware();
      if (collection === "games") reloadGames();
      if (collection === "billboard") reloadBillboard();

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
    !gamesForm.gameType &&
    !gamesForm.textColor &&
    !gamesForm.borderColor &&
    !gamesForm.macLink &&
    !gamesForm.iosLink &&
    !gamesForm.androidLink &&
    !gamesForm.windowsLink &&
    !gamesForm.linuxLink &&
    !gamesForm.steamLink &&
    !gamesForm.romhackingLink &&
    !gamesForm.releasedStatus &&
    !gamesForm.updated &&
    !gamesForm.published &&
    normalizeCredits(gamesForm.credits).length === 0 &&
    !gamesForm.creditName &&
    !gamesForm.creditRole &&
    gamesForm.detailFiles.length === 0 &&
    !gamesForm.hackPatchLink &&
    !gamesForm.url &&
    !gamesForm.description;

  const softwareClearDisabled =
    !softwareForm.name &&
    !softwareForm.url &&
    !softwareForm.description &&
    !softwareForm.dateCreated;

  const billboardClearDisabled =
    !billboardForm.file &&
    billboardForm.massFiles.length === 0 &&
    !billboardForm.name &&
    !billboardForm.url;

  let photoSubmitDisabled;
  if (photoForm.editItem) {
    photoSubmitDisabled =
      !photoForm.name?.trim() ||
      !photoEditSnapshot ||
      (photoForm.name === photoEditSnapshot.name &&
        photoForm.description === photoEditSnapshot.description &&
        photoForm.dateCreated === photoEditSnapshot.dateCreated &&
        photoForm.cameraModel === photoEditSnapshot.cameraModel &&
        photoForm.location === photoEditSnapshot.location &&
        !photoForm.file &&
        photoForm.massFiles.length === 0);
  } else if (photoUploadMode === "single") {
    photoSubmitDisabled = !photoForm.file || !photoForm.name?.trim();
  } else {
    photoSubmitDisabled =
      photoForm.massFiles.length === 0 ||
      photoMassMeta.some((entry) => !entry.name?.trim());
  }

  const gamesSubmitDisabled = gamesForm.editItem
    ?
      !gamesForm.name?.trim() ||
      !gamesForm.gameType ||
      !isValidHexColor(gamesForm.textColor) ||
      !isValidHexColor(gamesForm.borderColor) ||
      !gamesEditSnapshot ||
      (
        gamesForm.name === gamesEditSnapshot.name &&
        gamesForm.gameType === gamesEditSnapshot.gameType &&
        gamesForm.textColor === gamesEditSnapshot.textColor &&
        gamesForm.borderColor === gamesEditSnapshot.borderColor &&
        gamesForm.macLink === gamesEditSnapshot.macLink &&
        gamesForm.iosLink === gamesEditSnapshot.iosLink &&
        gamesForm.androidLink === gamesEditSnapshot.androidLink &&
        gamesForm.windowsLink === gamesEditSnapshot.windowsLink &&
        gamesForm.linuxLink === gamesEditSnapshot.linuxLink &&
        gamesForm.steamLink === gamesEditSnapshot.steamLink &&
        gamesForm.romhackingLink === gamesEditSnapshot.romhackingLink &&
        gamesForm.releasedStatus === gamesEditSnapshot.releasedStatus &&
        gamesForm.updated === gamesEditSnapshot.updated &&
        gamesForm.published === gamesEditSnapshot.published &&
        areCreditsEqual(gamesForm.credits, gamesEditSnapshot.credits) &&
        !gamesForm.creditName &&
        !gamesForm.creditRole &&
        gamesForm.detailFiles.length === 0 &&
        gamesForm.hackPatchLink === gamesEditSnapshot.hackPatchLink &&
        gamesForm.url === gamesEditSnapshot.url &&
        gamesForm.description === gamesEditSnapshot.description &&
        !gamesForm.file &&
        gamesForm.massFiles.length === 0
      )
    :
      (!gamesForm.file && gamesForm.massFiles.length === 0) ||
      !gamesForm.name?.trim() ||
      !gamesForm.gameType ||
      !isValidHexColor(gamesForm.textColor) ||
      !isValidHexColor(gamesForm.borderColor);

  const softwareSubmitDisabled = softwareForm.editItem
    ? !softwareForm.name?.trim() ||
      !softwareEditSnapshot ||
      (
        softwareForm.name === softwareEditSnapshot.name &&
        softwareForm.url === softwareEditSnapshot.url &&
        softwareForm.downloadLink === softwareEditSnapshot.downloadLink &&
        softwareForm.description === softwareEditSnapshot.description &&
        softwareForm.dateCreated === softwareEditSnapshot.dateCreated
      )
    : !softwareForm.name?.trim();
  const billboardSubmitDisabled = billboardForm.editItem
    ? !billboardForm.name?.trim() ||
      !billboardEditSnapshot ||
      (
        billboardForm.name === billboardEditSnapshot.name &&
        billboardForm.blurb === billboardEditSnapshot.blurb &&
        billboardForm.url === billboardEditSnapshot.url &&
        billboardForm.dateCreated === billboardEditSnapshot.dateCreated &&
        !billboardForm.file &&
        billboardForm.massFiles.length === 0
      )
    : (!billboardForm.file && billboardForm.massFiles.length === 0) ||
      !billboardForm.name?.trim();

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
      gamesForm.gameType === gamesEditSnapshot.gameType &&
      gamesForm.textColor === gamesEditSnapshot.textColor &&
      gamesForm.borderColor === gamesEditSnapshot.borderColor &&
      gamesForm.macLink === gamesEditSnapshot.macLink &&
      gamesForm.iosLink === gamesEditSnapshot.iosLink &&
      gamesForm.androidLink === gamesEditSnapshot.androidLink &&
      gamesForm.windowsLink === gamesEditSnapshot.windowsLink &&
      gamesForm.linuxLink === gamesEditSnapshot.linuxLink &&
      gamesForm.steamLink === gamesEditSnapshot.steamLink &&
      gamesForm.romhackingLink === gamesEditSnapshot.romhackingLink &&
      gamesForm.releasedStatus === gamesEditSnapshot.releasedStatus &&
      gamesForm.updated === gamesEditSnapshot.updated &&
      gamesForm.published === gamesEditSnapshot.published &&
      areCreditsEqual(gamesForm.credits, gamesEditSnapshot.credits) &&
      !gamesForm.creditName &&
      !gamesForm.creditRole &&
      gamesForm.detailFiles.length === 0 &&
      gamesForm.hackPatchLink === gamesEditSnapshot.hackPatchLink &&
      gamesForm.url === gamesEditSnapshot.url &&
      gamesForm.description === gamesEditSnapshot.description &&
      !gamesForm.file &&
      gamesForm.massFiles.length === 0);

  const softwareRevertDisabled =
    !softwareForm.editItem ||
    !softwareEditSnapshot ||
    (softwareForm.name === softwareEditSnapshot.name &&
      softwareForm.url === softwareEditSnapshot.url &&
      softwareForm.description === softwareEditSnapshot.description &&
      softwareForm.dateCreated === softwareEditSnapshot.dateCreated);

  const billboardRevertDisabled =
    !billboardForm.editItem ||
    !billboardEditSnapshot ||
    (billboardForm.name === billboardEditSnapshot.name &&
      billboardForm.blurb === billboardEditSnapshot.blurb &&
      billboardForm.url === billboardEditSnapshot.url &&
      billboardForm.dateCreated === billboardEditSnapshot.dateCreated &&
      !billboardForm.file &&
      billboardForm.massFiles.length === 0);

  const dashboardLoading =
    photographyLoading || softwareLoading || gamesLoading || billboardLoading;

  if (dashboardLoading) {
    return (
      <div className="px-4 py-8 text-white flex flex-col flex-1 w-full">
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <AiOutlineLoading3Quarters className="w-12 h-12 animate-spin text-white" />
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 text-white">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-4xl text-center w-full font-bold underline text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="relative order-1 bg-black/60 border border-white/20 p-6 h-full flex flex-col min-h-0">
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

          <form onSubmit={handlePhotographySubmit} className="w-full space-y-4 mb-6 shrink-0">
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
                    onClick={() => applyPhotoBulkDateSource("modified")}
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
                    Name
                  </label>
                  <input
                    id="photo-name"
                    type="text"
                    value={photoForm.name}
                    onChange={(e) => setPhotoForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="app-input w-full"
                    required
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
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <label
                      className="block text-start text-sm font-medium mb-1"
                      htmlFor="photo-transfer-date"
                    >
                      Bulk date
                    </label>
                    <input
                      id="photo-transfer-date"
                      type="date"
                      value={photoTransferDate}
                      onChange={(e) => setPhotoTransferDate(e.target.value)}
                      className="app-input w-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={transferPhotoBulkDate}
                    className="app-btn app-btn-secondary h-10"
                    disabled={!photoTransferDate || photoMassMeta.length === 0}
                  >
                    Transfer
                  </button>
                </div>

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
            containerClassName="flex flex-col flex-1 min-h-0"
            mediaGridClassName="max-h-none flex-1 min-h-0"
          />

          {status.photography && (
            <p className="mt-3 text-sm text-green-300">{status.photography}</p>
          )}
          {photographyError && (
            <p className="mt-2 text-red-400">{photographyError.message}</p>
          )}
        </section>

        <section className="relative order-3 bg-black/60 border border-white/20  p-6">
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
              resetSoftwareForm();
              setSoftwareEditSnapshot(null);
            }}
            onRevert={() => revertSimpleForm(setSoftwareForm, softwareEditSnapshot)}
            onClear={() => clearSimpleFormFields(setSoftwareForm)}
            onFileSelect={handleSoftwareFileSelect}
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
                  downloadLink: item.downloadLink || "",
                  description: item.description || "",
                  dateCreated: item.dateCreated || "",
                  subtext1: item.subtext1 || "",
                  subtext2: item.subtext2 || "",
                  blurb: item.blurb || "",
                  detailImages: item.detailImages || [],
                  detailImagePaths: item.detailImagePaths || [],
                };
                setSoftwareEditSnapshot(snapshot);
                setSoftwareForm((prev) => ({ ...prev, editItem: item, file: null, massFiles: [], ...snapshot }));
              }
            }
            onDelete={(item) => handleDelete("software", item)}
          />

          {status.software && (
            <p className={`mt-3 text-sm ${getStatusClass(status.software)}`}>
              {status.software}
            </p>
          )}
          {softwareError && <p className="mt-2 text-red-400">{softwareError.message}</p>}
        </section>

        <section className="relative order-2 bg-black/60 border border-white/20 p-6 h-full flex flex-col min-h-0">
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
                    gameType: item.gameType || "",
                    textColor: item.textColor || "",
                    borderColor: item.borderColor || "",
                    macLink: item.macLink || "",
                    iosLink: item.iosLink || "",
                    androidLink: item.androidLink || "",
                    windowsLink: item.windowsLink || "",
                    linuxLink: item.linuxLink || "",
                    steamLink: item.steamLink || "",
                    romhackingLink: item.romhackingLink || "",
                    releasedStatus: item.releasedStatus || "",
                    updated: item.updated || "",
                    published: item.published || "",
                    credits: normalizeCredits(item.credits),
                    creditName: "",
                    creditRole: "",
                    detailFiles: [],
                    detailImages: Array.isArray(item.detailImages) ? item.detailImages : [],
                    detailImagePaths: Array.isArray(item.detailImagePaths)
                      ? item.detailImagePaths
                      : [],
                    hackPatchLink: item.hackPatchLink || "",
                    url: item.url || "",
                    description: item.description || "",
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
              mediaGridClassName="max-h-[200px]"
            />

            {status.games && <p className="mt-3 text-sm text-green-300">{status.games}</p>}
            {gamesError && <p className="mt-2 text-red-400">{gamesError.message}</p>}
        </section>

        <section className="relative order-4 bg-black/60 border border-white/20  p-6">
          {sectionBusy.billboard && (
            <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center gap-3">
              <AiOutlineLoading3Quarters className="w-10 h-10 animate-spin text-white" />
              <p className="text-white">Working...</p>
              <button
                type="button"
                onClick={() => requestSectionCancel("billboard")}
                className="app-btn app-btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
          <h2 className="text-3xl text-start font-semibold mb-4">Billboard</h2>

          <GenericEntryForm
            section="billboard"
            isEditing={Boolean(billboardForm.editItem)}
            formValues={billboardForm}
            onSubmit={handleBillboardSubmit}
            onChange={(field, value) =>
              setBillboardForm((prev) => ({ ...prev, [field]: value }))
            }
            onFileSelect={handleBillboardFileSelect}
            onCancelEdit={() => {
              resetBillboardForm();
              setBillboardEditSnapshot(null);
            }}
            onRevert={() => revertSimpleForm(setBillboardForm, billboardEditSnapshot)}
            onClear={() => clearSimpleFormFields(setBillboardForm)}
            submitDisabled={billboardSubmitDisabled}
            clearDisabled={billboardClearDisabled}
            revertDisabled={billboardRevertDisabled}
          />

          <ItemList
            section="billboard"
            items={billboardItems}
            loading={billboardLoading}
            onEdit={(item) =>
              {
                const snapshot = {
                  name: item.name || "",
                  blurb: item.blurb || "",
                  url: item.url || "",
                  dateCreated: item.dateCreated || "",
                };
                setBillboardEditSnapshot(snapshot);
                setBillboardForm(prev => ({ ...prev, editItem: item, ...snapshot }));
              }
            }
            onDelete={(item) => handleDelete("billboard", item)}
          />

          {status.billboard && (
            <p className="mt-3 text-sm text-green-300">{status.billboard}</p>
          )}
          {billboardError && (
            <p className="mt-2 text-red-400">{billboardError.message}</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;