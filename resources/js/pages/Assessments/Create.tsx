import { useForm } from "@inertiajs/react";

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
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-4">
        Buat Assessment Baru
      </h1>

      <form onSubmit={submit} className="space-y-4">
        <input
          type="text"
          placeholder="Provinsi"
          value={data.province}
          onChange={(e) => setData("province", e.target.value)}
          className="border p-2 w-full"
        />
        {errors.province && <div className="text-red-500">{errors.province}</div>}

        <input
          type="text"
          placeholder="Kab/Kota"
          value={data.regency_city}
          onChange={(e) => setData("regency_city", e.target.value)}
          className="border p-2 w-full"
        />

        <input
          type="number"
          value={data.year}
          onChange={(e) => setData("year", Number(e.target.value))}
          className="border p-2 w-full"
        />

        <button
          type="submit"
          disabled={processing}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Simpan
        </button>
      </form>
    </div>
  );
}
