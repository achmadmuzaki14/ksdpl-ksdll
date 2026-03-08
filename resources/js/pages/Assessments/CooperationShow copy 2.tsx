import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "@inertiajs/react";

type VerificationStatus = "accepted" | "adjusted" | "need_revision";

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
}: Props) {
  const revisionCount = useMemo(() => {
    return [...dimension2, ...dimension3, ...dimension4].filter(
      (r) => r.verification?.status === "need_revision"
    ).length;
  }, [dimension2, dimension3, dimension4]);

  const metaLine = [
    cooperation.partner_name,
    cooperation.type,
    assessment.status?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
              Assessment {assessment.year}
            </p>

            <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
              {cooperation.title}
            </h1>

            <p className="mt-2 text-sm text-gray-500">{metaLine}</p>

            {(cooperation.partner_country || cooperation.partner_city) && (
              <p className="mt-1 text-sm text-gray-500">
                {[cooperation.partner_city, cooperation.partner_country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}

            {revisionCount > 0 && (
              <div className="mt-4 inline-flex rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-800">
                Ada <span className="mx-1 font-semibold">{revisionCount}</span>
                indikator yang perlu revisi.
              </div>
            )}

            {cooperation.type === "KSDLL_PENERUSAN" && (
              <div className="mt-2 text-xs text-gray-500">
                Catatan: beberapa indikator Dimensi 2 tidak berlaku untuk tipe
                KSDLL Penerusan.
              </div>
            )}
          </div>

          <div className="grid w-full grid-cols-2 gap-4 md:w-auto md:grid-cols-4">
            <ScoreCard title="Dim 2" score={analytics.dimension2_score} />
            <ScoreCard title="Dim 3" score={analytics.dimension3_score} />
            <ScoreCard title="Dim 4" score={analytics.dimension4_score} />
            <ScoreCard
              title="Maturity"
              score={analytics.maturity_score}
              categoryOverride={analytics.maturity_category ?? undefined}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        <SummaryStrip
          totalResponses={dimension2.length + dimension3.length + dimension4.length}
          completedResponses={
            dimension2.filter((r) => r.is_complete).length +
            dimension3.filter((r) => r.is_complete).length +
            dimension4.filter((r) => r.is_complete).length
          }
          revisionCount={revisionCount}
        />

        <DimensionSection
          title="Dimensi 2 – Kesesuaian Prosedur"
          responses={dimension2}
        />

        <DimensionSection
          title="Dimensi 3 – Pelaksanaan Kerja Sama"
          responses={dimension3}
        />

        <DimensionSection
          title="Dimensi 4 – Manfaat Kerja Sama"
          responses={dimension4}
        />
      </div>
    </div>
  );
}

function SummaryStrip({
  totalResponses,
  completedResponses,
  revisionCount,
}: {
  totalResponses: number;
  completedResponses: number;
  revisionCount: number;
}) {
  const progress =
    totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Ringkasan Pengisian
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {completedResponses} dari {totalResponses} indikator telah diisi.
            {revisionCount > 0 && (
              <span className="ml-1 text-yellow-700">
                {revisionCount} indikator perlu tindak lanjut.
              </span>
            )}
          </p>
        </div>

        <div className="w-full md:max-w-xs">
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-gray-900 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
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
    <div className="min-w-[120px] rounded-2xl bg-gray-900 p-4 text-white shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>

      <p className="mt-1 text-2xl font-bold">
        {validScore ? score.toFixed(2) : "-"}
      </p>

      <div className="mt-3 h-1.5 rounded-full bg-gray-700">
        <div
          className="h-1.5 rounded-full bg-white transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {validScore && (
        <CategoryBadge score={score} categoryOverride={categoryOverride} />
      )}
    </div>
  );
}

function CategoryBadge({
  score,
  categoryOverride,
}: {
  score: number;
  categoryOverride?: string;
}) {
  const getCategory = () => {
    if (categoryOverride) return categoryOverride;
    if (score >= 85) return "Transformative";
    if (score >= 70) return "Effective";
    if (score >= 50) return "Progressing";
    return "Foundational";
  };

  return <p className="mt-2 text-xs text-gray-400">{getCategory()}</p>;
}

function DimensionSection({
  title,
  responses,
}: {
  title: string;
  responses: Response[];
}) {
  const [open, setOpen] = useState(true);

  const completed = responses.filter((r) => r.is_complete).length;
  const progress =
    responses.length > 0 ? Math.round((completed / responses.length) * 100) : 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-xs text-gray-500">
            {completed} / {responses.length} indikator selesai
          </p>

          <div className="mt-3 h-2 w-full max-w-sm rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-gray-900 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <span className="pt-1 text-xl text-gray-400">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-6 space-y-6">
          {responses.length > 0 ? (
            responses.map((response) => (
              <IndicatorCard key={response.id} response={response} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
              Belum ada indikator pada bagian ini.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function IndicatorCard({ response }: { response: Response }) {
  const { data, setData, patch, processing, errors } = useForm({
    score_self: response.score_self ?? "",
    justification: response.justification ?? "",
  });

  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(false);

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

    const timeout = setTimeout(() => {
      setSaving(true);

      patch(route("responses.update", response.id), {
        preserveScroll: true,
        preserveState: true,
        onFinish: () => setSaving(false),
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [data.score_self, data.justification]);

  return (
    <div
      className={`space-y-4 rounded-2xl border p-6 shadow-sm transition-colors ${
        needsRevision
          ? "border-yellow-300 bg-yellow-50/60"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-medium text-gray-900">
            {response.indicator?.code ?? "-"} – {response.indicator?.title ?? "-"}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {response.is_not_applicable && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              N/A
            </span>
          )}

          {verification && <VerificationBadge status={verification.status} />}
        </div>
      </div>

      {verification?.verifier_note && (
        <div
          className={`rounded-xl border p-3 text-sm ${
            needsRevision
              ? "border-yellow-200 bg-yellow-50 text-yellow-900"
              : "border-gray-200 bg-gray-50 text-gray-700"
          }`}
        >
          <div className="font-medium">Catatan Admin</div>
          <div className="mt-1 whitespace-pre-wrap">
            {verification.verifier_note}
          </div>
        </div>
      )}

      {isAdjusted && verification?.score_verified !== null && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Admin menyesuaikan skor akhir menjadi{" "}
          <span className="font-semibold">{verification.score_verified}</span>.
        </div>
      )}

      {isAccepted && !response.can_edit && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Indikator ini sudah diterima admin.
        </div>
      )}

      {!response.is_not_applicable && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-100"
              value={data.score_self}
              disabled={!response.can_edit}
              onChange={(e) =>
                setData(
                  "score_self",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            >
              <option value="">Skor</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            {(saving || processing) && (
              <span className="animate-pulse text-xs text-gray-400">
                Saving...
              </span>
            )}
          </div>

          {errors.score_self && (
            <p className="text-xs text-red-600">{errors.score_self}</p>
          )}

          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-100"
            rows={4}
            placeholder="Tambahkan justifikasi..."
            disabled={!response.can_edit}
            value={data.justification}
            onChange={(e) => setData("justification", e.target.value)}
          />

          {errors.justification && (
            <p className="text-xs text-red-600">{errors.justification}</p>
          )}
        </>
      )}
    </div>
  );
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
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${colorMap[status]}`}
    >
      {labelMap[status]}
    </span>
  );
}
