import path from "node:path";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";

const BRANDING_DIRECTORY = path.join(process.cwd(), "Branding");
const BRAND_LOGO_PREFIX = "site-logo";

export const MAX_BRAND_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

const ALLOWED_BRAND_LOGO_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".svg"]);

export function isAllowedBrandLogo(fileName: string) {
  return ALLOWED_BRAND_LOGO_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

export function getBrandingDirectory() {
  return BRANDING_DIRECTORY;
}

export function getBrandLogoUrl(version?: number | string) {
  if (version == null || version === "") {
    return "/api/branding/logo";
  }

  return `/api/branding/logo?v=${encodeURIComponent(String(version))}`;
}

export function normalizeBrandLogoUrl(imageUrl: string | null | undefined) {
  const normalized = String(imageUrl ?? "").trim();

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("/") || /^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  const fileName = normalized.split(/[\\/]/).pop()?.trim() ?? "";

  if (fileName && isAllowedBrandLogo(fileName)) {
    return getBrandLogoUrl();
  }

  return null;
}

export async function ensureBrandingDirectory() {
  await mkdir(BRANDING_DIRECTORY, { recursive: true });
}

export async function listStoredBrandLogos() {
  await ensureBrandingDirectory();

  const entries = await readdir(BRANDING_DIRECTORY, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.startsWith(`${BRAND_LOGO_PREFIX}.`) && isAllowedBrandLogo(entry.name))
    .map((entry) => entry.name);
}

export async function deleteStoredBrandLogos() {
  const files = await listStoredBrandLogos();
  await Promise.all(files.map((fileName) => rm(path.join(BRANDING_DIRECTORY, fileName), { force: true })));
}

export async function saveBrandLogo(fileName: string, content: Uint8Array) {
  const extension = path.extname(fileName).toLowerCase();

  if (!isAllowedBrandLogo(fileName)) {
    throw new Error("Unsupported logo format");
  }

  await ensureBrandingDirectory();
  await deleteStoredBrandLogos();

  const storedFileName = `${BRAND_LOGO_PREFIX}${extension}`;
  await writeFile(path.join(BRANDING_DIRECTORY, storedFileName), content);
  return storedFileName;
}

export async function readStoredBrandLogo() {
  const [fileName] = await listStoredBrandLogos();

  if (!fileName) {
    return null;
  }

  return {
    fileName,
    content: await readFile(path.join(BRANDING_DIRECTORY, fileName)),
  };
}

export function getBrandLogoContentType(fileName: string) {
  switch (path.extname(fileName).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}