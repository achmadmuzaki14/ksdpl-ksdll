<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Assessment extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment (SAFE-ish)
    |--------------------------------------------------------------------------
    | Jika kamu ingin lebih aman: hapus 'status', 'submitted_at', 'verified_at',
    | 'published_at' dari $fillable dan hanya ubah via submit/verify/publish().
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
    | Query helpers
    |--------------------------------------------------------------------------
    */

    public function dimension1Responses()
    {
        return $this->responses()
            ->whereNull('cooperation_id')
            ->with(['indicator', 'verification']) // untuk admin review
            ->orderBy('indicator_definition_id');
    }

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

    public function canEdit(): bool
    {
        // sesuai keputusan kamu: edit hanya saat draft
        return $this->isDraft();
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
     * Assessment dianggap siap diverifikasi jika:
     * - status assessment = submitted
     * - semua responses punya record verification
     * - tidak ada verification berstatus need_revision
     */
    public function canBeVerified(): bool
    {
        if (!$this->isSubmitted()) {
            return false;
        }

        // kalau belum ada response sama sekali, tidak bisa
        if (!$this->responses()->exists()) {
            return false;
        }

        // ada response yang belum diverifikasi?
        if ($this->responses()->doesntHave('verification')->exists()) {
            return false;
        }

        // ada yang need_revision?
        if (
            $this->responses()
                ->whereHas('verification', fn ($q) => $q->where('status', 'need_revision'))
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
     * Coverage verifikasi admin (semua dimensi & cooperation)
     * - total responses
     * - verified_count = punya verification
     * - need_revision_count
     */
    public function verificationCoverage(): array
    {
        $total = $this->responses()->count();

        $verifiedCount = $this->responses()->has('verification')->count();

        $needRevisionCount = $this->responses()
            ->whereHas('verification', fn ($q) => $q->where('status', 'need_revision'))
            ->count();

        return [
            'total' => $total,
            'verified_count' => $verifiedCount,
            'need_revision_count' => $needRevisionCount,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Analytics (Assessment level)
    |--------------------------------------------------------------------------
    | Catatan: controller sebaiknya load cooperations agar tidak N+1.
    */

    public function overallMaturityScore(): ?float
    {
        $scores = $this->cooperations
            ->map(fn ($c) => $c->maturityScore())
            ->filter(fn ($v) => $v !== null);

        if ($scores->isEmpty()) {
            return null;
        }

        return round($scores->avg(), 2);
    }

    public function overallMaturityCategory(): ?string
    {
        $score = $this->overallMaturityScore();
        if ($score === null) return null;

        if ($score < 50) return 'Foundational';
        if ($score < 70) return 'Progressing';
        if ($score < 85) return 'Effective';
        return 'Transformative';
    }

    public function maturityDistribution(): array
    {
        $base = [
            'Foundational' => 0,
            'Progressing' => 0,
            'Effective' => 0,
            'Transformative' => 0,
        ];

        $cats = $this->cooperations
            ->map(fn ($c) => $c->maturityCategory())
            ->filter();

        foreach ($cats as $cat) {
            if (isset($base[$cat])) $base[$cat]++;
        }

        return $base;
    }
}
