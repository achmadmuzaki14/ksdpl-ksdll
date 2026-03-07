<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Verification extends Model
{
    use HasFactory;

    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_ADJUSTED = 'adjusted';
    public const STATUS_NEED_REVISION = 'need_revision';

    protected $fillable = [
        'response_id',
        'verifier_id',
        'score_verified',
        'verifier_note',
        'status',
    ];

    protected $casts = [
        'score_verified' => 'integer',
    ];

    protected $attributes = [
        'status' => self::STATUS_ACCEPTED,
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */
    public function response()
    {
        return $this->belongsTo(Response::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verifier_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Guards / Consistency
    |--------------------------------------------------------------------------
    */
    protected static function booted()
    {
        static::saving(function (Verification $v) {
            $status = $v->status ?? self::STATUS_ACCEPTED;

            // Normalisasi: kalau accepted / need_revision, score_verified seharusnya null
            if (in_array($status, [self::STATUS_ACCEPTED, self::STATUS_NEED_REVISION], true)) {
                $v->score_verified = null;
            }

            // adjusted wajib score_verified 1..4
            if ($status === self::STATUS_ADJUSTED) {
                if ($v->score_verified === null) {
                    throw new \InvalidArgumentException('score_verified wajib diisi jika status=adjusted.');
                }
                if ($v->score_verified < 1 || $v->score_verified > 4) {
                    throw new \InvalidArgumentException('score_verified harus 1..4.');
                }
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */
    public function isAccepted(): bool
    {
        return $this->status === self::STATUS_ACCEPTED;
    }

    public function isAdjusted(): bool
    {
        return $this->status === self::STATUS_ADJUSTED;
    }

    public function needsRevision(): bool
    {
        return $this->status === self::STATUS_NEED_REVISION;
    }
}
