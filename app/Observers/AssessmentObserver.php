<?php

namespace App\Observers;

use App\Models\Assessment;
use App\Models\IndicatorDefinition;
use Illuminate\Support\Facades\DB;

class AssessmentObserver
{
    public function created(Assessment $assessment): void
    {
        // guard supaya tidak double generate
        if ($assessment->responses()->exists()) {
            return;
        }

        $indicators = IndicatorDefinition::where('dimension', 1)
            ->where('is_active', true)
            ->get();

        $rows = [];

        foreach ($indicators as $indicator) {
            $rows[] = [
                'assessment_id' => $assessment->id,
                'cooperation_id' => null,
                'indicator_definition_id' => $indicator->id,
                'score_self' => null,
                'is_not_applicable' => false,
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
