import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const headingFont = Big_Shoulders({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#211c14" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
