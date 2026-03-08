import React, { useMemo } from "react";
import { Link, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { IBreadcrumbItem } from "@/types/shared/navigation";

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

interface ResponseRow {
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
  responses: ResponseRow[];
  can_edit?: boolean;
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
  const canEditAny = permissions?.can_edit_any_response ?? can_edit ?? false;

  const completed = useMemo(() => {
    return responses.filter(
      (r) => r.is_not_applicable || r.score_self !== null
    ).length;
  }, [responses]);

  const total = responses.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const averageScore = useMemo(() => {
    const valid = responses.filter(
      (r) => !r.is_not_applicable && r.score_self !== null
    );

    if (valid.length === 0) return null;

    const sum = valid.reduce((acc, r) => acc + (r.score_self ?? 0), 0);
    const avg = sum / valid.length;

    const percent = (avg / 4) * 100;

    return percent.toFixed(2);
  }, [responses]);

  const revisionCount = useMemo(() => {
    return responses.filter(
      (r) => r.verification?.status === "need_revision"
    ).length;
  }, [responses]);

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
      title: "Dimensi 1",
      href: "#",
    },
  ];

  const topActions = (
    <Link
      href={route("assessments.show", assessment.id)}
      className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
    >
      ← Kembali ke Assessment
    </Link>
  );

  return (
    <AppLayout
      title="Dimensi 1 – Kesiapan Pengelolaan"
      description={`Assessment ${assessment.year}`}
      breadcrumbs={breadcrumbs}
      topActions={topActions}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={assessment.status} />
                <StatusPill>Assessment {assessment.year}</StatusPill>
                {canEditAny && (
                  <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Dapat diedit
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
                Dimensi 1 – Kesiapan Pengelolaan
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Lengkapi indikator pada dimensi ini sesuai kondisi assessment.
              </p>

              {!canEditAny && (
                <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-700">
                  Assessment dalam status <b>{assessment.status}</b>. Data tidak
                  dapat diedit.
                </div>
              )}

              {revisionCount > 0 && (
                <div className="mt-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                  Ada <b>{revisionCount}</b> indikator yang memerlukan revisi
                  dari admin.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 lg:w-[320px]">
              <StatCard title="Total" value={String(total)} />
              <StatCard title="Selesai" value={String(completed)} />
              <StatCard title="Progress" value={`${percent}%`} />
              <StatCard title="Rata-rata" value={averageScore ?? "-"} />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Ringkasan Pengisian
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {completed} dari {total} indikator telah diisi.
                {revisionCount > 0 && (
                  <span className="ml-1 font-medium text-yellow-700">
                    {revisionCount} indikator perlu tindak lanjut.
                  </span>
                )}
              </p>
            </div>

            <div className="w-full lg:max-w-sm">
              <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{percent}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-200">
                <div
                  className="h-2.5 rounded-full bg-gray-900 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-5">
          {responses.length > 0 ? (
            responses.map((response) => (
              <IndicatorCard key={response.id} response={response} />
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500 shadow-sm">
              Belum ada indikator pada dimensi ini.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function IndicatorCard({ response }: { response: ResponseRow }) {
  const initialScore =
    typeof response.score_self === "number" ? response.score_self : "";

  const { data, setData, patch, processing, errors } = useForm<{
    score_self: number | "";
    justification: string;
  }>({
    score_self: initialScore,
    justification: response.justification ?? "",
  });

  const verification = response.verification;
  const needsRevision = verification?.status === "need_revision";
  const isAdjusted = verification?.status === "adjusted";
  const isAccepted = verification?.status === "accepted";

  const submit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    patch(route("responses.update", response.id), {
      preserveScroll: true,
      preserveState: true,
    });
  };

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
                  setData(
                    "score_self",
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
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

          {response.can_edit && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={submit}
                disabled={processing}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
              >
                {processing ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
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
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colorMap[status]}`}>
      {labelMap[status]}
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
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        map[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {status.toUpperCase()}
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

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-gray-900 p-4 text-white shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
