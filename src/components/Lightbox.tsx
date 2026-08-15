import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, type PanInfo, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";

import { spring } from "@/lib/motion";

export function Lightbox({
  images,
  index,
  onClose,
}: {
  images: string[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);

  // Drag-to-dismiss: the image tracks the finger 1:1, the backdrop dims and the
  // image shrinks with distance (dim-to-focus), and a flick or a far-enough drag
  // hands its velocity off to the dismissal. Short of that it springs back.
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [-260, 0, 260], [0.2, 1, 0.2]);
  const imageScale = useTransform(y, [-260, 0, 260], [0.88, 1, 0.88]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setCurrent((i) => (i - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, onClose]);

  function handleDragEnd(_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    const flung = Math.abs(info.velocity.y) > 500;
    const far = Math.abs(info.offset.y) > 160;
    if (flung || far) onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Dim layer — its opacity is driven by how far the image is dragged */}
      <motion.div className="absolute inset-0 bg-black/90" style={{ opacity: backdropOpacity }} />

      <button
        aria-label="Close"
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        onClick={onClose}
      >
        <X className="size-5" />
      </button>

      <motion.img
        key={current}
        src={images[current]}
        alt={`Image ${current + 1}`}
        drag="y"
        dragSnapToOrigin
        dragElastic={0.5}
        onDragEnd={handleDragEnd}
        style={{ y, scale: imageScale }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={spring.snappy}
        draggable={false}
        className="relative z-10 max-h-[85vh] max-w-full cursor-grab touch-none rounded-2xl object-contain shadow-2xl select-none active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <>
          <button
            aria-label="Previous image"
            className="absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((i) => (i - 1 + images.length) % images.length);
            }}
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            aria-label="Next image"
            className="absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((i) => (i + 1) % images.length);
            }}
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}

      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
        {current + 1} / {images.length}
      </div>
    </motion.div>
  );
}
