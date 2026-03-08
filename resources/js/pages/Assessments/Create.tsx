import { useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { IBreadcrumbItem } from "@/types/shared/navigation";
import { ROUTES } from "@/common/routes";

const breadcrumbs: IBreadcrumbItem[] = [
  { title: "Dashboard", href: route(ROUTES.ADMIN.DASHBOARD) },
  { title: "Assessments", href: route(ROUTES.ADMIN.ASSESSMENTS.INDEX) },
  { title: "Create", href: "#" },
];

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    province: "",
    regency_city: "",
    year: new Date().getFullYear(),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route("assessments.store"));
  };

  return (
    <AppLayout
      title="Buat Assessment Baru"
      breadcrumbs={breadcrumbs}
      description="Buat assessment kerja sama KSDPL / KSDLL baru."
    >
      <div className="max-w-xl p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <form onSubmit={submit} className="space-y-5">

            {/* Province */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Provinsi
              </label>
              <input
                type="text"
                value={data.province}
                onChange={(e) => setData("province", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Contoh: Jawa Barat"
              />
              {errors.province && (
                <p className="text-sm text-red-500 mt-1">{errors.province}</p>
              )}
            </div>

            {/* Regency */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Kabupaten / Kota
              </label>
              <input
                type="text"
                value={data.regency_city}
                onChange={(e) => setData("regency_city", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Contoh: Kota Bandung"
              />
              {errors.regency_city && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.regency_city}
                </p>
              )}
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tahun Assessment
              </label>
              <input
                type="number"
                value={data.year}
                onChange={(e) => setData("year", Number(e.target.value))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              {errors.year && (
                <p className="text-sm text-red-500 mt-1">{errors.year}</p>
              )}
            </div>

            {/* Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={processing}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Simpan Assessment
              </button>
            </div>

          </form>
        </div>
      </div>
    </AppLayout>
  );
}
