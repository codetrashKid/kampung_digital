import type { AdminRelease } from "@/lib/admin-queries";
import { saveReleaseAction } from "@/app/admin/actions";
import ActionForm from "./ActionForm";
import { CheckboxField, SelectField, TextArea, TextField } from "./Fields";

export default function ReleaseForm({ release }: { release?: AdminRelease }) {
  return (
    <ActionForm
      action={saveReleaseAction.bind(null, release?.id ?? null)}
      cancelHref="/admin/rilis"
      submitLabel={release ? "Simpan perubahan" : "Terbitkan rilis"}
    >
      {release ? (
        // Platform dan build adalah identitas rilis: ditampilkan, tidak bisa diubah (server mengabaikannya).
        <div className="field-row">
          <div className="field"><label>Platform</label><input name="platform" defaultValue={release.platform} readOnly /></div>
          <div className="field"><label>Nomor build</label><input name="build_number" defaultValue={release.build_number} readOnly /></div>
        </div>
      ) : (
        <div className="field-row">
          <SelectField
            name="platform"
            label="Platform"
            required
            options={[{ value: "android", label: "Android (APK)" }, { value: "ios", label: "iOS (TestFlight / App Store)" }]}
          />
          <TextField
            name="build_number"
            label="Nomor build"
            required
            type="number"
            hint="Samakan dengan nomor build di nama artefak GitHub Actions (kampung-digital-apk-build-N)."
          />
        </div>
      )}
      <TextField name="version_name" label="Versi" defaultValue={release?.version_name} required placeholder="0.2.0" hint="Ditampilkan ke pengguna, format 1.2.3." />
      <TextField
        name="download_url"
        label="Tautan unduhan"
        type="url"
        defaultValue={release?.download_url}
        required
        maxLength={500}
        placeholder="https://..."
        hint="Android: tautan langsung ke file APK yang sudah Anda unggah. iOS: tautan TestFlight atau App Store. Harus https."
      />
      <TextArea name="release_notes" label="Catatan rilis" defaultValue={release?.release_notes} maxLength={2000} hint="Apa yang baru; tampil di layar update." />
      <CheckboxField
        name="is_mandatory"
        label="Update wajib"
        defaultChecked={release?.is_mandatory ?? false}
        hint="Pengguna dengan build lebih lama dikunci sampai memperbarui. Pastikan tautan unduhan sudah bisa dibuka!"
      />
      <CheckboxField name="is_active" label="Aktif" defaultChecked={release?.is_active ?? true} hint="Matikan untuk membatalkan rilis (kunci update wajib ikut dicabut)." />
    </ActionForm>
  );
}
