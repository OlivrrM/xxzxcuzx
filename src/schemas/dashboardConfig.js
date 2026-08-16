import imageCompression from "browser-image-compression";
import { uploadFileToGitHub } from "../utils/github";
import { gamesSchema, softwareSchema, photographySchema, billboardSchema } from ".";

// Utilities
const normalizeString = (value) => String(value || "").trim();

export const compressAndUploadFile = async (file, path) => {
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
    const compressedFile = await imageCompression(file, options);
    return await uploadFileToGitHub(compressedFile, path);
};

export const uploadDetailImages = async (files, prefix = "games/details") => {
    const uploaded = [];
    for (const [index, file] of files.entries()) {
        const path = `${prefix}/${Date.now()}_${index}_${file.name}`;
        const src = await compressAndUploadFile(file, path);
        uploaded.push({ src, path });
    }
    return uploaded;
};

const isHexColor = (value) => /^#[0-9A-Fa-f]{6}$/.test(value || "");

const mergeDetailImages = (existingImages, existingPaths, uploadedEntries) => {
    const existingImagesArray = Array.isArray(existingImages) ? existingImages : [];
    const existingPathsArray = Array.isArray(existingPaths) ? existingPaths : [];
    const uploadedImages = Array.isArray(uploadedEntries)
        ? uploadedEntries.map((entry) => entry.src)
        : [];
    const uploadedPaths = Array.isArray(uploadedEntries)
        ? uploadedEntries.map((entry) => entry.path)
        : [];

    return {
        detailImages: [...existingImagesArray, ...uploadedImages],
        detailImagePaths: [...existingPathsArray, ...uploadedPaths],
    };
};

export const normalizeCredits = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((entry) => ({
                name: normalizeString(entry?.name),
                role: normalizeString(entry?.role),
            }))
            .filter((entry) => entry.name && entry.role);
    }

    const legacyCredit = normalizeString(value);
    return legacyCredit ? [{ name: legacyCredit, role: "Credit" }] : [];
};

export const sectionConfigs = {
    photography: {
        collection: "photography",
        schema: photographySchema,
        initialForm: () => ({
            file: null,
            massFiles: [],
            editItem: null,
            name: "",
            description: "",
            dateCreated: "",
            cameraModel: "",
            location: "",
        }),
        buildPayload: (form) => ({
            name: normalizeString(form.name),
            description: normalizeString(form.description),
            dateCreated: normalizeString(form.dateCreated),
            cameraModel: normalizeString(form.cameraModel),
            location: normalizeString(form.location),
        }),
        validateUrl: false,
    },

    software: {
        collection: "software",
        schema: softwareSchema,
        initialForm: () => ({
            file: null,
            massFiles: [],
            editItem: null,
            name: "",
            url: "",
            downloadLink: "",
            dateCreated: "",
            subtext1: "",
            subtext2: "",
            blurb: "",
            detailFiles: [],
            detailImages: [],
            detailImagePaths: [],
        }),
        buildPayload: (form) => ({
            name: normalizeString(form.name),
            url: normalizeString(form.url),
            downloadLink: normalizeString(form.downloadLink),
            dateCreated: normalizeString(form.dateCreated),
            subtext1: normalizeString(form.subtext1),
            subtext2: normalizeString(form.subtext2),
            blurb: normalizeString(form.blurb),
        }),
        mergeDetailImages,
        validateUrl: true,
    },

    games: {
        collection: "games",
        schema: gamesSchema,
        initialForm: () => ({
            file: null,
            backgroundImageFile: null,
            backGroundImageFile: "",
            massFiles: [],
            editItem: null,
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
            githubLink: "",
            url: "",
            youtubeUrl: "",
            description: "",
        }),
        buildPayload: (form) => {
            const payload = {
                name: normalizeString(form.name),
                gameType: normalizeString(form.gameType),
                borderColor: isHexColor(form.borderColor) ? form.borderColor : undefined,
                textColor: isHexColor(form.textColor) ? form.textColor : undefined,
                url: normalizeString(form.url),
                youtubeUrl: normalizeString(form.youtubeUrl),
                description: normalizeString(form.description),
                releasedStatus: normalizeString(form.releasedStatus),
                updated: normalizeString(form.updated),
                published: normalizeString(form.published),
                hackPatchLink: normalizeString(form.hackPatchLink),
                githubLink: normalizeString(form.githubLink),
                credits: normalizeCredits(form.credits),
                macLink: normalizeString(form.macLink),
                iosLink: normalizeString(form.iosLink),
                androidLink: normalizeString(form.androidLink),
                windowsLink: normalizeString(form.windowsLink),
                linuxLink: normalizeString(form.linuxLink),
                steamLink: normalizeString(form.steamLink),
                romhackingLink: normalizeString(form.romhackingLink),
            };

            // Remove empty strings from payload so Zod schema doesn't strip them
            return Object.fromEntries(
                Object.entries(payload).filter(([_, value]) => {
                    if (Array.isArray(value)) return value.length > 0;
                    return value !== "" && value !== undefined;
                })
            );
        },
        mergeDetailImages,
        validateUrl: false,
    },

    billboard: {
        collection: "billboard",
        schema: billboardSchema,
        initialForm: () => ({
            file: null,
            massFiles: [],
            editItem: null,
            name: "",
            blurb: "",
            url: "",
            dateCreated: "",
        }),
        buildPayload: (form) => ({
            name: normalizeString(form.name),
            blurb: normalizeString(form.blurb),
            url: normalizeString(form.url),
            dateCreated: normalizeString(form.dateCreated),
        }),
        validateUrl: false,
    },
};
