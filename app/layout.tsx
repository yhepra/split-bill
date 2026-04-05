import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SplitBill — Split Tagihan dengan OCR Struk",
  description:
    "Bagi tagihan resto/kafe dengan mudah. Upload foto struk, AI OCR ekstrak item otomatis, assign ke teman, dan copy ringkasan ke WhatsApp.",
  keywords: ["split bill", "bagi tagihan", "OCR struk", "tesseract", "split bill indonesia"],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.classList.toggle('dark', theme === 'dark');
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                  document.documentElement.classList.toggle('dark', e.matches);
                });
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
