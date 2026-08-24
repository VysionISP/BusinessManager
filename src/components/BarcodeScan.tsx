"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";

// The native BarcodeDetector API isn't in lib.dom.d.ts yet — declare the
// minimal shape we use rather than pulling in a third-party type package.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
  }
}

export function BarcodeScanButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState("");
  const [supported, setSupported] = useState(() => typeof window !== "undefined" && !!window.BarcodeDetector);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open || !window.BarcodeDetector) return;

    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    const detector = new window.BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
    });

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play();
        }
        const scan = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              goTo(codes[0].rawValue);
              return;
            }
          } catch {
            // detection failures on a given frame are expected — keep scanning
          }
          raf = requestAnimationFrame(scan);
        };
        raf = requestAnimationFrame(scan);
      })
      .catch(() => setSupported(false));

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function goTo(code: string) {
    setOpen(false);
    router.push(`/stock?barcode=${encodeURIComponent(code)}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Camera className="h-4 w-4" strokeWidth={2.25} />
        Scan barcode
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Scan barcode</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            {supported ? (
              <video ref={videoRef} className="aspect-video w-full rounded-lg bg-black object-cover" muted playsInline />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Camera scanning isn&apos;t supported in this browser. Enter the barcode below instead.
              </p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manual.trim()) goTo(manual.trim());
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Or type the barcode"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button type="submit" className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                Go
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
