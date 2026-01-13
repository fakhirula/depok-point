import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const requiredCloudinaryEnv = [
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  process.env.CLOUDINARY_API_KEY,
  process.env.CLOUDINARY_API_SECRET,
];

if (!requiredCloudinaryEnv.every(Boolean)) {
  throw new Error("Cloudinary environment variables are missing");
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "depok-point", resource_type: "image" }, (error, result) => {
            if (error || !result) {
              return reject(error || new Error("Upload gagal"));
            }
            resolve({ secure_url: result.secure_url, public_id: result.public_id });
          })
          .end(buffer);
      },
    );

    return NextResponse.json({ url: uploadResult.secure_url, publicId: uploadResult.public_id });
  } catch (error) {
    console.error("Cloudinary upload error", error);
    return NextResponse.json({ error: "Gagal mengunggah gambar" }, { status: 500 });
  }
}
