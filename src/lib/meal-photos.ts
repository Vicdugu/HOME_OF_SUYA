import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const LEGACY_PLACEHOLDER_PATH = "/images/meals/placeholder.jpg";
const DEFAULT_MEAL_PHOTO_NAME = "Logo.jpeg";
export const MAX_MEAL_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

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
  await mkdir(getMealPhotosDirectory(), { recursive: true });
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

  await ensureMealPhotosDirectory();

  const storedFileName = createStoredMealPhotoName(fileName);
  await writeFile(getMealPhotoPath(storedFileName), content);
  return storedFileName;
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