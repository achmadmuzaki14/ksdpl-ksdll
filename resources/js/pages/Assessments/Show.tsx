import { Link, router } from "@inertiajs/react";
import React, { useMemo } from "react";
import AppLayout from "@/layouts/app-layout";
import { ROUTES } from "@/common/routes";
import { IBreadcrumbItem } from "@/types/shared/navigation";

const breadcrumbs: IBreadcrumbItem[] = [
  { title: "Dashboard", href: route(ROUTES.ADMIN.DASHBOARD) },
  { title: "Assessments", href: route(ROUTES.ADMIN.ASSESSMENTS.INDEX) },
];

type CoopCategory =
  | "Foundational"
  | "Progressing"
  | "Effective"
  | "Transformative"
  | null;

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
    status: "draft" | "submitted" | "verified" | "published";
  };

  analytics?: {
    readiness?: {
      score: number | null;
      category: CoopCategory;
    };

    maturity?: {
      score: number | null;
      category: CoopCategory;
      dimension_2_converted_score: number | null;
      dimension_3_converted_score: number | null;
      dimension_4_converted_score: number | null;
    };

    cooperations_count?: number;

    cooperation_distribution?: Record<string, number>;
  };

  cooperations?: CoopRow[];

  permissions?: {
    can_submit?: boolean;
    can_verify?: boolean;
    can_publish?: boolean;
    can_edit?: boolean;
    can_review?: boolean;
  };
};

const CATEGORY_ORDER = [
  "Foundational",
  "Progressing",
  "Effective",
  "Transformative",
] as const;

