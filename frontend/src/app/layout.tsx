import type { Metadata } from "next";
import { Providers } from './providers'
import "./globals.css";
import "./global.css"
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { mantineOverrides } from "./mantineTheme";
import Logo from "@/images/Goedtech-logo(1).png";

const roboto = {
  variable: "--font-roboto",
  fontFamily: "'Roboto', sans-serif",
  subsets: ["latin"],
};

export const metadata: Metadata = {
  title: "GoEdtech",
  description: "Streamline operations, boost academic performance, and create exceptional educational experiences with our comprehensive school management platform.",
  icons: {
    icon: Logo.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body
        className={`${roboto.variable} antialiased`}
      >
        <MantineProvider theme={mantineOverrides}>
          <Providers>{children}</Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
