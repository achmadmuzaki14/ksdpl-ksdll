import React, { useMemo, useState } from "react";
import { Link, router, useForm } from "@inertiajs/react";

type VerificationStatus = "accepted" | "adjusted" | "need_revision";

type Indicator = {
  id: number;
  dimension: 1 | 2 | 3 | 4;
  code: string;
  title: string;
};

type CooperationLite = {
  id: number;
  title: string;
  partner_name: string;
  type: string;
};

type VerificationLite = {
  id: number;
  status: VerificationStatus;
  score_verified: number | null;
  verifier_note: string | null;
  updated_at?: string | null;
};

type ResponseRow = {
  id: number;
  cooperation_id: number | null;
  score_self: number | null;
  justification: string | null;
  evidence_links: string[] | null;
  is_not_applicable: boolean;
  is_complete?: boolean;
  indicator: Indicator | null;
  cooperation: CooperationLite | null;
  verification: VerificationLite | null;
};

type Props = {
  assessment: {
    id: number;
    year: number;
    province?: string | null;
    regency_city?: string | null;
    status: string;
    submitted_at?: string | null;
    verified_at?: string | null;
    published_at?: string | null;
  };
  creator?: { id: number; name: string; email: string } | null;
  coverage: {
    total: number;
    verified_count: number;
    need_revision_count: number;
  };
  responses: ResponseRow[];
  can_finalize_verify: boolean;
};

