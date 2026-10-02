import "./globals.css";

export const metadata = {
  title: "KAMUNATI",
  description: "KAMUNATI movie streaming web app"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
