import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { ALLOWED_IMAGE_TYPES } from "@/constants/schemas";
import { env } from "@/lib/env";
import { HttpError } from "@/lib/middleware";

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const fileUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl };
}

export async function deleteS3Object(fileUrl: string): Promise<void> {
  const key = new URL(fileUrl).pathname.slice(1);
  await s3.send(new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }));
}

export async function deleteS3Objects(urls: string[]): Promise<void> {
  await Promise.all(urls.map((url) => deleteS3Object(url).catch(console.error)));
}

export function validateImageContentType(contentType: string): string {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType)) {
    throw new HttpError(400, "Unsupported image type");
  }
  return contentType.split("/")[1] ?? "jpg";
}
