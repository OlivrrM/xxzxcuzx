import { z } from 'zod';

export const photographySchema = z.object({
  name: z.string(),
  src: z.string().url(),
  path: z.string().optional(),
  dateCreated: z.string().optional(),
  description: z.string().optional(),
  cameraModel: z.string().optional(),
  location: z.string().optional(),
});

export const softwareSchema = z.object({
  name: z.string(),
  src: z.string().url().optional(),
  path: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  downloadLink: z.string().url().optional(),
  subtext1: z.string().optional(),
  subtext2: z.string().optional(),
  blurb: z.string().optional(),
  detailImages: z.array(z.string().url()).optional(),
  detailImagePaths: z.array(z.string()).optional(),
  priority: z.number().optional(),
});

export const billboardSchema = z.object({
  name: z.string(),
  src: z.string().url(),
  path: z.string().optional(),
  blurb: z.string().optional(),
  url: z.string().optional(),
  dateCreated: z.string().optional(),
});

export const gamesSchema = z.object({
  name: z.string(),
  src: z.string().url().optional(),
  path: z.string().optional(),
  gameType: z.string().optional(),
  borderColor: z.string().optional(),
  textColor: z.string().optional(),
  // `url` is used for embedded web games (iframe or direct URL)
  url: z.string().optional(),
  description: z.string().optional(),
  releasedStatus: z.string().optional(),
  updated: z.string().optional(),
  published: z.string().optional(),
  credits: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
      })
    )
    .optional(),
  hackPatchLink: z.string().optional(),
  detailImages: z.array(z.string().url()).optional(),
  detailImagePaths: z.array(z.string()).optional(),
  macLink: z.string().optional(),
  iosLink: z.string().optional(),
  androidLink: z.string().optional(),
  windowsLink: z.string().optional(),
  linuxLink: z.string().optional(),
  steamLink: z.string().optional(),
  romhackingLink: z.string().optional(),
});
