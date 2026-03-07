<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Cooperation extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    */
    protected $fillable = [
        'assessment_id',
        'title',
        'partner_name',
        'partner_country',
        'partner_city',
        'start_date',
        'end_date',
        'type', // KSDPL | KSDLL | KSDLL_PENERUSAN
    ];

    /*
    |--------------------------------------------------------------------------
    | Casting
    |--------------------------------------------------------------------------
    */
    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function assessment()
    {
        return $this->belongsTo(Assessment::class);
    }

    public function responses()
    {
        return $this->hasMany(Response::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Dimension Helpers
    |--------------------------------------------------------------------------
    */

    public function dimensionResponses(int $dimension)
    {
        return $this->responses()
            ->dimension($dimension)
            ->with(['indicator', 'verification'])
            ->orderBy('indicator_definition_id');
    }

    public function dimension2Responses()
    {
        return $this->dimensionResponses(2);
    }

    public function dimension3Responses()
    {
        return $this->dimensionResponses(3);
    }

    public function dimension4Responses()
    {
        return $this->dimensionResponses(4);
    }

    /*
    |--------------------------------------------------------------------------
    | Type Helpers
    |--------------------------------------------------------------------------
    */

    public function isKsdpl(): bool
    {
        return $this->type === 'KSDPL';
    }

    public function isKsdll(): bool
    {
        return $this->type === 'KSDLL';
    }

    public function isPenerusan(): bool
    {
        return $this->type === 'KSDLL_PENERUSAN';
    }

    /*
    |--------------------------------------------------------------------------
    | Scoring Logic
    |--------------------------------------------------------------------------
    */

    /**
     * Ambil rata-rata skor per dimensi (1–4 scale)
     */
    public function calculateDimensionScore(int $dimension): ?float
    {
        $responses = $this->responses()
            ->dimension($dimension)
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

    /**
     * Konversi skor 1–4 menjadi 0–100
     */
    public function convertedScore(int $dimension): ?float
    {
        $avg = $this->calculateDimensionScore($dimension);

        if ($avg === null) {
            return null;
        }

        return round($avg * 25, 2);
    }

    /**
     * Maturity Score Final (Average dimensi 2–4)
     */
    public function maturityScore(): ?float
    {
        // OPTIONAL: tampilkan maturity hanya jika assessment verified
        // if (!$this->assessment->isVerified()) {
        //     return null;
        // }

        $scores = collect([
            $this->convertedScore(2),
            $this->convertedScore(3),
            $this->convertedScore(4),
        ])->filter(fn ($v) => $v !== null);

        if ($scores->isEmpty()) {
            return null;
        }

        return round($scores->avg(), 2);
    }

    /**
     * Maturity Category
     */
    public function maturityCategory(): ?string
    {
        $score = $this->maturityScore();

        if ($score === null) {
            return null;
        }

        if ($score < 50) return 'Foundational';
        if ($score < 70) return 'Progressing';
        if ($score < 85) return 'Effective';

        return 'Transformative';
    }

    /*
    |--------------------------------------------------------------------------
    | Progress Helpers (UI Friendly)
    |--------------------------------------------------------------------------
    */

    public function totalIndicators(): int
    {
        return $this->responses()->count();
    }

    public function completedIndicators(): int
    {
        return $this->responses()
            ->get()
            ->filter(fn ($r) => $r->hasSelfScore())
            ->count();
    }

    public function verificationProgress(): array
    {
        $total = $this->responses()->count();

        $verified = $this->responses()
            ->has('verification')
            ->count();

        $needRevision = $this->responses()
            ->whereHas('verification', fn ($q) => $q->where('status', 'need_revision'))
            ->count();

        return [
            'total' => $total,
            'verified' => $verified,
            'need_revision' => $needRevision,
        ];
    }
}