export default function AssessmentShow({
  assessment,
  analytics = {},
  cooperations = [],
  permissions,
}: Props) {

  /*
  |--------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------
  */

  const handleSubmit = () => {
    router.post(route("assessments.submit", assessment.id));
  };

  const handleVerify = () => {
    router.post(route("assessments.verify", assessment.id));
  };

  const handlePublish = () => {
    router.post(route("assessments.publish", assessment.id));
  };

  /*
  |--------------------------------------------------------------------------
  | Distribution
  |--------------------------------------------------------------------------
  */

  const dist = useMemo(() => {

    const base: Record<(typeof CATEGORY_ORDER)[number], number> = {
      Foundational: 0,
      Progressing: 0,
      Effective: 0,
      Transformative: 0,
    };

    if (analytics?.cooperation_distribution) {

      CATEGORY_ORDER.forEach((k) => {
        base[k] = Number(
          analytics.cooperation_distribution?.[k] ?? 0
        );
      });

      return base;
    }

    (cooperations ?? []).forEach((c) => {

      if (!c.category) return;

      base[c.category]++;

    });

    return base;

  }, [analytics?.cooperation_distribution, cooperations]);

  const totalDist = Object.values(dist).reduce(
    (a, b) => a + b,
    0
  );

  const readiness = analytics?.readiness ?? {
    score: null,
    category: null,
  };

  const maturity = analytics?.maturity ?? {
    score: null,
    category: null,
    dimension_2_converted_score: null,
    dimension_3_converted_score: null,
    dimension_4_converted_score: null,
  };

  const cooperationsCount =
    analytics?.cooperations_count ?? cooperations.length;

  return (
    <AppLayout breadcrumbs={breadcrumbs} title="Assessments">
      <div className="min-h-screen bg-gray-50">

        {/* HEADER */}

        <div className="sticky top-0 border-b bg-white">
          <div className="mx-auto max-w-6xl px-6 py-5 flex justify-between items-center">

            <div>

              <div className="flex items-center gap-3">

                <h1 className="text-2xl font-semibold">
                  Assessment {assessment.year}
                </h1>

                <StatusBadge status={assessment.status} />

              </div>

              <p className="text-sm text-gray-500">
                {assessment.province ?? "-"} • {assessment.regency_city ?? "-"}
              </p>

            </div>

            <div className="flex gap-3">
              <Link
                  href={route("assessments.dimension1", assessment.id)}
                  className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Dimensi 1
              </Link>

              {permissions?.can_edit && (
                <Link
                  href={route("cooperations.create", assessment.id)}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white"
                >
                  Tambah Cooperation
                </Link>
              )}

              {permissions?.can_submit && (
                <button
                  onClick={handleSubmit}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white"
                >
                  Submit
                </button>
              )}

              {permissions?.can_verify && (
                <button
                  onClick={handleVerify}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white"
                >
                  Verify
                </button>
              )}

              {permissions?.can_publish && (
                <button
                  onClick={handlePublish}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm text-white"
                >
                  Publish
                </button>
              )}

            </div>

          </div>
        </div>

        {/* CONTENT */}

        <div className="mx-auto max-w-6xl space-y-10 px-6 py-8">

          {/* METRICS */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <MetricCard
              title="Readiness Score"
              value={formatScore(readiness.score)}
              subtitle={readiness.category ?? "—"}
            />

            <MetricCard
              title="Maturity Score"
              value={formatScore(maturity.score)}
              subtitle={maturity.category ?? "—"}
            />

            <MetricCard
              title="Total Cooperation"
              value={cooperationsCount}
              subtitle="tercatat"
            />

          </div>

          {/* DIMENSIONS */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <DimCard
              label="Dimensi 2"
              value={maturity.dimension_2_converted_score}
              hint="Prosedur"
            />

            <DimCard
              label="Dimensi 3"
              value={maturity.dimension_3_converted_score}
              hint="Pelaksanaan"
            />

            <DimCard
              label="Dimensi 4"
              value={maturity.dimension_4_converted_score}
              hint="Manfaat"
            />

          </div>

          {/* DISTRIBUTION */}

          <div className="rounded-2xl border bg-white p-6">

            <h2 className="text-lg font-semibold">
              Distribusi Kategori Cooperation
            </h2>

            <div className="mt-5 space-y-3">

              {CATEGORY_ORDER.map((label) => {

                const value = dist[label];

                const percent =
                  totalDist === 0
                    ? 0
                    : Math.round((value / totalDist) * 100);

                return (

                  <div key={label}>

                    <div className="flex justify-between text-sm mb-1">

                      <CategoryPill text={label} />

                      <span>{value}</span>

                    </div>

                    <div className="h-2 bg-gray-200 rounded">

                      <div
                        className="h-2 bg-gray-900 rounded"
                        style={{ width: `${percent}%` }}
                      />

                    </div>

                  </div>

                );
              })}

            </div>

          </div>

          {/* COOPERATIONS TABLE */}

          <div className="overflow-hidden rounded-2xl border bg-white">

            <div className="border-b p-5">
              <h2 className="font-semibold">
                Daftar Cooperation
              </h2>
            </div>

            <table className="w-full text-sm">

              <thead className="bg-gray-50">

                <tr>

                  <th className="p-4 text-left">
                    Judul
                  </th>

                  <th className="p-4 text-left">
                    Mitra
                  </th>

                  <th className="p-4 text-left">
                    Tipe
                  </th>

                  <th className="p-4 text-left">
                    Skor
                  </th>

                  <th className="p-4 text-left">
                    Kategori
                  </th>

                  <th className="p-4 text-right">
                    Aksi
                  </th>

                </tr>

              </thead>

              <tbody>

                {(cooperations ?? []).map((c) => (

                  <tr key={c.id} className="border-t">

                    <td className="p-4 font-medium">
                      {c.title}
                    </td>

                    <td className="p-4">
                      {c.partner_name}
                    </td>

                    <td className="p-4">
                      {c.type}
                    </td>

                    <td className="p-4">
                      {formatScore(c.maturity_score)}
                    </td>

                    <td className="p-4">
                      <CategoryPill text={c.category ?? "—"} />
                    </td>

                    <td className="p-4 text-right">

                      <Link
                        href={route("cooperations.show", {
                          assessment: assessment.id,
                          cooperation: c.id,
                        })}
                        className="font-medium hover:underline"
                      >
                        Buka →
                      </Link>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
      </div>
    </AppLayout>
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENTS
|--------------------------------------------------------------------------
*/

function MetricCard({ title, value, subtitle }: any) {
  return (
    <div className="rounded-2xl bg-gray-900 p-5 text-white">
      <p className="text-xs text-gray-400">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {

  const map: Record<string,string> = {
    draft: "bg-gray-100 text-gray-700",
    submitted: "bg-yellow-100 text-yellow-800",
    verified: "bg-blue-100 text-blue-800",
    published: "bg-green-100 text-green-800",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs ${map[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}

function DimCard({ label, value, hint }: any) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-semibold mt-2">{formatScore(value)}</p>
      <p className="text-xs text-gray-500 mt-1">{hint}</p>
    </div>
  );
}

function CategoryPill({ text }: any) {

  const map: any = {
    Foundational: "bg-gray-100 text-gray-700",
    Progressing: "bg-yellow-100 text-yellow-800",
    Effective: "bg-blue-100 text-blue-800",
    Transformative: "bg-green-100 text-green-800",
    "—": "bg-gray-50 text-gray-500",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs ${map[text] ?? map["—"]}`}>
      {text}
    </span>
  );
}

function formatScore(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return Number(v).toFixed(2);
}
