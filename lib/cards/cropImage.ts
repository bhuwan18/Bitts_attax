import type { Area } from "react-easy-crop";

// Browser-only (canvas/Image/document) — only ever imported from a "use
// client" component (components/inventory/ScanCardDialog.tsx), never from
// server code.
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Could not load that photo.")));
    image.src = src;
  });
}

// Draws the cropped region of `imageSrc` (an object URL) onto a canvas and
// exports it as a File, normalizing every input format (including HEIC/HEIF)
// to JPEG — both a nicer, tighter stored photo and a cleaner input for the
// Gemini vision call, since the same cropped file is reused for both.
export async function getCroppedImageFile(
  imageSrc: string,
  croppedAreaPixels: Area,
  fileName: string
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  );
  if (!blob) throw new Error("Could not crop that photo.");

  return new File([blob], fileName, { type: "image/jpeg" });
}
