<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('responses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('assessment_id')
                ->constrained('assessments')
                ->cascadeOnDelete();

            // null untuk Dimensi 1; terisi untuk Dimensi 2–4 (per kerja sama)
            $table->foreignId('cooperation_id')
                ->nullable()
                ->constrained('cooperations')
                ->nullOnDelete();

            $table->foreignId('indicator_definition_id')
                ->constrained('indicator_definitions')
                ->cascadeOnDelete();

            // Self-assessment
            $table->unsignedTinyInteger('score_self')->nullable(); // 1..4, null jika N/A
            $table->boolean('is_not_applicable')->default(false);

            $table->longText('justification')->nullable();

            // bukti digital (link folder drive, url dokumen, dsb)
            $table->json('evidence_links')->nullable(); // array string

            // status pengisian indikator (opsional untuk UX)
            $table->boolean('is_complete')->default(false)->index();

            $table->timestamps();

            /**
             * Unique: dalam satu assessment, untuk indikator tertentu,
             * hanya boleh ada satu response pada konteks cooperation yang sama.
             * - Dimensi 1 => cooperation_id null
             */
            $table->unique(
                ['assessment_id', 'cooperation_id', 'indicator_definition_id'],
                'uniq_response_assessment_coop_indicator'
            );

            $table->index(['assessment_id', 'cooperation_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('responses');
    }
};
