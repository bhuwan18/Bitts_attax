import { ImageResponse } from "next/og";
import { IconMark } from "@/lib/icon-mark";

export async function GET() {
  // Shrunk into the OS "safe zone" — maskable icons get cropped to a
  // circle/squircle by the launcher, so content can't reach the edges.
  return new ImageResponse(<IconMark size={512} safe={0.55} />, { width: 512, height: 512 });
}
