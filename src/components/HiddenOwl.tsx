import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isOwlVisible, claimOwl, type OwlSpawnId } from "@/lib/owl-hunt";
import owlLogo from "@/assets/owl-logo.png";
import { toast } from "@/hooks/use-toast";

interface HiddenOwlProps {
  locationId: OwlSpawnId;
  className?: string;
  size?: number;
}

export default function HiddenOwl({ locationId, className = "", size = 20 }: HiddenOwlProps) {
  const [visible, setVisible] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    setVisible(isOwlVisible(locationId));
  }, [locationId]);

  if (!visible || claimed) return null;

  const handleClaim = () => {
    const tokens = claimOwl(locationId);
    if (tokens > 0) {
      setClaimed(true);
      toast({
        title: "🦉 You found the Wisdom Owl!",
        description: `+${tokens} Wisdom Tokens earned`,
      });
    }
  };

  return (
    <AnimatePresence>
      {!claimed && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.35, scale: 1 }}
          exit={{ opacity: 0, scale: 1.5 }}
          whileHover={{ opacity: 0.8, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
          onClick={handleClaim}
          className={`cursor-pointer select-none ${className}`}
          aria-label="Hidden owl"
          style={{ lineHeight: 0 }}
        >
          <img
            src={owlLogo}
            alt=""
            style={{ width: size, height: size }}
            className="pointer-events-none drop-shadow-[0_0_6px_hsl(45,90%,55%,0.4)]"
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
