import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { ValidationError } from "@/lib/errors";

type UploadedImage = {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
};

function credentials() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ValidationError("Image uploads are not configured yet. Add the Cloudinary credentials to .env.local, then try again.");
  }

  return { cloudName, apiKey, apiSecret };
}

function client() {
  const { cloudName, apiKey, apiSecret } = credentials();
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudinary;
}

function validateImage(file: File, name: string) {
  if (!file.type.startsWith("image/")) throw new ValidationError(`Upload an image file for the ${name}.`);
  if (file.size > 5_000_000) throw new ValidationError(`Keep the ${name} under 5 MB.`);
}

/**
 * Uploads an organization logo through Cloudinary's signed server-side API.
 * The stable public ID means subsequent uploads replace the prior logo rather
 * than leaving orphaned branding images in the account.
 */
export async function uploadOrganizationLogo(file: File, organizationId: string): Promise<UploadedImage> {
  validateImage(file, "restaurant logo");
  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${bytes.toString("base64")}`;
  const result = await client().uploader.upload(dataUri, {
    asset_folder: `restaurant-os/organizations/${organizationId}/branding`,
    public_id: "logo",
    overwrite: true,
    invalidate: true,
    resource_type: "image",
    transformation: [{ width: 1200, height: 1200, crop: "limit" }, { fetch_format: "auto", quality: "auto" }],
  });

  return { publicId: result.public_id, secureUrl: result.secure_url, width: result.width, height: result.height };
}

/** Uploads a menu image into the owning restaurant's isolated media folder. */
export async function uploadMenuItemImage(file: File, organizationId: string, productId: string): Promise<UploadedImage> {
  validateImage(file, "menu item image");
  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${bytes.toString("base64")}`;
  const result = await client().uploader.upload(dataUri, {
    asset_folder: `restaurant-os/organizations/${organizationId}/menu`,
    public_id: productId,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
    transformation: [{ width: 1200, height: 900, crop: "limit" }, { fetch_format: "auto", quality: "auto" }],
  });
  return { publicId: result.public_id, secureUrl: result.secure_url, width: result.width, height: result.height };
}

/** A public delivery URL is derived server-side, keeping Cloudinary credentials private. */
export function cloudinaryImageUrl(publicId?: string | null): string | undefined {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !publicId) return undefined;
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${publicId}`;
}

export function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}
