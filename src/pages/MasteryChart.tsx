import MasteryRadar from "@/components/MasteryRadar";
import HiddenOwl from "@/components/HiddenOwl";

export default function MasteryChart() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6 relative">
        <p className="section-label text-primary mb-2">Mastery Chart</p>
        <h1 className="font-display text-h1 text-foreground">Your Knowledge<br/>Map</h1>
        <p className="text-body text-muted-foreground mt-2">Track mastery across 22 categories.</p>
        <HiddenOwl locationId="mastery-chart" className="absolute right-6 top-16" size={18} />
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      <div className="px-5">
        <MasteryRadar />
      </div>
    </div>
  );
}
