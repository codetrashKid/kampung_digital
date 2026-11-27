// Logika murni untuk pengecekan versi aplikasi mobile (tanpa database, mudah diuji).

export const APP_PLATFORMS = ["android", "ios"] as const;
export type AppPlatform = (typeof APP_PLATFORMS)[number];

export type LatestRelease = {
  version_name: string;
  build_number: number;
  download_url: string;
  release_notes: string | null;
  created_at: Date | string;
  /** true bila ada rilis wajib di antara build klien dan rilis terbaru. */
  required: boolean;
};

export type UpdateCheckResponse = {
  platform: AppPlatform;
  current_build: number;
  update_available: boolean;
  update_required: boolean;
  latest: {
    version: string;
    build: number;
    url: string;
    notes: string | null;
    published_at: string;
  } | null;
};

export function parsePlatform(v: string | null): AppPlatform | null {
  return (APP_PLATFORMS as readonly string[]).includes(v ?? "") ? (v as AppPlatform) : null;
}

/** Bilangan bulat positif (maks 2^31-1), atau null bila tidak valid. */
export function parseBuild(v: string | null): number | null {
  if (v === null || !/^\d{1,10}$/.test(v)) return null;
  const n = Number(v);
  return n > 0 && n <= 2_147_483_647 ? n : null;
}

/**
 * Menyusun respons dari rilis aktif terbaru yang lebih baru dari build klien.
 * `latest` null berarti klien sudah paling baru (atau belum ada rilis).
 */
export function buildUpdateResponse(
  platform: AppPlatform,
  currentBuild: number,
  latest: LatestRelease | null,
): UpdateCheckResponse {
  if (!latest || latest.build_number <= currentBuild) {
    return { platform, current_build: currentBuild, update_available: false, update_required: false, latest: null };
  }
  return {
    platform,
    current_build: currentBuild,
    update_available: true,
    update_required: latest.required,
    latest: {
      version: latest.version_name,
      build: latest.build_number,
      url: latest.download_url,
      notes: latest.release_notes,
      published_at: new Date(latest.created_at).toISOString(),
    },
  };
}
