<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indicator_definitions', function (Blueprint $table) {
            $table->id();

            // Dimensi 1–4
            $table->unsignedTinyInteger('dimension')->index();

            // Kode unik global: 1.1, 2.1, dst
            $table->string('code')->unique();

            $table->string('title');
            $table->text('description')->nullable();
            $table->longText('evidence_guidance')->nullable();

            /*
            |--------------------------------------------------------------------------
            | JSON Applicability Rules
            |--------------------------------------------------------------------------
            */
            $table->json('applicability_rules')->nullable();

            $table->boolean('is_active')->default(true)->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('indicator_definitions');
    }
};
