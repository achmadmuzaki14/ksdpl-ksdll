import { Link, router } from "@inertiajs/react";
import React, { useMemo, useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { ROUTES } from "@/common/routes";
import { IBreadcrumbItem } from "@/types/shared/navigation";

const breadcrumbs: IBreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: route(ROUTES.ADMIN.DASHBOARD),
  },
  {
    title: "Assessments",
    href: route(ROUTES.ADMIN.ASSESSMENTS.INDEX),
  },
];

type CoopCategory = "Early Stage" | "Emerging" | "Developed" | "Advanced" | null;

type CoopRow = {
  id: number;
  title: string;
  partner_name: string;
  type: string;
  maturity_score: number | null;
  category: CoopCategory;
};

type Props = {
  assessment: {
    id: number;
    year: number;
    province?: string | null;
    regency_city?: string | null;
    status: "draft" | "submitted" | "verified" | "published" | string;
  };
  analytics: {
    dim1: number | null;
    dim2: number | null;
    dim3: number | null;
    dim4: number | null;
    overall_score: number | null;
    overall_category: "Early Stage" | "Emerging" | "Developed" | "Advanced" | null;
    cooperations_count: number;
    cooperation_distribution?: Record<string, number>;
    dimension1_progress?: { completed: number; total: number };
  };
  cooperations: CoopRow[];
  permissions?: {
    can_submit?: boolean;
    can_verify?: boolean;
    can_publish?: boolean;
    can_edit?: boolean; // assessment metadata / cooperation management (draft only)
    is_admin?: boolean;
    can_review?: boolean;
    has_editable_responses?: boolean;
    has_revision_requests?: boolean;
  };
};

const CATEGORY_ORDER = ["Early Stage", "Emerging", "Developed", "Advanced"] as const;

