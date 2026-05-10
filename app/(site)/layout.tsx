import Header from "@/components/layout/Header";
import KidModeStrip from "@/components/layout/KidModeStrip";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import HelpButton from "@/components/layout/HelpButton";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <KidModeStrip />
      {children}
      <Footer />
      <HelpButton />
      <WhatsAppButton />
    </>
  );
}
