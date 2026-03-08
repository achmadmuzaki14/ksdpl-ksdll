import { useForm, Link } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { IBreadcrumbItem } from "@/types/shared/navigation";

export default function Create({ assessment }) {
  const { data, setData, post, processing, errors } = useForm({
    title: "",
    partner_name: "",
    type: "",
    start_date: "",
    end_date: "",
  });

  const submit = (e) => {
    e.preventDefault();
    post(route("cooperations.store", assessment.id));
  };

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
      title: "Tambah Cooperation",
      href: "#",
    },
  ];

  const topActions = (
    <Link
      href={route("assessments.show", assessment.id)}
      className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
    >
      ← Kembali
    </Link>
  );

  return (
    <AppLayout
      title="Tambah Cooperation"
      description="Tambahkan kerja sama baru pada assessment ini."
      breadcrumbs={breadcrumbs}
      topActions={topActions}
    >
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <form onSubmit={submit} className="space-y-5">

            {/* TITLE */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Judul Kerja Sama
              </label>

              <input
                type="text"
                placeholder="Contoh: Kerja Sama Pengelolaan Hutan"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={data.title}
                onChange={(e) => setData("title", e.target.value)}
              />

              {errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title}</p>
              )}
            </div>

            {/* PARTNER */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nama Mitra
              </label>

              <input
                type="text"
                placeholder="Contoh: Belanda, Jerman, Prancis"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={data.partner_name}
                onChange={(e) =>
                  setData("partner_name", e.target.value)
                }
              />

              {errors.partner_name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.partner_name}
                </p>
              )}
            </div>

            {/* TYPE */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipe Kerja Sama
              </label>

              <select
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={data.type}
                onChange={(e) => setData("type", e.target.value)}
              >
                <option value="">Pilih tipe kerja sama</option>
                <option value="KSDPL">KSDPL</option>
                <option value="KSDLL_PENERUSAN">KSDLL Penerusan</option>
                <option value="KSDLL_BARU">KSDLL Baru</option>
              </select>

              {errors.type && (
                <p className="mt-1 text-xs text-red-600">{errors.type}</p>
              )}
            </div>

            {/* DATE RANGE */}
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tanggal Mulai
                </label>

                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={data.start_date}
                  onChange={(e) =>
                    setData("start_date", e.target.value)
                  }
                />

                {errors.start_date && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.start_date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tanggal Selesai
                </label>

                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={data.end_date}
                  onChange={(e) =>
                    setData("end_date", e.target.value)
                  }
                />

                {errors.end_date && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.end_date}
                  </p>
                )}
              </div>

            </div>

            {/* ACTION */}
            <div className="flex justify-end gap-3 pt-3">

              <Link
                href={route("assessments.show", assessment.id)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Batal
              </Link>

              <button
                type="submit"
                disabled={processing}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
              >
                {processing ? "Menyimpan..." : "Simpan Cooperation"}
              </button>

            </div>

          </form>

        </div>
      </div>
    </AppLayout>
  );
}
