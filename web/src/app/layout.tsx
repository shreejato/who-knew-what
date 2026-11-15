import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "NarrativeOS — Story Intelligence Engine",
  description: "Reasoning and verification engine for fiction manuscripts. Track who knew what and catch plot holes with exact evidence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0B0B1E] text-white selection:bg-[#6C47FF]/30 selection:text-indigo-200 font-sans">
        {children}
      </body>
    </html>
  );
}
