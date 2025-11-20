import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@fontsource/jetbrains-mono";
import "./simple.css";
import { GlobalAlertProvider } from "@/components/global-alert-provider";
import { AuthProvider } from "@/components/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EDOS Detection Dashboard",
  description: "Advanced threat detection and monitoring system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <GlobalAlertProvider>{children}</GlobalAlertProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
