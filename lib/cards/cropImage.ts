// Browser-only (canvas/Image/URL.createObjectURL) — only ever imported from
// "use client" components (ScanCardDialog for the scan flow's automatic
// crop, AddToInventoryDialog for the manual "Adjust crop" option), never
// from server code.

// Every card image in this app displays at aspect-[3/4] (CardTile,
// InventoryItemTile, AddToInventoryDialog) — auto-cropping to the same ratio
// means the stored photo fills that box cleanly instead of being squeezed or
// letterboxed by object-cover at display time. Exported for
// lib/cards/perspectiveCrop.ts, which targets the same ratio.
export const CROP_ASPECT = 3 / 4;

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Harmless for same-origin blob: URLs (the scan/pick flow); required for
    // AddToInventoryDialog's "Adjust crop" re-editing an already-uploaded
    // custom_image_url from Supabase Storage, so canvas reads don't taint.
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Could not load that photo.")));
    image.src = src;
  });
}

// Center-crops `file` to CROP_ASPECT (cover-style — fills the box, trimming
// whichever dimension has excess — the same behavior as the object-cover
// class already used everywhere card images render) and re-encodes as JPEG,
// normalizing every input format (including HEIC/HEIF) on the way out.
export async function getCenterCroppedImageFile(file: File, fileName: string): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const { naturalWidth: width, naturalHeight: height } = image;
    const currentAspect = width / height;

    let cropWidth = width;
    let cropHeight = height;
    if (currentAspect > CROP_ASPECT) {
      cropWidth = height * CROP_ASPECT;
    } else {
      cropHeight = width / CROP_ASPECT;
    }
    const x = (width - cropWidth) / 2;
    const y = (height - cropHeight) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");
    ctx.drawImage(image, x, y, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (!blob) throw new Error("Could not crop that photo.");

    return new File([blob], fileName, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// User-driven crop: `croppedAreaPixels` comes from react-easy-crop's
// onCropComplete (AddToInventoryDialog's "Adjust crop" step). `imageSrc` can
// be a local blob: URL (a freshly picked photo) or a remote https URL (an
// already-stored custom_image_url being re-edited).
export async function getCroppedImageFile(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number },
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
