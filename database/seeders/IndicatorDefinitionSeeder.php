<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\IndicatorDefinition;

class IndicatorDefinitionSeeder extends Seeder
{
    public function run(): void
    {
        $add = function (
            int $dimension,
            string $code,
            string $title,
            ?string $description = null,
            ?string $evidenceGuidance = null,
            ?array $applicabilityRules = null
        ) {
            IndicatorDefinition::updateOrCreate(
                ['code' => $code],
                [
                    'dimension' => $dimension,
                    'title' => $title,
                    'description' => $description,
                    'evidence_guidance' => $evidenceGuidance,
                    'applicability_rules' => $applicabilityRules,
                    'is_active' => true,
                ]
            );
        };

        /*
        |--------------------------------------------------------------------------
        | DIMENSI 1 (1.1–1.8)
        |--------------------------------------------------------------------------
        */

        $add(1, '1.1', 'Unit kerja yang menangani dan bertanggung jawab atas pengelolaan kerja sama luar negeri tersedia dan ditetapkan secara formal');
        $add(1, '1.2', 'Pengelola yang menangani kerja sama luar negeri tersedia dan memadai');
        $add(1, '1.3', 'Pengelola kerja sama luar negeri memiliki kemampuan bahasa asing yang memadai');
        $add(1, '1.4', 'Pengelola kerja sama luar negeri telah mengikuti pelatihan komunikasi publik, negosiasi, dan tata kelola kerja sama luar negeri');
        $add(1, '1.5', 'Prosedur perencanaan kerja sama luar negeri tersedia dan dijalankan');
        $add(1, '1.6', 'Kerja sama luar negeri diposisikan sebagai bagian dari strategi dan arah kebijakan pembangunan daerah dan tercermin dalam dokumen perencanaan daerah');
        $add(1, '1.7', 'Pemerintah daerah menyediakan alokasi anggaran yang memadai dan proporsional untuk mendukung inisiasi dan pengelolaan kerja sama luar negeri');
        $add(1, '1.8', 'Komitmen kepala daerah terhadap kerja sama luar negeri tercermin secara konsisten dalam kebijakan, arahan, dan dukungan strategis yang diberikan');

        /*
        |--------------------------------------------------------------------------
        | DIMENSI 2 (2.1–2.6)
        |--------------------------------------------------------------------------
        | 2.1–2.3 tidak berlaku untuk KSDLL_PENERUSAN
        */

        $naForPenerusan = [
            'not_applicable_for' => ['KSDLL_PENERUSAN'],
            'reason' => 'Indikator ini tidak berlaku untuk KSDLL Penerusan.',
        ];

        $add(2, '2.1', 'Identifikasi kebutuhan/peluang dan penetapan calon mitra dilakukan secara sistematis', null, null, $naForPenerusan);
        $add(2, '2.2', 'Konsultasi awal kepada Kemendagri telah dilakukan', null, null, $naForPenerusan);
        $add(2, '2.3', 'Persetujuan DPRD terhadap rencana kerja sama diperoleh sesuai ketentuan', null, null, $naForPenerusan);

        $add(2, '2.4', 'Dokumen permohonan persetujuan kerja sama disusun lengkap sesuai ketentuan');
        $add(2, '2.5', 'Pemerintah daerah memperoleh persetujuan kerja sama dari Kemendagri sesuai ketentuan sebelum penandatanganan naskah kerja sama');
        $add(2, '2.6', 'Penandatanganan Naskah Kerja Sama dilakukan sesuai ketentuan');

        /*
        |--------------------------------------------------------------------------
        | DIMENSI 3 (3.1–3.9)
        |--------------------------------------------------------------------------
        */

        $add(3, '3.1', 'Pelaksanaan kegiatan kerja sama sesuai naskah kerja sama dan ruang lingkup yang disetujui');
        $add(3, '3.2', 'Perangkat daerah teknis/pelaksana kerja sama berperan aktif dalam pelaksanaan kegiatan kerja sama');
        $add(3, '3.3', 'Pemerintah daerah mengalokasikan anggaran untuk pelaksanaan kegiatan kerja sama');
        $add(3, '3.4', 'Aktor non-pemerintah terlibat secara substantif dalam pelaksanaan kerja sama luar negeri');
        $add(3, '3.5', 'Pengelolaan pelaksanaan memperhatikan tata kelola risiko, keamanan, dan integritas kegiatan kerja sama luar negeri');
        $add(3, '3.6', 'Pemerintah daerah melakukan koordinasi dengan pemerintah pusat dalam pelaksanaan kerja sama luar negeri');
        $add(3, '3.7', 'Pemerintah daerah melaksanakan monitoring dan evaluasi atas pelaksanaan kerja sama secara berkala dan terdokumentasi');
        $add(3, '3.8', 'Pemerintah daerah menyampaikan laporan pelaksanaan kerja sama kepada Kemendagri sesuai ketentuan');
        $add(3, '3.9', 'Pemerintah daerah mengelola dan mempublikasikan pengetahuan serta pembelajaran dari pelaksanaan kerja sama');

        /*
        |--------------------------------------------------------------------------
        | DIMENSI 4 (4.1–4.3)
        |--------------------------------------------------------------------------
        */

        $add(4, '4.1', 'Kerja sama menghasilkan peningkatan kapasitas, pengetahuan, atau praktik kerja perangkat daerah');
        $add(4, '4.2', 'Kerja sama memberikan manfaat nyata bagi masyarakat atau kelompok sasaran');
        $add(4, '4.3', 'Kerja sama menunjukkan keberlanjutan, perluasan, atau menghasilkan peluang strategis baru');
    }
}
