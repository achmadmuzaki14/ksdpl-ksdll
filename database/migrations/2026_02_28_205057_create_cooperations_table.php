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
        Schema::create('cooperations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('assessment_id')
                ->constrained('assessments')
                ->cascadeOnDelete();

            $table->string('title');                // Judul/Nama kegiatan
            $table->string('partner_name');         // Nama mitra (kota/negara/lembaga)
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->string('type')->index(); // CooperationType: KSDPL|KSDLL|KSDLL_PENERUSAN

            // Opsional metadata
            $table->string('partner_country')->nullable();
            $table->string('partner_city')->nullable();

            $table->timestamps();

            // membantu mencegah duplikasi daftar kerja sama dalam satu assessment
            $table->unique(['assessment_id', 'title', 'partner_name'], 'uniq_coop_assessment_title_partner');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cooperations');
    }
};