export default function AssessmentShow({
  assessment,
  analytics,
  cooperations,
  permissions,
}: Props) {
  const handleSubmit = () => {
    router.post(route("assessments.submit", assessment.id), {}, { preserveScroll: true });
  };

  const handleVerify = () => {
    router.post(route("assessments.verify", assessment.id), {}, { preserveScroll: true });
  };

  const handlePublish = () => {
    router.post(route("assessments.publish", assessment.id), {}, { preserveScroll: true });
  };

  const dist = useMemo(() => {
    const base: Record<(typeof CATEGORY_ORDER)[number], number> = {
      "Early Stage": 0,
      Emerging: 0,
      Developed: 0,
      Advanced: 0,
    };

    if (analytics.cooperation_distribution) {
      for (const k of CATEGORY_ORDER) {
        base[k] = Number(analytics.cooperation_distribution[k] ?? 0);
      }
      return base;
    }

    for (const c of cooperations) {
      if (!c.category) continue;
      if (c.category in base) base[c.category as keyof typeof base] += 1;
    }

    return base;
  }, [analytics.cooperation_distribution, cooperations]);

  const totalDist = useMemo(
    () => Object.values(dist).reduce((a, b) => a + (Number(b) || 0), 0),
    [dist]
  );

  const d1p = analytics.dimension1_progress;

  const canOpenDimension1 = !!permissions?.has_editable_responses || assessment.status !== "draft";
  const showDimension1Cta = !!permissions?.has_editable_responses || assessment.status !== "draft";
  const showAddCooperation = !!permissions?.can_edit;
  const showAdminReview = !!permissions?.can_review;
  const hasRevisionRequests = !!permissions?.has_revision_requests;

  return (
    <AppLayout breadcrumbs={breadcrumbs} title="Assessments">
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6 py-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Assessment {assessment.year}
                  </h1>
                  <StatusBadge status={assessment.status} />
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  {assessment.province ?? "-"} • {assessment.regency_city ?? "-"}
                </p>

                {d1p && (
                  <p className="mt-2 text-xs text-gray-500">
                    Progress Dimensi 1:{" "}
                    <span className="font-medium text-gray-800">
                      {d1p.completed}/{d1p.total}
                    </span>
                  </p>
                )}

                {hasRevisionRequests && (
                  <div className="mt-3 inline-flex rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                    Ada indikator yang perlu revisi dari admin.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {showDimension1Cta && (
                  <Link
                    href={route("assessments.dimension1", assessment.id)}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
                  >
                    {permissions?.has_editable_responses ? "Buka / Edit Dimensi 1" : "Lihat Dimensi 1"}
                  </Link>
                )}

                {showAddCooperation && (
                  <Link
                    href={route("cooperations.create", assessment.id)}
                    className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
                  >
                    Tambah Cooperation
                  </Link>
                )}

                {showAdminReview && (
                  <Link
                    href={route("admin.assessments.review", assessment.id)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
                  >
                    Admin Review
                  </Link>
                )}

                {permissions?.can_submit && (
                  <button
                    onClick={handleSubmit}
                    className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
                  >
                    Submit
                  </button>
                )}

                {permissions?.can_verify && (
                  <button
                    onClick={handleVerify}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
                  >
                    Verify
                  </button>
                )}

                {permissions?.can_publish && (
                  <button
                    onClick={handlePublish}
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl space-y-10 px-6 py-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetricCard
              title="Overall Score"
              value={formatScore(analytics.overall_score)}
              subtitle={analytics.overall_category ?? "—"}
            />
            <MetricCard
              title="Total Cooperation"
              value={analytics.cooperations_count ?? 0}
              subtitle="tercatat"
            />
            <MetricCard
              title="Status Workflow"
              value={String(assessment.status).toUpperCase()}
              subtitle="assessment"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <DimCard label="Dimensi 1" value={analytics.dim1} hint="Kesiapan (global)" />
            <DimCard label="Dimensi 2" value={analytics.dim2} hint="Prosedur (avg cooperation)" />
            <DimCard label="Dimensi 3" value={analytics.dim3} hint="Pelaksanaan (avg cooperation)" />
            <DimCard label="Dimensi 4" value={analytics.dim4} hint="Manfaat (avg cooperation)" />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-gray-900">Distribusi Kategori Cooperation</h2>
              <p className="text-sm text-gray-500">
                Kategori mengikuti ambang: Early Stage / Emerging / Developed / Advanced.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {CATEGORY_ORDER.map((label) => {
                const value = Number(dist[label] ?? 0);
                const percent = totalDist === 0 ? 0 : Math.round((value / totalDist) * 100);

                return (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CategoryPill text={label} />
                        <span className="text-gray-600">{percent}%</span>
                      </div>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                    <div className="h-2 rounded bg-gray-200">
                      <div className="h-2 rounded bg-gray-900" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {totalDist === 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Belum ada cooperation atau belum ada skor dimensi 2–4.
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-1 border-b border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900">Daftar Cooperation</h2>
              <p className="text-sm text-gray-500">Skor cooperation dihitung dari rata-rata Dimensi 2–4.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-4 text-left">Judul</th>
                    <th className="p-4 text-left">Mitra</th>
                    <th className="p-4 text-left">Tipe</th>
                    <th className="p-4 text-left">Skor</th>
                    <th className="p-4 text-left">Kategori</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {cooperations.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="p-4 font-medium text-gray-900">{c.title}</td>
                      <td className="p-4 text-gray-700">{c.partner_name}</td>
                      <td className="p-4 text-gray-700">{c.type}</td>
                      <td className="p-4 text-gray-900">{formatScore(c.maturity_score)}</td>
                      <td className="p-4">
                        <CategoryPill text={c.category ?? "—"} />
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={route("cooperations.show", {
                            assessment: assessment.id,
                            cooperation: c.id,
                          })}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          Buka →
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {cooperations.length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-gray-500" colSpan={6}>
                        Belum ada cooperation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Catatan: Overall score dihitung dari rata-rata nilai konversi Dimensi 1–4. Jika ada dimensi
            yang belum memiliki nilai, overall akan tampil “—”.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: any; subtitle: string }) {
  return (
    <div className="rounded-2xl bg-gray-900 p-5 text-white shadow-sm">
      <p className="text-xs text-gray-400">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value ?? "—"}</p>
      <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

function DimCard({ label, value, hint }: { label: string; value: number | null; hint: string }) {
  const pct = value === null ? null : Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{formatScore(value)}</p>
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        </div>
        {value !== null && <CategoryPill text={categoryFromScore(value)} />}
      </div>

      <div className="mt-4 h-2 rounded bg-gray-200">
        <div className="h-2 rounded bg-gray-900" style={{ width: `${pct ?? 0}%` }} />
      </div>
    </div>
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        map[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {String(status).toUpperCase()}
    </span>
  );
}

function CategoryPill({ text }: { text: string }) {
  const map: Record<string, string> = {
    "Early Stage": "bg-gray-100 text-gray-700",
    Emerging: "bg-yellow-100 text-yellow-800",
    Developed: "bg-blue-100 text-blue-800",
    Advanced: "bg-green-100 text-green-800",
    "—": "bg-gray-50 text-gray-500 border border-gray-200",
  };

  const cls = map[text] ?? "bg-gray-50 text-gray-500 border border-gray-200";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}

function formatScore(v: number | null | undefined) {
  if (v === null || typeof v === "undefined") return "—";
  if (Number.isNaN(Number(v))) return "—";
  return Number(v).toFixed(2);
}

function categoryFromScore(score: number) {
  if (score >= 85) return "Advanced";
  if (score >= 70) return "Developed";
  if (score >= 50) return "Emerging";
  return "Early Stage";
}
