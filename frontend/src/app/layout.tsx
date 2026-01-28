import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/ui/Sidebar";
import NotificationManager from "@/components/NotificationManager";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MedRemind | Your Personal Health Guardian",
  description: "Medication reminder and health risk prediction powered by AI",
  keywords: ["medication", "reminder", "health", "AI", "prescription"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-0 min-h-screen">
              <NotificationManager />
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
