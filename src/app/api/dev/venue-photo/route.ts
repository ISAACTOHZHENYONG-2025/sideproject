import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isValidVenueId, venuePhotoPath } from "@/lib/venuePhoto";

// Developer-only: saves the photo posted by a card's "Upload photo" button (shown only under `npm run dev`)
// as public/venues/<venueId>.jpg. Every method answers 404 outside development, so a production server
// behaves as if this route were not there.

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_WIDTH_PX = 1024;
const JPEG_QUALITY = 80;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

const notFound = () => new NextResponse(null, { status: 404 });
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

// Browsers send an Origin header on cross-site form posts. Refuse those, so a web page open in another tab
// can't write files into public/ through the local dev server.
function isCrossOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== req.headers.get("host");
  } catch {
    return true;
  }
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") return notFound();
  if (isCrossOrigin(req)) return fail("Cross-origin uploads are not allowed.", 403);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Expected a multipart form.", 400);
  }
  const venueId = form.get("venueId");
  const photo = form.get("photo");
  if (typeof venueId !== "string" || !isValidVenueId(venueId)) {
    return fail('venueId may only contain letters, digits, "-" and "_".', 400);
  }
  if (!(photo instanceof File)) return fail('Attach the image as the "photo" field.', 400);
  if (photo.size > MAX_UPLOAD_BYTES) return fail("That image is over 15 MB.", 413);

  let jpeg: { data: Buffer; info: { width: number; height: number } };
  try {
    // Loaded here, after the guard, so a production server never loads sharp for this route.
    const { default: sharp } = await import("sharp");
    const image = sharp(Buffer.from(await photo.arrayBuffer()), { failOn: "error" });
    const { format } = await image.metadata();
    if (!format || !ACCEPTED_FORMATS.has(format)) return fail("Use a JPG, PNG or WebP image.", 415);
    jpeg = await image
      .rotate() // apply the EXIF orientation phones record instead of turning the pixels
      .flatten({ background: "#ffffff" }) // JPEG has no transparency
      .resize({ width: MAX_WIDTH_PX, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer({ resolveWithObject: true });
  } catch {
    return fail("Could not read that image. Use a JPG, PNG or WebP.", 400);
  }

  try {
    const dir = path.join(process.cwd(), "public", "venues");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${venueId}.jpg`), jpeg.data);
  } catch (err) {
    console.error("Could not save venue photo:", err);
    return fail("Could not write the file into public/venues/.", 500);
  }

  return NextResponse.json({
    path: venuePhotoPath(venueId),
    bytes: jpeg.data.length,
    width: jpeg.info.width,
    height: jpeg.info.height,
  });
}

// The other methods get a plain 404 too; without these Next would answer 405 and reveal the route.
export const GET = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
