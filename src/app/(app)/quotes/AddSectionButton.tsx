"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { Modal, type ModalHandle } from "@/components/Modal";
import { SectionForm } from "./SectionForm";

export function AddSectionButton({ action }: { action: (formData: FormData) => Promise<void> | void }) {
  const modalRef = useRef<ModalHandle>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => modalRef.current?.open()}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-700 dark:hover:bg-indigo-500/5"
      >
        <Plus className="h-4 w-4" />
        Add section
      </button>
      <Modal ref={modalRef} title="Add section">
        <SectionForm
          action={async (formData) => {
            await action(formData);
            modalRef.current?.close();
          }}
          submitLabel="Add section"
        />
      </Modal>
    </>
  );
}
