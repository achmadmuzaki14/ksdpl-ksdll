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
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Basic Identity
            |--------------------------------------------------------------------------
            */

            $table->string('province');
            $table->string('regency_city')->nullable();
            $table->unsignedSmallInteger('year')->index();

            /*
            |--------------------------------------------------------------------------
            | User Tracking (Multi-user Ready)
            |--------------------------------------------------------------------------
            */

            $table->foreignId('created_by')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('submitted_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Workflow State Machine
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'draft',
                'submitted',
                'verified',
                'published'
            ])->default('draft')->index();

            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('published_at')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Optional Public Access
            |--------------------------------------------------------------------------
            */

            $table->string('public_token', 64)
                ->nullable()
                ->unique();

            /*
            |--------------------------------------------------------------------------
            | Data Integrity
            |--------------------------------------------------------------------------
            */

            $table->unique(['province', 'regency_city', 'year']);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};
