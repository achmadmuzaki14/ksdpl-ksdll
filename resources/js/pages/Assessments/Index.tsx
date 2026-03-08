import React, { useMemo, useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Link } from "@inertiajs/react";
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

type Status =
  | "draft"
  | "submitted"
  | "need_revision"
  | "verified"
  | "published";

type AssessmentRow = {
  id: number;
  year: number;
  province: string | null;
  regency_city: string | null;
  status: Status;
  overall_score: number | null;
  cooperations_count: number;
  dimension1_progress?: {
    completed: number;
    total: number;
  };
};

type Props = {
  assessments: AssessmentRow[];
  permissions: {
    is_admin: boolean;
  };
};

export default function AssessmentsIndex({
  assessments,
  permissions,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const isAdmin = permissions?.is_admin ?? false;

  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      const matchSearch =
        a.province?.toLowerCase().includes(search.toLowerCase()) ||
        a.regency_city?.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "" || a.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [assessments, search, statusFilter]);

  const stats = useMemo(() => {
    const base: Record<string, number> = {
      draft: 0,
      submitted: 0,
      need_revision: 0,
      verified: 0,
      published: 0,
    };

    assessments.forEach((a) => base[a.status]++);

    const scores = assessments
      .map((a) => a.overall_score)
      .filter((s) => s !== null) as number[];

    const avg =
      scores.length === 0
        ? null
        : scores.reduce((a, b) => a + b, 0) / scores.length;

    return { ...base, avg };
  }, [assessments]);

  return (
    <AppLayout breadcrumbs={breadcrumbs} title="Assessments">
      <div className="min-h-screen bg-gray-50">
        {/* HEADER */}
        <div className="border-b bg-white">
          <div className="mx-auto max-w-6xl py-5 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {isAdmin ? "Assessment Review" : "Assessments"}
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Monitoring Kerja Sama
              </p>
            </div>

            {/* {!isAdmin && ( */}
              <Link
                href={route("assessments.create")}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
              >
                + Assessment Baru
              </Link>
            {/* )} */}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Draft" value={stats.draft} />
            <StatCard label="Submitted" value={stats.submitted} />
            <StatCard label="Verified" value={stats.verified} />
            <StatCard label="Published" value={stats.published} />
            {/* <StatCard
              label="Avg Score"
              value={stats.avg ? stats.avg.toFixed(1) : "—"}
            /> */}
          </div>

          {/* FILTERS */}
          <div className="bg-white border rounded-xl p-4 flex gap-4">
            <input
              type="text"
              placeholder="Cari provinsi / kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded px-3 py-2 text-sm w-full"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="need_revision">Need Revision</option>
              <option value="verified">Verified</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* TABLE */}
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4 text-left">Year</th>
                  <th className="p-4 text-left">Province</th>
                  <th className="p-4 text-left">City</th>
                  <th className="p-4 text-left">Status</th>
                  {/* <th className="p-4 text-left">Score</th> */}
                  <th className="p-4 text-left">Cooperations</th>
                  {/* <th className="p-4 text-left">Progress</th> */}
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-4 font-medium">{a.year}</td>

                    <td className="p-4">{a.province ?? "-"}</td>

                    <td className="p-4">{a.regency_city ?? "-"}</td>

                    <td className="p-4">
                      <StatusBadge status={a.status} />
                    </td>

                    {/* <td className="p-4">
                      {formatScore(a.overall_score)}
                    </td> */}

                    <td className="p-4">{a.cooperations_count}</td>

                    {/* <td className="p-4">
                      {a.dimension1_progress ? (
                        <ProgressBar
                          completed={
                            a.dimension1_progress.completed
                          }
                          total={a.dimension1_progress.total}
                        />
                      ) : (
                        "-"
                      )}
                    </td> */}

                    <td className="p-4 text-right">
                      <Link
                        href={route("assessments.show", a.id)}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        Buka →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Tidak ada data.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
/* COMPONENTS */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    submitted: "bg-yellow-100 text-yellow-800",
    need_revision: "bg-red-100 text-red-700",
    verified: "bg-blue-100 text-blue-800",
    published: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`px-3 py-1 rounded text-xs font-medium ${
        map[status] ?? "bg-gray-100"
      }`}
    >
      {status.toUpperCase()}
    </span>
  );
}

function ProgressBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="w-24">
      <div className="text-xs text-gray-600 mb-1">
        {completed}/{total}
      </div>

      <div className="h-2 bg-gray-200 rounded">
        <div
          className="h-2 bg-gray-900 rounded"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatScore(v: number | null | undefined) {
  if (v === null || typeof v === "undefined") return "—";
  return Number(v).toFixed(1);
}
