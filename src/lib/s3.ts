import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { ALLOWED_IMAGE_TYPES } from "@/constants/schemas";
import { env } from "@/lib/env";
import { HttpError } from "@/lib/middleware";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
  const fileUrl = `${env.R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, fileUrl };
}

export async function deleteObject(fileUrl: string): Promise<void> {
  const key = new URL(fileUrl).pathname.slice(1);
  await r2.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
}

export async function deleteObjects(urls: string[]): Promise<void> {
  await Promise.all(urls.map((url) => deleteObject(url).catch(console.error)));
}

export function validateImageContentType(contentType: string): string {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType)) {
    throw new HttpError(400, "Unsupported image type");
  }
  return contentType.split("/")[1] ?? "jpg";
}
