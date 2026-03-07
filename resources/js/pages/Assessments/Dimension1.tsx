import React, { useMemo } from "react";
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
  responses: Response[];
  can_edit?: boolean; // backward compatibility
  permissions?: {
    can_edit_any_response?: boolean;
    can_edit_assessment?: boolean;
  };
}

export default function Dimension1({
  assessment,
  responses,
  can_edit,
  permissions,
}: Props) {
  const completed = useMemo(() => {
    return responses.filter((r) => r.is_not_applicable || r.score_self !== null).length;
  }, [responses]);

  const total = responses.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const averageScore = useMemo(() => {
    const valid = responses.filter((r) => !r.is_not_applicable && r.score_self !== null);
    if (valid.length === 0) return null;

    const totalScore = valid.reduce((sum, r) => sum + (r.score_self ?? 0), 0);
    return (totalScore / valid.length).toFixed(2);
  }, [responses]);

  const canEditAny = permissions?.can_edit_any_response ?? can_edit ?? false;
  const revisionCount = responses.filter((r) => r.verification?.status === "need_revision").length;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Dimensi 1 – Kesiapan Pengelolaan</h1>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Tahun {assessment.year}</p>
          <StatusBadge status={assessment.status} />
        </div>

        {!canEditAny && (
          <div className="rounded-xl border border-gray-200 bg-gray-100 p-3 text-sm text-gray-700">
            Assessment dalam status <b>{assessment.status}</b>. Data tidak dapat diedit.
          </div>
        )}

        {revisionCount > 0 && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            Ada <b>{revisionCount}</b> indikator yang memerlukan revisi dari admin.
          </div>
        )}

        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span>
              Progress: {completed} / {total}
            </span>
            <span>{percent}%</span>
          </div>

          <div className="h-3 rounded bg-gray-200">
            <div
              className="h-3 rounded bg-black transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {averageScore && (
          <div className="text-sm text-gray-700">
            Rata-rata Skor: <span className="font-semibold">{averageScore}</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {responses.map((response) => (
          <IndicatorCard key={response.id} response={response} />
        ))}
      </div>
    </div>
  );
}

function IndicatorCard({ response }: { response: Response }) {
  const { data, setData, patch, processing, errors } = useForm({
    score_self: response.score_self ?? "",
    justification: response.justification ?? "",
  });

  const submit = () => {
    patch(route("responses.update", response.id), {
      preserveScroll: true,
    });
  };

  const verification = response.verification;
  const needsRevision = verification?.status === "need_revision";
  const isAdjusted = verification?.status === "adjusted";
  const isAccepted = verification?.status === "accepted";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-medium text-gray-900">
          {response.indicator.code} – {response.indicator.title}
        </h3>

        <div className="flex flex-wrap gap-2">
          {response.is_not_applicable && (
            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
              N/A
            </span>
          )}

          {verification && (
            <VerificationBadge status={verification.status} />
          )}
        </div>
      </div>

      {verification?.verifier_note && (
        <div
          className={`mt-4 rounded-xl border p-3 text-sm ${
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
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Admin menyesuaikan skor akhir menjadi <b>{verification.score_verified}</b>.
        </div>
      )}

      {isAccepted && !response.can_edit && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Indikator ini sudah diterima admin.
        </div>
      )}

      {!response.is_not_applicable && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Skor (1–4)</label>

            <select
              className="mt-1 w-32 rounded border border-gray-300 p-2 disabled:bg-gray-100"
              value={data.score_self}
              disabled={!response.can_edit}
              onChange={(e) =>
                setData(
                  "score_self",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            >
              <option value="">-- pilih --</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            {errors.score_self && (
              <p className="mt-1 text-xs text-red-600">{errors.score_self}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Justifikasi</label>

            <textarea
              className="mt-1 w-full rounded border border-gray-300 p-2 disabled:bg-gray-100"
              rows={3}
              disabled={!response.can_edit}
              value={data.justification}
              onChange={(e) => setData("justification", e.target.value)}
            />
          </div>

          {response.can_edit && (
            <button
              onClick={submit}
              disabled={processing}
              className="rounded bg-gray-900 px-4 py-2 text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {processing ? "Menyimpan..." : "Simpan"}
            </button>
          )}
        </div>
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
    <span className={`rounded px-3 py-1 text-xs font-medium ${map[status]}`}>
      {label[status]}
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
    <span
      className={`rounded px-3 py-1 text-xs font-medium ${
        map[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {status.toUpperCase()}
    </span>
  );
}
