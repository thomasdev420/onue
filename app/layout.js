import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ProductionSessionProvider from "./components/layout/ProductionSessionProvider";
import ErrorBoundary from "./components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SwiftReel - Content Creation Platform",
  description: "Create viral, self-improving videos and posts that drive millions of views, boost traffic, and grow your brand automatically.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          <ProductionSessionProvider>
            {children}
          </ProductionSessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}