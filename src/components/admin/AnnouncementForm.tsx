import type { AdminAnnouncement } from "@/lib/admin-queries";
import { saveAnnouncementAction } from "@/app/admin/actions";
import ActionForm from "./ActionForm";
import { StatusField, TextArea, TextField } from "./Fields";

export default function AnnouncementForm({ item }: { item?: AdminAnnouncement }) {
  return (
    <ActionForm
      action={saveAnnouncementAction.bind(null, item?.id ?? null)}
      cancelHref="/admin/pengumuman"
      submitLabel={item ? "Simpan perubahan" : "Simpan pengumuman"}
    >
      <TextField name="title" label="Judul" defaultValue={item?.title} required maxLength={150} />
      <TextArea name="body" label="Isi pengumuman" defaultValue={item?.body} required maxLength={5000} />
      <StatusField defaultValue={item?.status ?? "active"} />
    </ActionForm>
  );
}
