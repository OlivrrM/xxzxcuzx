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
  dateCreated: z.string().optional(),
});

export const gamesSchema = softwareSchema.extend({
  url: z.string().optional(),
  detailImages: z.array(z.string().url()).optional(),
  detailImagePaths: z.array(z.string()).optional(),
  gameType: z.enum(["web games", "pc games", "hacks"]),
  releasedStatus: z.enum(["released", "in development", "on hold", "cancelled", "prototype"]).optional(),
  updated: z.string().optional(),
  published: z.string().optional(),
  credits: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
    })
  ).optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  macLink: z.string().url().optional(),
  iosLink: z.string().url().optional(),
  androidLink: z.string().url().optional(),
  windowsLink: z.string().url().optional(),
  linuxLink: z.string().url().optional(),
  steamLink: z.string().url().optional(),
});
