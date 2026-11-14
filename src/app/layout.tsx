import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { MyListProvider } from "@/components/my-list/my-list-provider";
import { Navbar } from "@/components/navbar";
import { ProfileProvider } from "@/components/profiles/profile-provider";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vireo",
    template: "%s · Vireo",
  },
  description: "Films and series, lit by the light of whatever you're watching.",
  applicationName: "Vireo",
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  colorScheme: "dark",
};

// `modal` is the @modal slot: the title pop-up when open, otherwise empty.
export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${schibsted.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ProfileProvider>
            <MyListProvider>
              <Navbar />
              {children}
              {modal}
            </MyListProvider>
          </ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
