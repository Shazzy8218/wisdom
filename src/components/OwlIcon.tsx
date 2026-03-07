import owlLogo from "@/assets/owl-logo.png";

interface OwlIconProps {
  className?: string;
  size?: number;
}

/** Universal Owl icon — replaces all AI/Bot/Sparkles icons as the brand AI mark */
export default function OwlIcon({ className = "", size = 20 }: OwlIconProps) {
  return (
    <img
      src={owlLogo}
      alt="Wisdom AI"
      className={`drop-shadow-[0_0_6px_hsl(45,90%,55%,0.25)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
