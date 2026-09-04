import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

// extension (lowercase, no dot) -> SourceFile.fileType vocabulary
const EXT_TO_TYPE: Record<string, string> = {
  pdf: "PDF",
  png: "IMAGE",
  jpg: "IMAGE",
  jpeg: "IMAGE",
  webp: "IMAGE",
  gif: "IMAGE",
  heic: "IMAGE",
  doc: "DOCX",
  docx: "DOCX",
  ppt: "PPTX",
  pptx: "PPTX",
  zip: "OTHER",
};

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError(400, "Attach a file under the 'file' field");
    }
    if (file.size === 0) return jsonError(400, "The file is empty");
    if (file.size > MAX_BYTES) {
      return jsonError(400, "Files are limited to 25 MB each");
    }

    const originalName = file.name || "upload";
    const ext = originalName.includes(".")
      ? originalName.split(".").pop()!.toLowerCase()
      : "";
    const fileType = EXT_TO_TYPE[ext];
    if (!fileType) {
      return jsonError(
        400,
        "Unsupported file type — upload a PDF, image, DOCX, PPTX or ZIP"
      );
    }

    const storedName = `${randomUUID().replace(/-/g, "")}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(
      path.join(uploadsDir, storedName),
      Buffer.from(await file.arrayBuffer())
    );

    return NextResponse.json(
      {
        fileName: originalName,
        fileType,
        url: `/uploads/${storedName}`,
        sizeKb: Math.max(1, Math.round(file.size / 1024)),
      },
      { status: 201 }
    );
  } catch (e) {
    return handleRouteError(e);
  }
}
