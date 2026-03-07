<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Response extends Model
{
    use HasFactory;

    protected $fillable = [
        'assessment_id',
        'cooperation_id',
        'indicator_definition_id',
        'score_self',
        'is_not_applicable',
        'justification',
        'evidence_links',
        'is_complete',
    ];

    protected $casts = [
        'score_self' => 'integer',
        'is_not_applicable' => 'boolean',
        'is_complete' => 'boolean',
        'evidence_links' => 'array',
    ];

    /*
    |--------------------------------------------------------------------------
    | Optional guard: lock edit ketika assessment bukan draft
    |--------------------------------------------------------------------------
    */
    protected static function booted()
    {
        static::updating(function (Response $response) {
            // prevent user edit ketika assessment locked
            if ($response->relationLoaded('assessment')) {
                $assessment = $response->assessment;
            } else {
                $assessment = $response->assessment()->first();
            }

            if ($assessment && method_exists($assessment, 'canEdit') && !$assessment->canEdit()) {
                throw new \RuntimeException('Assessment is locked.');
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */
    public function assessment()
    {
        return $this->belongsTo(Assessment::class);
    }

    public function cooperation()
    {
        return $this->belongsTo(Cooperation::class);
    }

    public function indicator()
    {
        return $this->belongsTo(IndicatorDefinition::class, 'indicator_definition_id');
    }

    public function verification()
    {
        return $this->hasOne(Verification::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */
    public function isDimension1(): bool
    {
        return $this->cooperation_id === null;
    }

    /**
     * Sudah diisi user (untuk progress UI user)
     * - N/A dianggap selesai
     * - non N/A harus punya score_self
     */
    public function hasSelfScore(): bool
    {
        if ($this->is_not_applicable) return true;
        return $this->score_self !== null;
    }

    /**
     * Siap direview admin?
     * - N/A boleh direview juga
     * - Kalau bukan N/A minimal ada score_self
     */
    public function isReadyForAdminReview(): bool
    {
        if ($this->is_not_applicable) return true;
        return $this->score_self !== null;
    }

    public function isVerifiedByAdmin(): bool
    {
        return $this->verification !== null;
    }

    public function needsRevision(): bool
    {
        return $this->verification && $this->verification->status === Verification::STATUS_NEED_REVISION;
    }

    /**
     * Skor final untuk perhitungan (maturity/dimensi)
     * - N/A: tidak dihitung (null)
     * - not verified: gunakan skor self (agar skor bisa “preview” sebelum verif)
     * - accepted: skor self
     * - adjusted: skor verified
     * - need_revision: tidak dihitung (null)
     */
    public function effectiveScore(): ?int
    {
        if ($this->is_not_applicable) {
            return null;
        }

        // belum ada verifikasi -> pakai skor self (preview)
        if (!$this->verification) {
            return $this->score_self;
        }

        if ($this->verification->status === Verification::STATUS_ADJUSTED) {
            return $this->verification->score_verified; // sudah dijamin valid oleh guard Verification
        }

        if ($this->verification->status === Verification::STATUS_ACCEPTED) {
            return $this->score_self;
        }

        // need_revision
        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeDimension($query, int $dimension)
    {
        return $query->whereHas('indicator', function ($q) use ($dimension) {
            $q->where('dimension', $dimension);
        });
    }

    public function scopeApplicable($query)
    {
        return $query->where('is_not_applicable', false);
    }

    public function scopeWithVerificationStatus($query, string $status)
    {
        return $query->whereHas('verification', function ($q) use ($status) {
            $q->where('status', $status);
        });
    }
}
