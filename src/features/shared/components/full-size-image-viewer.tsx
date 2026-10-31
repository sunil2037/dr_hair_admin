"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";

export type ViewerImage = {
  src: string;
  alt: string;
  fileName: string;
  caption?: string;
  downloadHref?: string;
};

export function FullSizeImageViewer({ image, onClose }: { image: ViewerImage | null; onClose: () => void }) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!image) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [image]);

  if (!image) return null;

  const canDownloadFromCloudinary = (() => {
    try {
      const url = new URL(image.src);
      return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && url.pathname.includes("/image/upload/");
    } catch { return false; }
  })();
  const downloadUrl = image.downloadHref || (canDownloadFromCloudinary ? `/api/admin/media/image-download?src=${encodeURIComponent(image.src)}&name=${encodeURIComponent(image.fileName)}` : null);
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="relative flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101827] shadow-2xl" role="dialog" aria-modal="true" aria-label={`Image preview: ${image.alt}`}>
      <header className="flex min-w-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white sm:px-5">
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{image.alt}</p>{image.caption && <p className="mt-0.5 truncate text-xs text-slate-300">{image.caption}</p>}</div>
        <div className="flex shrink-0 items-center gap-2">
          {downloadUrl && <a href={downloadUrl} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white transition hover:bg-white/10"><Download size={14} />Download</a>}
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-200 transition hover:bg-white/10 hover:text-white" aria-label="Close image preview"><X size={18} /></button>
        </div>
      </header>
      <div className="relative min-h-0 flex-1 bg-black/25 p-3 sm:p-5">
        <div className="relative mx-auto h-[min(76dvh,780px)] w-full">
          <Image src={image.src} alt={image.alt} fill unoptimized sizes="100vw" className="object-contain" priority />
        </div>
      </div>
      <p className="sr-only">Use Escape to close this image preview.</p>
    </section>
  </div>;
}
