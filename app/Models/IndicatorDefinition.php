<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class IndicatorDefinition extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    */
    protected $fillable = [
        'dimension',
        'code',
        'title',
        'description',
        'evidence_guidance',
        'applicability_rules',
        'is_active',
    ];

    /*
    |--------------------------------------------------------------------------
    | Casting
    |--------------------------------------------------------------------------
    */
    protected $casts = [
        'dimension' => 'integer',
        'applicability_rules' => 'array',
        'is_active' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    // 1 indikator bisa punya banyak response
    public function responses()
    {
        return $this->hasMany(Response::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */

    // Cek apakah indikator termasuk dimensi tertentu
    public function isDimension(int $dimension): bool
    {
        return $this->dimension === $dimension;
    }

    // Cek apakah indikator applicable untuk type cooperation tertentu
    public function isApplicableFor(?string $cooperationType): bool
    {
        if (!$cooperationType) {
            return true;
        }

        if (!$this->applicability_rules) {
            return true;
        }

        $notApplicable = $this->applicability_rules['not_applicable_for'] ?? [];

        return !in_array($cooperationType, $notApplicable);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDimension($query, int $dimension)
    {
        return $query->where('dimension', $dimension);
    }
}
