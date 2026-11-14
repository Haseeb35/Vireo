import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { MyListProvider } from "@/components/my-list/my-list-provider";
import { Navbar } from "@/components/navbar";
import { ProfileProvider } from "@/components/profiles/profile-provider";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { ServiceWorker } from "@/components/pwa/service-worker";
import { TabBar } from "@/components/tab-bar";
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
  // Installed on iPhone/iPad: open full screen with a translucent status bar.
  appleWebApp: { capable: true, title: "Vireo", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  colorScheme: "dark",
  viewportFit: "cover", // draw under the notch; components pad with safe-area insets
};

// `modal` is the @modal slot: the title pop-up when open, otherwise empty.
export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${schibsted.variable} ${jetbrains.variable} h-full antialiased`}
    >
      {/* Bottom padding on phones keeps content clear of the tab bar */}
      <body className="flex min-h-full flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <AuthProvider>
          <ProfileProvider>
            <MyListProvider>
              <Navbar />
              <OfflineBanner />
              {children}
              {modal}
              <TabBar />
              <InstallPrompt />
              <ServiceWorker />
            </MyListProvider>
          </ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
