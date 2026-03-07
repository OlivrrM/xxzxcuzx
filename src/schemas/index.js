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
  subtext1: z.string().optional(),
  subtext2: z.string().optional(),
  blurb: z.string().optional(),
  detailImages: z.array(z.string().url()).optional(),
  detailImagePaths: z.array(z.string()).optional(),
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
});
