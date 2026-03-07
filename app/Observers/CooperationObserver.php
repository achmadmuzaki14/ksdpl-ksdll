<?php

namespace App\Observers;

use App\Models\Cooperation;
use App\Models\IndicatorDefinition;
use Illuminate\Support\Facades\DB;

class CooperationObserver
{
    public function created(Cooperation $cooperation): void
    {
        // Jangan generate kalau sudah ada response
        if ($cooperation->responses()->exists()) {
            return;
        }

        $indicators = IndicatorDefinition::whereIn('dimension', [2,3,4])
            ->where('is_active', true)
            ->get();

        $rows = [];

        foreach ($indicators as $indicator) {

            $isApplicable = true;

            $rules = $indicator->applicability_rules ?? null;

            if ($rules && isset($rules['not_applicable_for'])) {
                if (in_array($cooperation->type, $rules['not_applicable_for'])) {
                    $isApplicable = false;
                }
            }

            $rows[] = [
                'assessment_id' => $cooperation->assessment_id,
                'cooperation_id' => $cooperation->id,
                'indicator_definition_id' => $indicator->id,
                'score_self' => null,
                'is_not_applicable' => !$isApplicable,
                'justification' => null,
                'evidence_links' => null,
                'is_complete' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('responses')->insert($rows);
    }
}
