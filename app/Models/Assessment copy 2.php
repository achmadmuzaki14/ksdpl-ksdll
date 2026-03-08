<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Assessment extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    */
    protected $fillable = [
        'province',
        'regency_city',
        'year',

        'submitter_name',
        'submitter_position',
        'submitter_unit',

        'status',
        'submitted_at',
        'verified_at',
        'published_at',

        'public_token',

        'created_by',
        'submitted_by',
        'verified_by',
    ];

    /*
    |--------------------------------------------------------------------------
    | Casting
    |--------------------------------------------------------------------------
    */
    protected $casts = [
        'year' => 'integer',
        'submitted_at' => 'datetime',
        'verified_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'draft',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */
    public function cooperations()
    {
        return $this->hasMany(Cooperation::class);
    }

    public function responses()
    {
        return $this->hasMany(Response::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Query helpers (untuk halaman)
    |--------------------------------------------------------------------------
    */

    /**
     * DIMENSI 1: response tanpa cooperation_id (global assessment).
     */
    public function dimension1Responses()
    {
        return $this->responses()
            ->whereNull('cooperation_id')
            ->with(['indicator', 'verification'])
            ->orderBy('indicator_definition_id');
    }

    /**
     * Semua responses berdasarkan dimensi (termasuk dimensi 1,2,3,4).
     */
    public function dimensionResponses(int $dimension)
    {
        return $this->responses()
            ->whereHas('indicator', fn ($q) => $q->where('dimension', $dimension))
            ->with(['indicator', 'verification'])
            ->orderBy('indicator_definition_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Workflow State
    |--------------------------------------------------------------------------
    */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    public function isVerified(): bool
    {
        return $this->status === 'verified';
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    /**
     * Edit assessment-level metadata hanya saat draft.
     * Jangan gunakan method ini untuk menentukan editable/tidaknya response.
     */
    public function canEditMetadata(): bool
    {
        return $this->isDraft();
    }

    /**
     * Apakah assessment punya response yang sedang perlu revisi.
     */
    public function hasRevisionRequests(): bool
    {
        return $this->responses()
            ->whereHas('verification', fn ($q) => $q->where('status', Verification::STATUS_NEED_REVISION))
            ->exists();
    }

    /**
     * Apakah ada response yang bisa diedit owner saat ini.
     */
    public function hasEditableResponses(): bool
    {
        if ($this->isDraft()) {
            return $this->responses()->exists();
        }

        if ($this->isSubmitted()) {
            return $this->responses()
                ->whereHas('verification', fn ($q) => $q->where('status', Verification::STATUS_NEED_REVISION))
                ->exists();
        }

        return false;
    }

    /**
     * Admin boleh membuka halaman review pada assessment yang sudah disubmit
     * dan tetap boleh melihat hasil review ketika sudah verified/published.
     */
    public function canBeReviewedByAdmin(): bool
    {
        return in_array($this->status, ['submitted', 'verified', 'published'], true);
    }

    /*
    |--------------------------------------------------------------------------
    | Submit / Verify / Publish
    |--------------------------------------------------------------------------
    */
    public function submit(int $userId): void
    {
        if (!$this->isDraft()) {
            throw new \RuntimeException('Assessment must be in draft state.');
        }

        $this->forceFill([
            'status' => 'submitted',
            'submitted_at' => now(),
            'submitted_by' => $userId,
        ])->save();
    }

    /**
     * Assessment siap diverifikasi jika:
     * - status = submitted
     * - ada responses
     * - semua responses punya verification
     * - tidak ada verification berstatus need_revision
     */
    public function canBeVerified(): bool
    {
        if (!$this->isSubmitted()) {
            return false;
        }

        if (!$this->responses()->exists()) {
            return false;
        }

        if ($this->responses()->doesntHave('verification')->exists()) {
            return false;
        }

        if (
            $this->responses()
                ->whereHas('verification', fn ($q) => $q->where('status', Verification::STATUS_NEED_REVISION))
                ->exists()
        ) {
            return false;
        }

        return true;
    }

    public function verify(int $userId): void
    {
        if (!$this->canBeVerified()) {
            throw new \RuntimeException(
                'Assessment cannot be verified. Some indicators are unverified or need revision.'
            );
        }

        $this->forceFill([
            'status' => 'verified',
            'verified_at' => now(),
            'verified_by' => $userId,
        ])->save();
    }

    public function publish(): void
    {
        if (!$this->isVerified()) {
            throw new \RuntimeException('Assessment must be verified first.');
        }

        $this->forceFill([
            'status' => 'published',
            'published_at' => now(),
        ])->save();
    }

    /*
    |--------------------------------------------------------------------------
    | Progress helpers (untuk UI)
    |--------------------------------------------------------------------------
    */
    public function dimension1Progress(): array
    {
        $total = $this->responses()
            ->whereNull('cooperation_id')
            ->count();

        if ($total === 0) {
            return ['completed' => 0, 'total' => 0];
        }

        $completed = $this->responses()
            ->whereNull('cooperation_id')
            ->where(function ($q) {
                $q->where('is_not_applicable', true)
                    ->orWhereNotNull('score_self');
            })
            ->count();

        return ['completed' => $completed, 'total' => $total];
    }

    /**
     * Coverage verifikasi admin (semua dimensi & cooperation).
     */
    public function verificationCoverage(): array
    {
        $total = $this->responses()->count();

        $verifiedCount = $this->responses()->has('verification')->count();

        $needRevisionCount = $this->responses()
            ->whereHas('verification', fn ($q) => $q->where('status', Verification::STATUS_NEED_REVISION))
            ->count();

        return [
            'total' => $total,
            'verified_count' => $verifiedCount,
            'need_revision_count' => $needRevisionCount,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | SCORING
    |--------------------------------------------------------------------------
    */

    /**
     * Avg skor DIMENSI 1 (global assessment).
     * Hanya indikator applicable (is_not_applicable=false).
     */
    public function dimension1AvgScore(): ?float
    {
        $responses = $this->responses()
            ->whereNull('cooperation_id')
            ->whereHas('indicator', fn ($q) => $q->where('dimension', 1))
            ->where('is_not_applicable', false)
            ->with('verification')
            ->get();

        if ($responses->isEmpty()) {
            return null;
        }

        $scores = $responses
            ->map(fn ($r) => $r->effectiveScore())
            ->filter(fn ($v) => $v !== null);

        if ($scores->isEmpty()) {
            return null;
        }

        return round($scores->avg(), 2);
    }

    public function dimension1ConvertedScore(): ?float
    {
        $avg = $this->dimension1AvgScore();

        return $avg === null ? null : round($avg * 25, 2);
    }

    /**
     * Agregasi dimensi 2/3/4 di level assessment:
     * ambil nilai konversi dari setiap cooperation, lalu dirata-ratakan.
     */
    public function averageConvertedScoreForDimension(int $dimension): ?float
    {
        if (!in_array($dimension, [2, 3, 4], true)) {
            throw new \InvalidArgumentException('Dimension must be 2, 3, or 4.');
        }

        $coops = $this->relationLoaded('cooperations')
            ? $this->cooperations
            : $this->cooperations()->get();

        if ($coops->isEmpty()) {
            return null;
        }

        $vals = $coops
            ->map(fn ($c) => $c->convertedScore($dimension))
            ->filter(fn ($v) => $v !== null);

        if ($vals->isEmpty()) {
            return null;
        }

        return round($vals->avg(), 2);
    }

    public function dimension2ConvertedScore(): ?float
    {
        return $this->averageConvertedScoreForDimension(2);
    }

    public function dimension3ConvertedScore(): ?float
    {
        return $this->averageConvertedScoreForDimension(3);
    }

    public function dimension4ConvertedScore(): ?float
    {
        return $this->averageConvertedScoreForDimension(4);
    }

    /**
     * Skor akhir assessment:
     * (D1 + D2 + D3 + D4) / 4
     */
    public function overallScore(): ?float
    {
        $d1 = $this->dimension1ConvertedScore();
        $d2 = $this->dimension2ConvertedScore();
        $d3 = $this->dimension3ConvertedScore();
        $d4 = $this->dimension4ConvertedScore();

        if ($d1 === null || $d2 === null || $d3 === null || $d4 === null) {
            return null;
        }

        return round((($d1 + $d2 + $d3 + $d4) / 4), 2);
    }

    public function overallCategory(): ?string
    {
        $score = $this->overallScore();

        if ($score === null) {
            return null;
        }

        if ($score >= 85) return 'Advanced';
        if ($score >= 70) return 'Developed';
        if ($score >= 50) return 'Emerging';

        return 'Early Stage';
    }

    /**
     * Distribusi kategori cooperation.
     */
    public function cooperationCategoryDistribution(): array
    {
        $base = [
            'Early Stage' => 0,
            'Emerging' => 0,
            'Developed' => 0,
            'Advanced' => 0,
        ];

        $coops = $this->relationLoaded('cooperations')
            ? $this->cooperations
            : $this->cooperations()->get();

        foreach ($coops as $c) {
            $score = $c->maturityScore();
            if ($score === null) {
                continue;
            }

            $cat = $this->categoryFromScore($score);
            $base[$cat] = ($base[$cat] ?? 0) + 1;
        }

        return $base;
    }

    /**
     * Helper: kategori dari skor skala 0-100.
     */
    private function categoryFromScore(float $score): string
    {
        if ($score >= 85) return 'Advanced';
        if ($score >= 70) return 'Developed';
        if ($score >= 50) return 'Emerging';

        return 'Early Stage';
    }
}
