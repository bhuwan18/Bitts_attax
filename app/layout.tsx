import type { Metadata, Viewport } from "next";
import { Bungee, Manrope } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

// Bungee: chunky, blocky, stadium-scoreboard/foil-sticker energy — reserved
// for display headlines and big numbers (OVR, stats, level), never body
// copy. Only ships weight 400 (it's a single-weight display face).
const headingFont = Bungee({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400",
});

// Manrope: warm, clean humanist sans for body/UI text — enough contrast
// against Bungee's geometric weight to stay readable at length.
const bodyFont = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Bitts Attax",
  description: "Browse, collect, and trade Match Attax cards.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bitts Attax",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101418",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${headingFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <SupabaseProvider>
            <TooltipProvider>
              <div className="flex min-h-full flex-1 flex-col">
                <div className="flex-1">{children}</div>
                <footer className="py-2 text-center text-xs text-muted-foreground">
                  created by Bhavik G6 OIS
                </footer>
              </div>
            </TooltipProvider>
            <Toaster />
          </SupabaseProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