export default function AdminAssessmentReview({
  assessment,
  creator,
  coverage,
  responses,
  can_finalize_verify,
}: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unverified" | VerificationStatus>("all");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const dim1 = responses
      .filter((r) => r.cooperation_id === null && r.indicator?.dimension === 1)
      .sort((a, b) => (a.indicator?.code ?? "").localeCompare(b.indicator?.code ?? ""));

    const coopMap = new Map<number, { coop: CooperationLite; byDim: Record<number, ResponseRow[]> }>();

    for (const r of responses) {
      if (!r.cooperation_id) continue;
      const coop = r.cooperation;
      if (!coop) continue;

      if (!coopMap.has(coop.id)) {
        coopMap.set(coop.id, { coop, byDim: { 2: [], 3: [], 4: [] } });
      }

      const bucket = coopMap.get(coop.id)!;
      const d = r.indicator?.dimension ?? 0;
      if (d === 2 || d === 3 || d === 4) bucket.byDim[d].push(r);
    }

    const cooperations = Array.from(coopMap.values()).map((x) => {
      for (const d of [2, 3, 4] as const) {
        x.byDim[d].sort((a, b) => (a.indicator?.code ?? "").localeCompare(b.indicator?.code ?? ""));
      }
      return x;
    });

    cooperations.sort((a, b) => a.coop.title.localeCompare(b.coop.title));

    return { dim1, cooperations };
  }, [responses]);

  const filteredDim1 = useMemo(() => applyFilters(grouped.dim1, query, filter), [grouped.dim1, query, filter]);

  const filteredCoops = useMemo(() => {
    return grouped.cooperations
      .map((c) => {
        const byDim = {
          2: applyFilters(c.byDim[2] ?? [], query, filter),
          3: applyFilters(c.byDim[3] ?? [], query, filter),
          4: applyFilters(c.byDim[4] ?? [], query, filter),
        };
        const total = byDim[2].length + byDim[3].length + byDim[4].length;
        return { coop: c.coop, byDim, total };
      })
      .filter((x) => x.total > 0);
  }, [grouped.cooperations, query, filter]);

  const verifiedPct = coverage.total === 0 ? 0 : Math.round((coverage.verified_count / coverage.total) * 100);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  const handleFinalizeVerify = () => {
    router.post(route("assessments.verify", assessment.id), {}, { preserveScroll: true });
  };

  const canShowFinalizeButton = assessment.status === "submitted";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  Admin Review — Assessment {assessment.year}
                </h1>
                <StatusBadge status={assessment.status} />
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {assessment.province ?? "-"} • {assessment.regency_city ?? "-"}
                {creator ? (
                  <>
                    {" "}
                    • Dibuat oleh <span className="font-medium text-gray-700">{creator.name}</span>
                  </>
                ) : null}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <Pill>Coverage: {coverage.verified_count}/{coverage.total} ({verifiedPct}%)</Pill>
                <Pill className="border-yellow-200 bg-yellow-50 text-yellow-800">
                  Need revision: {coverage.need_revision_count}
                </Pill>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={route("assessments.show", assessment.id)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
              >
                ← Kembali ke Dashboard
              </Link>

              {canShowFinalizeButton && (
                <button
                  onClick={handleFinalizeVerify}
                  disabled={!can_finalize_verify}
                  className={`rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm ${
                    can_finalize_verify ? "bg-blue-600 hover:opacity-90" : "bg-gray-300 cursor-not-allowed"
                  }`}
                  title={
                    can_finalize_verify
                      ? "Verify assessment (status → verified)"
                      : "Tidak bisa verify: masih ada indikator belum diverifikasi atau need_revision"
                  }
                >
                  Finalize Verify
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative w-full max-w-md">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari indikator / judul / kode / cooperation..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
                />
                {query ? (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <select
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "unverified" | VerificationStatus)}
              >
                <option value="all">Semua</option>
                <option value="unverified">Belum diverifikasi</option>
                <option value="accepted">Accepted</option>
                <option value="adjusted">Adjusted</option>
                <option value="need_revision">Need revision</option>
              </select>
            </div>

            <div className="text-xs text-gray-500">
              Adjusted memakai skor admin. Need revision memblokir verify final sampai diperbaiki.
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <SectionHeader
          title="Dimensi 1 — Kesiapan (Global)"
          subtitle="Response tanpa cooperation (cooperation_id = null)"
          count={filteredDim1.length}
          isOpen={openGroups["dim1"] ?? true}
          onToggle={() => toggleGroup("dim1")}
        />

        {(openGroups["dim1"] ?? true) && (
          <div className="space-y-3">
            {filteredDim1.map((r) => (
              <ReviewCard key={r.id} row={r} />
            ))}
            {filteredDim1.length === 0 && (
              <EmptyState text="Tidak ada item yang cocok dengan filter/search untuk Dimensi 1." />
            )}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Dimensi 2–4 — Per Cooperation</h2>
            <p className="text-sm text-gray-500">Kelompok response berdasarkan cooperation.</p>
          </div>

          {filteredCoops.map(({ coop, byDim, total }) => {
            const key = `coop-${coop.id}`;
            const isOpen = openGroups[key] ?? true;

            return (
              <div key={coop.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <button
                  onClick={() => toggleGroup(key)}
                  className="flex w-full items-start justify-between gap-4 border-b border-gray-200 p-5 text-left"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{coop.title}</h3>
                      <Pill className="border-gray-200 bg-gray-50 text-gray-700">{coop.type}</Pill>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{coop.partner_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Pill>Items: {total}</Pill>
                    <span className="text-sm text-gray-500">{isOpen ? "Hide" : "Show"}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="space-y-6 p-5">
                    {[2, 3, 4].map((d) => (
                      <div key={d}>
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900">Dimensi {d}</h4>
                          <span className="text-xs text-gray-500">{byDim[d].length} item</span>
                        </div>

                        <div className="space-y-3">
                          {byDim[d].map((r) => (
                            <ReviewCard key={r.id} row={r} />
                          ))}
                          {byDim[d].length === 0 && (
                            <EmptyState text={`Tidak ada item di Dimensi ${d} untuk filter/search saat ini.`} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filteredCoops.length === 0 && (
            <EmptyState text="Tidak ada cooperation yang cocok dengan filter/search, atau belum ada response dimensi 2–4." />
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ row }: { row: ResponseRow }) {
  const initialStatus: VerificationStatus = row.verification?.status ?? "accepted";
  const initialScoreVerified = row.verification?.score_verified ?? null;
  const initialNote = row.verification?.verifier_note ?? "";

  const { data, setData, post, processing, errors, recentlySuccessful, setError, clearErrors } = useForm<{
    status: VerificationStatus;
    score_verified: number | "";
    verifier_note: string;
  }>({
    status: initialStatus,
    score_verified: initialScoreVerified ?? "",
    verifier_note: initialNote ?? "",
  });

  const isUnverified = !row.verification;
  const showScoreVerified = data.status === "adjusted";
  const isNA = row.is_not_applicable;

  const onSave = () => {
    clearErrors();

    if (data.status === "adjusted" && data.score_verified === "") {
      setError("score_verified", "Skor verified wajib diisi jika status adjusted.");
      return;
    }

    if (data.status === "need_revision" && !data.verifier_note.trim()) {
      setError("verifier_note", "Catatan admin wajib diisi untuk need revision.");
      return;
    }

    post(route("admin.responses.verification.upsert", row.id), {
      preserveScroll: true,
    });
  };

  const statusOptions: VerificationStatus[] = isNA
    ? ["accepted", "need_revision"]
    : ["accepted", "adjusted", "need_revision"];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">
              {row.indicator ? `D${row.indicator.dimension}` : "—"}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-sm font-semibold text-gray-900">
              {row.indicator?.code ?? "—"} — {row.indicator?.title ?? "—"}
            </span>

            {isNA && (
              <Pill className="border-gray-200 bg-gray-50 text-gray-600">
                N/A
              </Pill>
            )}

            {isUnverified ? (
              <Pill className="border-orange-200 bg-orange-50 text-orange-800">
                Belum diverifikasi
              </Pill>
            ) : (
              <Pill className={pillByStatus(row.verification?.status ?? "accepted")}>
                {labelStatus(row.verification?.status ?? "accepted")}
              </Pill>
            )}

            {recentlySuccessful && (
              <Pill className="border-green-200 bg-green-50 text-green-700">Saved</Pill>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <InfoBox label="Skor Self" value={isNA ? "—" : (row.score_self ?? "—")} />
            <InfoBox label="Justifikasi" value={row.justification ? truncate(row.justification, 180) : "—"} />
            <InfoBox
              label="Evidence"
              value={row.evidence_links && row.evidence_links.length > 0 ? `${row.evidence_links.length} link` : "—"}
            />
          </div>

          {row.evidence_links && row.evidence_links.length > 0 && (
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-700">Evidence Links</p>
              <ul className="mt-2 space-y-1">
                {row.evidence_links.map((url, idx) => (
                  <li key={idx} className="break-all text-xs text-gray-700">
                    <a className="text-blue-600 hover:underline" href={url} target="_blank" rel="noreferrer">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="w-full md:w-[340px]">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Verifikasi Admin</p>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Status</label>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
                  value={data.status}
                  onChange={(e) => {
                    const next = e.target.value as VerificationStatus;
                    setData("status", next);

                    if (next !== "adjusted") {
                      setData("score_verified", "");
                    }
                  }}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === "accepted" && "Accepted (pakai skor self)"}
                      {status === "adjusted" && "Adjusted (pakai skor admin)"}
                      {status === "need_revision" && "Need revision"}
                    </option>
                  ))}
                </select>
              </div>

              {showScoreVerified && (
                <div>
                  <label className="block text-xs font-medium text-gray-700">Skor Verified (1–4)</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
                    value={data.score_verified}
                    onChange={(e) => setData("score_verified", e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">-- pilih --</option>
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  {errors.score_verified && (
                    <p className="mt-1 text-xs text-red-600">{errors.score_verified}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Catatan Admin {data.status === "need_revision" ? "(wajib)" : ""}
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
                  rows={3}
                  value={data.verifier_note}
                  onChange={(e) => setData("verifier_note", e.target.value)}
                  placeholder="Alasan adjust / detail revisi yang diminta..."
                />
                {errors.verifier_note && (
                  <p className="mt-1 text-xs text-red-600">{errors.verifier_note}</p>
                )}
              </div>

              <button
                onClick={onSave}
                disabled={processing}
                className={`w-full rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm ${
                  processing ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:opacity-90"
                }`}
              >
                {processing ? "Menyimpan..." : "Simpan Verifikasi"}
              </button>

              {data.status === "need_revision" && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                  Status <b>need_revision</b> akan memblokir “Finalize Verify” sampai user memperbaiki indikator ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  count,
  isOpen,
  onToggle,
}: {
  title: string;
  subtitle: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button onClick={onToggle} className="flex w-full items-start justify-between gap-4 p-5 text-left">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Pill>Items: {count}</Pill>
          <span className="text-sm text-gray-500">{isOpen ? "Hide" : "Show"}</span>
        </div>
      </button>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className="mt-1 text-sm text-gray-900">{String(value)}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-600">
      {text}
    </div>
  );
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${className || "border-gray-200 bg-gray-50 text-gray-700"}`}>
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    submitted: "bg-yellow-100 text-yellow-800",
    verified: "bg-blue-100 text-blue-800",
    published: "bg-green-100 text-green-800",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>
      {String(status).toUpperCase()}
    </span>
  );
}

function applyFilters(items: ResponseRow[], query: string, filter: "all" | "unverified" | VerificationStatus) {
  const q = query.trim().toLowerCase();

  return items.filter((r) => {
    if (filter === "unverified") {
      if (r.verification) return false;
    } else if (filter !== "all") {
      if (!r.verification || r.verification.status !== filter) return false;
    }

    if (!q) return true;

    const hay = [
      r.indicator?.code,
      r.indicator?.title,
      r.cooperation?.title,
      r.cooperation?.partner_name,
      r.cooperation?.type,
      r.justification,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(q);
  });
}

function labelStatus(s: VerificationStatus) {
  if (s === "accepted") return "Accepted";
  if (s === "adjusted") return "Adjusted";
  return "Need revision";
}

function pillByStatus(s: VerificationStatus) {
  if (s === "accepted") return "border-green-200 bg-green-50 text-green-700";
  if (s === "adjusted") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-yellow-200 bg-yellow-50 text-yellow-800";
}

function truncate(s: string, n: number) {
  if (!s) return s;
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + "…";
}
