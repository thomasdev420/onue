import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ProductionSessionProvider from "./components/layout/ProductionSessionProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import FeedbackButton from "./components/FeedbackButton";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
      title: "Flightmedia - Content Creation Platform",
  description: "Create viral, self-improving videos and posts that drive millions of views, boost traffic, and grow your brand automatically.",
};

export default async function RootLayout({ children }) {
  // Fetch session on server side to prevent hydration mismatch
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          <ProductionSessionProvider session={session}>
            {children}
            <FeedbackButton />
          </ProductionSessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}