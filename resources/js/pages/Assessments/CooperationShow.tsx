import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { IBreadcrumbItem } from "@/types/shared/navigation";

type VerificationStatus = "accepted" | "adjusted" | "need_revision";
type FilterMode = "all" | "revision" | "incomplete" | "complete";

interface Indicator {
  id: number;
  dimension: number;
  code: string;
  title: string;
}

interface VerificationLite {
  id: number;
  status: VerificationStatus;
  score_verified: number | null;
  verifier_note: string | null;
  updated_at?: string | null;
}

interface Response {
  id: number;
  cooperation_id?: number | null;
  score_self: number | null;
  justification: string | null;
  evidence_links?: string[] | string | null;
  is_not_applicable: boolean;
  is_complete?: boolean;
  can_edit: boolean;
  indicator: Indicator | null;
  verification?: VerificationLite | null;
}

interface Props {
  assessment: {
    id: number;
    year: number;
    status: string;
  };

  cooperation: {
    id: number;
    title: string;
    partner_name: string;
    type: string;
    partner_country?: string | null;
    partner_city?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  };

  dimension2: Response[];
  dimension3: Response[];
  dimension4: Response[];

  analytics: {
    dimension2_score: number | null;
    dimension3_score: number | null;
    dimension4_score: number | null;
    maturity_score: number | null;
    maturity_category: string | null;
  };

  permissions?: {
    can_edit?: boolean;
  };
}

