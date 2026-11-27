"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/app/admin/actions";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  cancelHref: string;
  children: React.ReactNode;
};

/**
 * Form admin dengan daftar kesalahan validasi dan tombol yang menonaktifkan diri saat proses.
 * React 19 mengosongkan form setelah aksi selesai; bila ada error, isian (kecuali sandi) dipulihkan
 * agar pengguna tidak perlu mengetik ulang.
 */
export default function ActionForm({ action, submitLabel, cancelHref, children }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef<[string, string][]>([]);

  const wrapped = async (prev: FormState, formData: FormData): Promise<FormState> => {
    submitted.current = [...formData.entries()].filter(
      (e): e is [string, string] => typeof e[1] === "string" && e[0] !== "password" && !e[0].startsWith("$ACTION"),
    );
    return action(prev, formData);
  };
  const [state, formAction, pending] = useActionState(wrapped, null);

  useEffect(() => {
    if (!state?.errors.length || !formRef.current) return;
    const sent = new Map(submitted.current);
    for (const el of Array.from(formRef.current.elements)) {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) continue;
      if (!el.name || el.name === "password") continue;
      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        el.checked = sent.has(el.name); // kotak yang tidak dicentang tidak ikut terkirim
      } else if (sent.has(el.name)) {
        el.value = sent.get(el.name)!;
      }
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="form">
      {state?.errors.length ? (
        <div className="alert alert-error" role="alert">
          <ul>{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      ) : null}
      {children}
      <div className="form-actions">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Menyimpan…" : submitLabel}
        </button>
        <Link href={cancelHref} className="btn btn-light">Batal</Link>
      </div>
    </form>
  );
}
