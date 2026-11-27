import type { AdminBusiness } from "@/lib/admin-queries";
import type { Category } from "@/lib/queries";
import { saveBusinessAction } from "@/app/admin/actions";
import ActionForm from "./ActionForm";
import { SelectField, StatusField, TextArea, TextField } from "./Fields";

export default function BusinessForm({ categories, business }: { categories: Category[]; business?: AdminBusiness }) {
  const action = saveBusinessAction.bind(null, business?.id ?? null);
  return (
    <ActionForm action={action} cancelHref="/admin/usaha" submitLabel={business ? "Simpan perubahan" : "Tambah usaha"}>
      <TextField name="name" label="Nama usaha" defaultValue={business?.name} required maxLength={120} />
      <SelectField
        name="category_id"
        label="Kategori"
        required
        defaultValue={business?.category_id}
        options={categories.map((c) => ({ value: c.id, label: `${c.icon ?? ""} ${c.name}`.trim() }))}
      />
      <TextArea name="description" label="Deskripsi" defaultValue={business?.description} maxLength={2000} hint="Ceritakan singkat produk atau jasanya." />
      <div className="field-row">
        <TextField name="address" label="Alamat" defaultValue={business?.address} maxLength={255} />
        <TextField
          name="phone_wa"
          label="Nomor WhatsApp"
          type="tel"
          defaultValue={business?.phone_wa}
          placeholder="0812-3456-7890"
          hint="Hanya isi bila pemilik usaha setuju nomornya ditampilkan."
        />
      </div>
      <StatusField defaultValue={business?.status ?? "active"} />
    </ActionForm>
  );
}
