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
        Schema::create('verifications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('response_id')
                ->constrained('responses')
                ->cascadeOnDelete()
                ->unique(); // 1 response maksimal 1 verification record

            // Opsional jika pakai auth user (admin/verifier)
            $table->foreignId('verifier_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->unsignedTinyInteger('score_verified')->nullable(); // 1..4, null jika tetap self
            $table->longText('verifier_note')->nullable();
            $table->string('status')->default('accepted')->index(); // VerificationStatus

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verifications');
    }
};
