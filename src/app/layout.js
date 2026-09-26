import "./globals.css";

export const metadata = {
  title: "VoxVital - Emergency Triage Intake",
  description: "Touchless vitals scan & multilingual voice triage decision support",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-white text-black antialiased">
      <body className="min-h-full flex flex-col bg-white text-black font-sans">{children}</body>
    </html>
  );
}