export default function CooperationShow({
  assessment,
  cooperation,
  dimension2,
  dimension3,
  dimension4,
  analytics,
  permissions,
}: Props) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const allResponses = useMemo(
    () => [...dimension2, ...dimension3, ...dimension4],
    [dimension2, dimension3, dimension4]
  );

  const revisionCount = useMemo(() => {
    return allResponses.filter((r) => r.verification?.status === "need_revision").length;
  }, [allResponses]);

  const completedResponses = useMemo(() => {
    return allResponses.filter((r) => r.is_complete).length;
  }, [allResponses]);

  const incompleteResponses = allResponses.length - completedResponses;

  const metaLine = [
    cooperation.partner_name,
    cooperation.type,
    assessment.status?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(" • ");

  const breadcrumbs: IBreadcrumbItem[] = [
    {
      title: "Assessments",
      href: route("assessments.index"),
    },
    {
      title: `Assessment ${assessment.year}`,
      href: route("assessments.show", assessment.id),
    },
    {
      title: cooperation.title,
      href: "#",
    },
  ];

  const topActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={route("assessments.show", assessment.id)}
        className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        ← Kembali ke Assessment
      </Link>
    </div>
  );

  return (
    <AppLayout
      title={cooperation.title}
      breadcrumbs={breadcrumbs}
      description={metaLine}
      topActions={topActions}
    >
      <div className="space-y-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusPill>{assessment.status?.toUpperCase()}</StatusPill>
                <StatusPill>{cooperation.type}</StatusPill>
                <StatusPill>Assessment {assessment.year}</StatusPill>
                {permissions?.can_edit && (
                  <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Dapat diedit
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
                {cooperation.title}
              </h1>

              <p className="mt-2 text-sm font-medium text-gray-700">
                {cooperation.partner_name}
              </p>

              {(cooperation.partner_country || cooperation.partner_city) && (
                <p className="mt-1 text-sm text-gray-500">
                  {[cooperation.partner_city, cooperation.partner_country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}

              {(cooperation.start_date || cooperation.end_date) && (
                <p className="mt-1 text-sm text-gray-500">
                  Periode: {formatDate(cooperation.start_date)} – {formatDate(cooperation.end_date)}
                </p>
              )}

              {revisionCount > 0 && (
                <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                  <span className="font-semibold">Perlu perhatian:</span> ada {revisionCount} indikator
                  yang memerlukan revisi berdasarkan catatan admin.
                </div>
              )}

              {cooperation.type === "KSDLL_PENERUSAN" && (
                <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  Catatan: beberapa indikator pada Dimensi 2 tidak berlaku untuk tipe KSDLL Penerusan.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 xl:w-[430px]">
              <ScoreCard title="Dimensi 2" score={analytics.dimension2_score} />
              <ScoreCard title="Dimensi 3" score={analytics.dimension3_score} />
              <ScoreCard title="Dimensi 4" score={analytics.dimension4_score} />
              <ScoreCard
                title="Maturity"
                score={analytics.maturity_score}
                categoryOverride={analytics.maturity_category ?? undefined}
              />
            </div>
          </div>
        </section>

        <StickyToolbar
          totalResponses={allResponses.length}
          completedResponses={completedResponses}
          revisionCount={revisionCount}
          incompleteResponses={incompleteResponses}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
        />

        <QuickNav />

        <DimensionSection
          id="dim2"
          title="Dimensi 2 – Kesesuaian Prosedur"
          responses={dimension2}
          filterMode={filterMode}
        />

        <DimensionSection
          id="dim3"
          title="Dimensi 3 – Pelaksanaan Kerja Sama"
          responses={dimension3}
          filterMode={filterMode}
        />

        <DimensionSection
          id="dim4"
          title="Dimensi 4 – Manfaat Kerja Sama"
          responses={dimension4}
          filterMode={filterMode}
        />
      </div>
    </AppLayout>
  );
}

function StickyToolbar({
  totalResponses,
  completedResponses,
  revisionCount,
  incompleteResponses,
  filterMode,
  setFilterMode,
}: {
  totalResponses: number;
  completedResponses: number;
  revisionCount: number;
  incompleteResponses: number;
  filterMode: FilterMode;
  setFilterMode: (value: FilterMode) => void;
}) {
  const progress =
    totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;

  const filters: { key: FilterMode; label: string; count?: number }[] = [
    { key: "all", label: "Semua", count: totalResponses },
    { key: "revision", label: "Perlu Revisi", count: revisionCount },
    { key: "incomplete", label: "Belum Lengkap", count: incompleteResponses },
    { key: "complete", label: "Selesai", count: completedResponses },
  ];

  return (
    <section className="sticky top-4 z-[5] space-y-4 rounded-3xl border border-gray-200 bg-white/95 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Ringkasan Pengisian</h2>
          <p className="mt-1 text-sm text-gray-600">
            {completedResponses} dari {totalResponses} indikator telah diisi.
            {revisionCount > 0 && (
              <span className="ml-1 font-medium text-yellow-700">
                {revisionCount} indikator perlu revisi.
              </span>
            )}
          </p>
        </div>

        <div className="w-full lg:max-w-sm">
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-200">
            <div
              className="h-2.5 rounded-full bg-gray-900 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = filterMode === filter.key;

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setFilterMode(filter.key)}
              className={[
                "inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium transition",
                active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              {filter.label}
              {typeof filter.count === "number" && (
                <span
                  className={[
                    "ml-2 rounded-full px-2 py-0.5 text-xs",
                    active ? "bg-white/15 text-white" : "bg-gray-100 text-gray-600",
                  ].join(" ")}
                >
                  {filter.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function QuickNav() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <a
          href="#dim2"
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Dimensi 2
        </a>
        <a
          href="#dim3"
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Dimensi 3
        </a>
        <a
          href="#dim4"
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Dimensi 4
        </a>
      </div>
    </section>
  );
}

function DimensionSection({
  id,
  title,
  responses,
  filterMode,
}: {
  id: string;
  title: string;
  responses: Response[];
  filterMode: FilterMode;
}) {
  const [open, setOpen] = useState(true);

  const filteredResponses = useMemo(() => {
    return responses.filter((response) => {
      if (filterMode === "revision") {
        return response.verification?.status === "need_revision";
      }

      if (filterMode === "incomplete") {
        return !response.is_complete;
      }

      if (filterMode === "complete") {
        return !!response.is_complete;
      }

      return true;
    });
  }, [responses, filterMode]);

  const completed = responses.filter((r) => r.is_complete).length;
  const revisionCount = responses.filter(
    (r) => r.verification?.status === "need_revision"
  ).length;

  const progress =
    responses.length > 0 ? Math.round((completed / responses.length) * 100) : 0;

  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>

            {revisionCount > 0 && (
              <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">
                {revisionCount} revisi
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {completed} / {responses.length} indikator selesai
          </p>

          <div className="mt-3 h-2 w-full max-w-md rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-gray-900 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <span className="pt-1 text-2xl text-gray-400">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-6 space-y-5">
          {filteredResponses.length > 0 ? (
            filteredResponses.map((response) => (
              <IndicatorCard key={response.id} response={response} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
              Tidak ada indikator yang sesuai dengan filter saat ini.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function IndicatorCard({ response }: { response: Response }) {
  const initialScore =
    typeof response.score_self === "number" ? response.score_self : "";

  const { data, setData, patch, errors, processing } = useForm({
    score_self: initialScore as number | "",
    justification: response.justification ?? "",
  });

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const mountedRef = useRef(false);
  const savedTimeoutRef = useRef<number | null>(null);

  const verification = response.verification;
  const needsRevision = verification?.status === "need_revision";
  const isAdjusted = verification?.status === "adjusted";
  const isAccepted = verification?.status === "accepted";

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    if (!response.can_edit) return;

    setSaveState("saving");

    const timeout = window.setTimeout(() => {
      patch(route("responses.update", response.id), {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setSaveState("saved");

          if (savedTimeoutRef.current) {
            window.clearTimeout(savedTimeoutRef.current);
          }

          savedTimeoutRef.current = window.setTimeout(() => {
            setSaveState("idle");
          }, 1500);
        },
        onError: () => setSaveState("idle"),
      });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [data.score_self, data.justification, response.can_edit, patch, response.id]);

  const evidenceLinks = normalizeLinks(response.evidence_links);

  return (
    <article
      className={[
        "rounded-3xl border p-6 shadow-sm transition-colors",
        needsRevision ? "border-yellow-300 bg-yellow-50/60" : "border-gray-200 bg-white",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              {response.indicator?.code ?? "-"}
            </span>

            {response.is_not_applicable && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                N/A
              </span>
            )}

            {response.is_complete && (
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                Lengkap
              </span>
            )}

            {verification && <VerificationBadge status={verification.status} />}
          </div>

          <h3 className="mt-3 text-base font-semibold text-gray-900">
            {response.indicator?.title ?? "-"}
          </h3>
        </div>

        <SaveStatus saveState={saveState} processing={processing} canEdit={response.can_edit} />
      </div>

      {verification?.verifier_note && (
        <div
          className={[
            "mt-4 rounded-2xl border p-4 text-sm",
            needsRevision
              ? "border-yellow-200 bg-yellow-50 text-yellow-900"
              : "border-gray-200 bg-gray-50 text-gray-700",
          ].join(" ")}
        >
          <div className="font-semibold">Catatan Admin</div>
          <div className="mt-1 whitespace-pre-wrap">{verification.verifier_note}</div>
        </div>
      )}

      {isAdjusted && verification?.score_verified !== null && (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <div className="font-semibold">Penyesuaian oleh Admin</div>
          <div className="mt-1">
            Skor Anda: <span className="font-semibold">{response.score_self ?? "-"}</span>
            {" • "}
            Skor final admin: <span className="font-semibold">{verification.score_verified}</span>
          </div>
        </div>
      )}

      {isAccepted && !response.can_edit && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Indikator ini sudah diterima admin dan tidak dapat diedit lagi.
        </div>
      )}

      {!response.is_not_applicable && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Skor Self Assessment
              </label>
              <select
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-100"
                value={data.score_self}
                disabled={!response.can_edit}
                onChange={(e) =>
                  setData("score_self", e.target.value === "" ? "" : Number(e.target.value))
                }
              >
                <option value="">Pilih skor</option>
                <option value={1}>1 - Sangat Rendah</option>
                <option value={2}>2 - Rendah</option>
                <option value={3}>3 - Baik</option>
                <option value={4}>4 - Sangat Baik</option>
              </select>
              {errors.score_self && (
                <p className="mt-1 text-xs text-red-600">{errors.score_self}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Justifikasi
              </label>
              <textarea
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-100"
                rows={5}
                placeholder="Tambahkan justifikasi penilaian..."
                disabled={!response.can_edit}
                value={data.justification}
                onChange={(e) => setData("justification", e.target.value)}
              />
              {errors.justification && (
                <p className="mt-1 text-xs text-red-600">{errors.justification}</p>
              )}
            </div>
          </div>

          {evidenceLinks.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">Evidence Links</div>
              <div className="mt-2 flex flex-col gap-2">
                {evidenceLinks.map((link, index) => (
                  <a
                    key={`${link}-${index}`}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm text-blue-600 underline underline-offset-2 hover:text-blue-700"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function ScoreCard({
  title,
  score,
  categoryOverride,
}: {
  title: string;
  score: number | null;
  categoryOverride?: string;
}) {
  const validScore = typeof score === "number" && !Number.isNaN(score);
  const percentage = validScore ? Math.max(0, Math.min(score, 100)) : 0;

  return (
    <div className="rounded-3xl bg-gray-900 p-4 text-white shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-bold">{validScore ? score.toFixed(2) : "-"}</p>

      <div className="mt-4 h-1.5 rounded-full bg-gray-700">
        <div
          className="h-1.5 rounded-full bg-white transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {validScore && (
        <p className="mt-3 text-xs text-gray-300">
          {getCategoryLabel(score, categoryOverride)}
        </p>
      )}
    </div>
  );
}

function SaveStatus({
  saveState,
  processing,
  canEdit,
}: {
  saveState: "idle" | "saving" | "saved";
  processing: boolean;
  canEdit: boolean;
}) {
  if (!canEdit) return null;

  if (processing || saveState === "saving") {
    return <span className="text-xs font-medium text-gray-400">Menyimpan...</span>;
  }

  if (saveState === "saved") {
    return <span className="text-xs font-medium text-green-600">Tersimpan</span>;
  }

  return <span className="text-xs font-medium text-gray-400">Autosave aktif</span>;
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const colorMap: Record<VerificationStatus, string> = {
    accepted: "bg-green-100 text-green-700",
    adjusted: "bg-blue-100 text-blue-700",
    need_revision: "bg-yellow-100 text-yellow-800",
  };

  const labelMap: Record<VerificationStatus, string> = {
    accepted: "Accepted",
    adjusted: "Adjusted",
    need_revision: "Need Revision",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colorMap[status]}`}>
      {labelMap[status]}
    </span>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      {children}
    </span>
  );
}

function normalizeLinks(value?: string[] | string | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCategoryLabel(score: number, categoryOverride?: string) {
  if (categoryOverride) return categoryOverride;
  if (score >= 85) return "Transformative";
  if (score >= 70) return "Effective";
  if (score >= 50) return "Progressing";
  return "Foundational";
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
