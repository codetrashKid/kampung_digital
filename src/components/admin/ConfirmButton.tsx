"use client";

type Props = { message: string; className?: string; children: React.ReactNode };

/** Tombol submit yang meminta konfirmasi dulu (untuk hapus). */
export default function ConfirmButton({ message, className = "btn btn-danger btn-sm", children }: Props) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
