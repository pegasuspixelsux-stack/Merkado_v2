import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProvider } from "@/src/context/ClientContext";
import { CartProvider } from "@/src/context/CartContext";
import { BusinessProvider } from "@/src/context/BusinessContext";
import { getBusinessSettings } from "@/src/services/businessService";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_TITLE = "Merkado para Mayoristas";

export async function generateMetadata(): Promise<Metadata> {
  const { businessName } = await getBusinessSettings();
  return {
    title: businessName || DEFAULT_TITLE,
    description:
      "Frutas y verduras frescas directo del productor, para minoristas y mayoristas.",
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const business = await getBusinessSettings();
  return (
    <html
      lang="es-UY"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BusinessProvider initial={business}>
          <ClientProvider>
            <CartProvider>{children}</CartProvider>
          </ClientProvider>
        </BusinessProvider>
      </body>
    </html>
  );
}
