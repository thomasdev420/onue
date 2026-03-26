import { Geist, Geist_Mono, Inter, Poppins, Roboto, Open_Sans, Montserrat, Raleway, Playfair_Display, Merriweather, Oswald, Lato, Nunito, Quicksand, Comfortaa, Bebas_Neue, Anton, Pacifico, Dancing_Script, Caveat, Indie_Flower, Permanent_Marker } from "next/font/google";
import "./globals.css";
import ProductionSessionProvider from "./components/layout/ProductionSessionProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import ConditionalFeedbackButton from "./components/ConditionalFeedbackButton";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./lib/authOptions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Font configurations for text overlays
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  weight: ["400", "600"],
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  weight: ["400"],
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["400"],
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const lato = Lato({
  variable: "--font-lato",
  weight: ["400"],
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  weight: ["400", "600"],
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  weight: ["400"],
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: ["400"],
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: ["400"],
  subsets: ["latin"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  weight: ["400"],
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  weight: ["400", "600"],
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  weight: ["400", "600"],
  subsets: ["latin"],
});

const indieFlower = Indie_Flower({
  variable: "--font-indie",
  weight: ["400"],
  subsets: ["latin"],
});

const permanentMarker = Permanent_Marker({
  variable: "--font-permanent",
  weight: ["400"],
  subsets: ["latin"],
});

export async function generateMetadata() {
  return {
    title: "Amply: know which API to call in 200ms",
    description:
      "Machine readable routing for agents: price, latency, success rate from real usage, not LLM guesses. Faster and cheaper than reasoning. Free to start.",
    icons: {
      icon: { url: '/favicon.png?v=9', type: 'image/png', sizes: '32x32' },
      apple: { url: '/favicon.png?v=9', type: 'image/png', sizes: '32x32' },
      shortcut: '/favicon.png?v=9'
    }
  };
}

export default async function RootLayout({ children }) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("[RootLayout] getServerSession failed:", err?.message || err);
  }
  
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${poppins.variable} ${roboto.variable} ${openSans.variable} ${montserrat.variable} ${raleway.variable} ${playfairDisplay.variable} ${merriweather.variable} ${oswald.variable} ${lato.variable} ${nunito.variable} ${quicksand.variable} ${comfortaa.variable} ${bebasNeue.variable} ${anton.variable} ${pacifico.variable} ${dancingScript.variable} ${caveat.variable} ${indieFlower.variable} ${permanentMarker.variable} antialiased`}>
        <ErrorBoundary>
          <ProductionSessionProvider session={session}>
            {children}
            <ConditionalFeedbackButton />
          </ProductionSessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}