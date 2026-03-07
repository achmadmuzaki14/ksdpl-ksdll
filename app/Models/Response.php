<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use RuntimeException;

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
    | Guard editing based on workflow
    |--------------------------------------------------------------------------
    */
    protected static function booted()
    {
        static::updating(function (Response $response) {
            $assessment = $response->assessment;

            if (!$assessment) {
                return;
            }

            if ($response->isEditableInCurrentWorkflow()) {
                return;
            }

            throw new RuntimeException('Assessment is locked.');
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
        return $this->belongsTo(
            IndicatorDefinition::class,
            'indicator_definition_id'
        );
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
     * Dipakai untuk progress UI user.
     */
    public function hasSelfScore(): bool
    {
        if ($this->is_not_applicable) {
            return true;
        }

        return $this->score_self !== null;
    }

    /**
     * Response siap direview admin.
     */
    public function isReadyForAdminReview(): bool
    {
        if ($this->is_not_applicable) {
            return true;
        }

        return $this->score_self !== null;
    }

    /**
     * Apakah sudah diverifikasi admin.
     */
    public function isVerifiedByAdmin(): bool
    {
        return $this->verification !== null;
    }

    /**
     * Apakah indikator perlu revisi.
     */
    public function needsRevision(): bool
    {
        return $this->verification !== null
            && $this->verification->status === Verification::STATUS_NEED_REVISION;
    }

    /**
     * Apakah response boleh diedit berdasarkan workflow saat ini.
     *
     * Rules:
     * - draft => editable
     * - submitted => editable hanya jika response need_revision
     * - verified / published => locked
     */
    public function isEditableInCurrentWorkflow(): bool
    {
        $assessment = $this->assessment;

        if (!$assessment) {
            return false;
        }

        if ($assessment->isDraft()) {
            return true;
        }

        if ($assessment->isSubmitted() && $this->needsRevision()) {
            return true;
        }

        return false;
    }

    /**
     * Skor final untuk perhitungan.
     */
    public function effectiveScore(): ?int
    {
        if ($this->is_not_applicable) {
            return null;
        }

        // preview score sebelum diverifikasi
        if (!$this->verification) {
            return $this->score_self;
        }

        if ($this->verification->status === Verification::STATUS_ADJUSTED) {
            return $this->verification->score_verified;
        }

        if ($this->verification->status === Verification::STATUS_ACCEPTED) {
            return $this->score_self;
        }

        // need_revision => belum punya skor final
        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
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
