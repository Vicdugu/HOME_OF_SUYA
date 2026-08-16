import path from "node:path";
import { mkdir, writeFile, readFile as fsReadFile } from "node:fs/promises";
import { put } from "@vercel/blob";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const LEGACY_PLACEHOLDER_PATH = "/images/meals/placeholder.jpg";
const DEFAULT_MEAL_PHOTO_NAME = "Logo.jpeg";
export const MAX_MEAL_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

const isVercelEnv = process.env.VERCEL_URL || process.env.VERCEL;
const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export function getMealPhotosDirectory() {
  return path.join(process.cwd(), "Photos");
}

export function isAllowedMealPhoto(fileName: string) {
  return ALLOWED_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

export function getMealPhotoPath(fileName: string) {
  const normalized = path.basename(fileName);
  return path.join(getMealPhotosDirectory(), normalized);
}

export async function ensureMealPhotosDirectory() {
  if (!isVercelEnv || !hasBlobToken) {
    await mkdir(getMealPhotosDirectory(), { recursive: true });
  }
}

export function getMealPhotoUrl(fileName: string) {
  return `/api/meal-photos?name=${encodeURIComponent(fileName)}`;
}

export function getDefaultMealPhotoUrl() {
  return getMealPhotoUrl(DEFAULT_MEAL_PHOTO_NAME);
}

export function createStoredMealPhotoName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, extension).toLowerCase();
  const normalizedBaseName = baseName
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${normalizedBaseName || "meal-photo"}-${suffix}${extension}`;
}

export async function saveMealPhoto(fileName: string, content: Uint8Array) {
  if (!isAllowedMealPhoto(fileName)) {
    throw new Error("Unsupported meal photo format");
  }

  const storedFileName = createStoredMealPhotoName(fileName);

  if (isVercelEnv && hasBlobToken) {
    // Use Vercel Blob Storage in production
    try {
      await put(`meal-photos/${storedFileName}`, Buffer.from(content), {
        contentType: getMealPhotoContentType(storedFileName),
        access: "public",
      });
    } catch (error) {
      // Fall back to local storage if blob upload fails
      await ensureMealPhotosDirectory();
      await writeFile(getMealPhotoPath(storedFileName), content);
    }
  } else {
    // Fall back to local filesystem in development
    await ensureMealPhotosDirectory();
    await writeFile(getMealPhotoPath(storedFileName), content);
  }

  return storedFileName;
}

export async function readMealPhoto(fileName: string): Promise<Uint8Array> {
  // Always try local filesystem first (works in dev and may work in prod if persisted)
  try {
    const buf = await fsReadFile(getMealPhotoPath(fileName));
    return new Uint8Array(buf);
  } catch {
    // If local file doesn't exist, try Vercel Blob Storage if configured
    if (isVercelEnv && hasBlobToken) {
      try {
        const response = await fetch(`https://blob.vercelusercontent.com/meal-photos/${fileName}`, {
          headers: {
            Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          },
        });
        if (!response.ok) throw new Error("Photo not found in blob storage");
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
      } catch (blobError) {
        throw new Error("Photo not found");
      }
    }
    throw new Error("Photo not found");
  }
}

export function normalizeMealImageUrl(imageUrl: string | null | undefined) {
  const normalized = String(imageUrl ?? "").trim();

  if (!normalized || normalized === LEGACY_PLACEHOLDER_PATH) {
    return getDefaultMealPhotoUrl();
  }

  return normalized;
}

export function normalizeBrandImageUrl(imageUrl: string | null | undefined) {
  const normalized = String(imageUrl ?? "").trim();

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("/") || /^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  const fileName = normalized.split(/[\\/]/).pop()?.trim() ?? "";

  if (fileName && isAllowedMealPhoto(fileName)) {
    return getMealPhotoUrl(fileName);
  }

  return null;
}

export function getMealPhotoContentType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}