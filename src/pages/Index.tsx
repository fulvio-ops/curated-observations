import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ObservationsSection from "@/components/ObservationsSection";
import ObjectsSection from "@/components/ObjectsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ObservationsSection />
        <ObjectsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
