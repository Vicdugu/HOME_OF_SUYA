import path from "node:path";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

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

export function getMealPhotoUrl(fileName: string) {
  return `/api/meal-photos?name=${encodeURIComponent(fileName)}`;
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