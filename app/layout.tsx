import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hadirin | Sistem Absensi Karyawan",
  description: "Sistem absensi karyawan berbasis Supabase",
  icons: {
    icon: [
      {
        url: "/images/hadirin.png",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
