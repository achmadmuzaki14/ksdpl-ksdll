import { useForm } from "@inertiajs/react";

export default function Create({ assessment }) {
  const { data, setData, post, processing, errors } = useForm({
    title: "",
    partner_name: "",
    type: "",
  });

  const submit = (e) => {
    e.preventDefault();

    post(route("cooperations.store", assessment.id));
  };

  return (
    <div className="mx-auto max-w-xl p-8 space-y-6">
      <h1 className="text-2xl font-semibold">
        Tambah Cooperation
      </h1>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">
            Judul
          </label>
          <input
            className="mt-1 w-full rounded border p-2"
            value={data.title}
            onChange={(e) =>
              setData("title", e.target.value)
            }
          />
          {errors.title && (
            <p className="text-sm text-red-500">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">
            Mitra
          </label>
          <input
            className="mt-1 w-full rounded border p-2"
            value={data.partner_name}
            onChange={(e) =>
              setData("partner_name", e.target.value)
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Tipe
          </label>
          <select
            className="mt-1 w-full rounded border p-2"
            value={data.type}
            onChange={(e) =>
              setData("type", e.target.value)
            }
          >
            <option value="">-- pilih --</option>
            <option value="KSDPL">KSDPL</option>
            <option value="KSDLL_PENERUSAN">
              KSDLL Penerusan
            </option>
            <option value="KSDLL_BARU">
              KSDLL Baru
            </option>
          </select>
        </div>

        <button
          disabled={processing}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Simpan
        </button>
      </form>
    </div>
  );
}
