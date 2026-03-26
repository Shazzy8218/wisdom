import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ZoomIn, ZoomOut, RotateCcw, Share2, Wand2, Maximize2 } from "lucide-react";

interface ImageViewerProps {
  src: string;
  alt?: string;
  prompt?: string;
  onClose: () => void;
  onRegenerate?: () => void;
}

export default function ImageViewer({ src, alt, prompt, onClose, onRegenerate }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.5, 0.5));
  const handleReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `owl-${(prompt || "image").slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-")}.png`;
    a.click();
  }, [src, prompt]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: prompt || "Generated Image", url: src });
      } catch {}
    } else {
      await navigator.clipboard.writeText(src);
    }
  }, [src, prompt]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: dragStart.current.posX + (e.clientX - dragStart.current.x),
      y: dragStart.current.posY + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(s => Math.max(0.5, Math.min(5, s + delta)));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/50">
          <div className="flex items-center gap-2 min-w-0">
            {prompt && (
              <p className="text-xs text-white/60 truncate max-w-[200px] md:max-w-[400px]">
                {prompt}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleZoomOut} className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs text-white/50 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={handleReset} className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Reset zoom">
              <Maximize2 className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Image area */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <motion.img
            src={src}
            alt={alt || prompt || "Image"}
            className="max-w-[90vw] max-h-[75vh] object-contain rounded-lg select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? "none" : "transform 0.2s ease",
            }}
            draggable={false}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-black/50">
          <button onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-xs text-white font-medium transition-colors">
            <Download className="h-3.5 w-3.5" /> Download
          </button>
          <button onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-xs text-white font-medium transition-colors">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          {onRegenerate && (
            <button onClick={() => { onClose(); onRegenerate(); }}
              className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-xs text-white font-medium transition-colors">
              <Wand2 className="h-3.5 w-3.5" /> Regenerate
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
