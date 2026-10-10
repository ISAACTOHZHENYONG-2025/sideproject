import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

// The only Material Symbols the app uses, so Google sends a 4 KB font instead of the 4 MB full set. Add a new
// MaterialIcon name here or it shows as plain text. Google wants them A–Z, hence the sort.
const ICON_NAMES = [
  "add_circle",
  "check",
  "close",
  "content_copy",
  "directions_walk",
  "eco",
  "expand_less",
  "expand_more",
  "explore",
  "group_add",
  "groups",
  "location_on",
  "login",
  "logout",
  "near_me",
  "payments",
  "progress_activity",
  "restaurant",
  "schedule",
  "search",
  "stars",
  "tune",
  "verified",
  "warning",
].sort();

// Fixed at the one style globals.css uses. display=block keeps an icon blank, rather than showing its name, while the font loads.
const ICON_FONT_URL = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=${ICON_NAMES.join(",")}&display=block`;

export const metadata: Metadata = {
  title: "makanApa",
  description: "Campus dining matches for Universiti Malaya students.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="stylesheet" href={ICON_FONT_URL} />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
