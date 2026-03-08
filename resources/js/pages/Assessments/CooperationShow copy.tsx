import React, { useEffect, useRef, useState } from "react";
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
  score_self: number | null;
  justification: string | null;
  is_not_applicable: boolean;
  is_complete?: boolean;
  can_edit: boolean;
  indicator: Indicator;
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
  };
  dimension2: Response[];
  dimension3: Response[];
  dimension4: Response[];
  dimension2_score: number | null;
  dimension3_score: number | null;
  dimension4_score: number | null;
  maturity_score?: number | null;
  maturity_category?: string | null;
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
  dimension2_score,
  dimension3_score,
  dimension4_score,
  maturity_score,
  maturity_category,
}: Props) {
  const revisionCount =
    [...dimension2, ...dimension3, ...dimension4].filter(
      (r) => r.verification?.status === "need_revision"
    ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-6">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 md:flex-row">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{cooperation.title}</h1>
            <p className="text-sm text-gray-500">
              {cooperation.partner_name} • {cooperation.type} • {assessment.status.toUpperCase()}
            </p>

            {revisionCount > 0 && (
              <div className="mt-3 inline-flex rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                Ada <b className="mx-1">{revisionCount}</b> indikator yang perlu revisi.
              </div>
            )}
          </div>

          <div className="grid w-full grid-cols-2 gap-4 md:w-auto md:grid-cols-4">
            <ScoreCard title="Dim 2" score={dimension2_score} />
            <ScoreCard title="Dim 3" score={dimension3_score} />
            <ScoreCard title="Dim 4" score={dimension4_score} />
            <ScoreCard title="Maturity" score={maturity_score ?? null} categoryOverride={maturity_category ?? undefined} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-12 p-8">
        <DimensionSection title="Dimensi 2 – Kesesuaian Prosedur" responses={dimension2} />
        <DimensionSection title="Dimensi 3 – Pelaksanaan Kerja Sama" responses={dimension3} />
        <DimensionSection title="Dimensi 4 – Manfaat Kerja Sama" responses={dimension4} />
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
  const percentage = score ?? 0;

  return (
    <div className="min-w-[110px] rounded-xl bg-gray-900 p-4 text-white">
      <p className="text-xs text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{score !== null ? Number(score).toFixed(2) : "-"}</p>

      <div className="mt-2 h-1 rounded bg-gray-700">
        <div
          className="h-1 rounded bg-white transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {score !== null && (
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
    if (score < 50) return "Foundational";
    if (score < 70) return "Progressing";
    if (score < 85) return "Effective";
    return "Transformative";
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

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className="mb-6 flex cursor-pointer items-center justify-between"
      >
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <span className="text-gray-400">{open ? "−" : "+"}</span>
      </div>

      {open && (
        <div className="space-y-6 transition-all duration-300">
          {responses.map((response) => (
            <IndicatorCard key={response.id} response={response} />
          ))}

          {responses.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
              Belum ada indikator pada bagian ini.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IndicatorCard({ response }: { response: Response }) {
  const { data, setData, patch, processing, errors } = useForm({
    score_self: response.score_self ?? "",
    justification: response.justification ?? "",
  });

  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(false);

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
        onFinish: () => setSaving(false),
      });
    }, 800);

    return () => clearTimeout(timeout);
  }, [data.score_self, data.justification]);

  const verification = response.verification;
  const needsRevision = verification?.status === "need_revision";
  const isAdjusted = verification?.status === "adjusted";
  const isAccepted = verification?.status === "accepted";

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap justify-between gap-3">
        <h3 className="font-medium text-gray-900">
          {response.indicator.code} – {response.indicator.title}
        </h3>

        <div className="flex flex-wrap gap-2">
          {response.is_not_applicable && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
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
          <div className="mt-1 whitespace-pre-wrap">{verification.verifier_note}</div>
        </div>
      )}

      {isAdjusted && verification?.score_verified !== null && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Admin menyesuaikan skor akhir menjadi <b>{verification.score_verified}</b>.
        </div>
      )}

      {isAccepted && !response.can_edit && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Indikator ini sudah diterima admin.
        </div>
      )}

      {!response.is_not_applicable && (
        <>
          <div className="flex items-center gap-6">
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-gray-400 disabled:bg-gray-100"
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
              <span className="animate-pulse text-xs text-gray-400">Saving...</span>
            )}
          </div>

          {errors.score_self && (
            <p className="text-xs text-red-600">{errors.score_self}</p>
          )}

          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-gray-400 disabled:bg-gray-100"
            rows={3}
            placeholder="Tambahkan justifikasi..."
            disabled={!response.can_edit}
            value={data.justification}
            onChange={(e) => setData("justification", e.target.value)}
          />
        </>
      )}
    </div>
  );
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const map: Record<VerificationStatus, string> = {
    accepted: "bg-green-100 text-green-700",
    adjusted: "bg-blue-100 text-blue-700",
    need_revision: "bg-yellow-100 text-yellow-800",
  };

  const label: Record<VerificationStatus, string> = {
    accepted: "Accepted",
    adjusted: "Adjusted",
    need_revision: "Need Revision",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${map[status]}`}>
      {label[status]}
    </span>
  );
}
