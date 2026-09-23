import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Hadirin | Sistem Absensi Karyawan", description: "Sistem absensi karyawan berbasis Supabase" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="id"><body>{children}</body></html>;
}
