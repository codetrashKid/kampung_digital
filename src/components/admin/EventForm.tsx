import type { AdminEvent } from "@/lib/admin-queries";
import { saveEventAction } from "@/app/admin/actions";
import { toLocalDateTimeValue } from "@/lib/validation";
import ActionForm from "./ActionForm";
import { StatusField, TextArea, TextField } from "./Fields";

export default function EventForm({ item }: { item?: AdminEvent }) {
  return (
    <ActionForm
      action={saveEventAction.bind(null, item?.id ?? null)}
      cancelHref="/admin/agenda"
      submitLabel={item ? "Simpan perubahan" : "Simpan agenda"}
    >
      <TextField name="title" label="Nama kegiatan" defaultValue={item?.title} required maxLength={150} />
      <div className="field-row">
        <TextField name="starts_at" label="Mulai" type="datetime-local" defaultValue={toLocalDateTimeValue(item?.starts_at ?? null)} required hint="Waktu WIB" />
        <TextField name="ends_at" label="Selesai (opsional)" type="datetime-local" defaultValue={toLocalDateTimeValue(item?.ends_at ?? null)} hint="Waktu WIB" />
      </div>
      <TextField name="location_text" label="Lokasi" defaultValue={item?.location_text} maxLength={200} />
      <TextArea name="description" label="Keterangan" defaultValue={item?.description} maxLength={3000} />
      <StatusField defaultValue={item?.status ?? "active"} />
    </ActionForm>
  );
}
