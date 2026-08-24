"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { X } from "lucide-react";

export interface ModalHandle {
  open: () => void;
  close: () => void;
}

export const Modal = forwardRef<ModalHandle, { title: string; children: React.ReactNode }>(function Modal(
  { title, children },
  ref,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useImperativeHandle(ref, () => ({
    open: () => dialogRef.current?.showModal(),
    close: () => dialogRef.current?.close(),
  }));

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      // fixed inset-0 m-auto re-centres the dialog: the browser's built-in
      // centring relies on UA margin:auto, which Tailwind's preflight resets.
      className="fixed inset-0 m-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/40 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
});
