<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use Inertia\Inertia;

class AssessmentReviewController extends Controller
{
    public function show(Assessment $assessment)
    {
        $this->authorize('review', $assessment);

        $assessment->load([
            'creator:id,name,email',
            'responses.indicator:id,dimension,code,title',
            'responses.cooperation:id,assessment_id,title,partner_name,type',
            'responses.verification:id,response_id,verifier_id,score_verified,status,verifier_note,updated_at',
        ]);

        $responses = $assessment->responses
            ->sortBy(fn ($r) => [
                $r->indicator?->dimension ?? 99,
                $r->cooperation_id ?? 0,
                $r->indicator_definition_id,
            ])
            ->values()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'cooperation_id' => $r->cooperation_id,
                    'score_self' => $r->score_self,
                    'justification' => $r->justification,
                    'evidence_links' => $r->evidence_links,
                    'is_not_applicable' => $r->is_not_applicable,
                    'is_complete' => $r->is_complete,
                    'indicator' => $r->indicator ? [
                        'id' => $r->indicator->id,
                        'dimension' => $r->indicator->dimension,
                        'code' => $r->indicator->code,
                        'title' => $r->indicator->title,
                    ] : null,
                    'cooperation' => $r->cooperation ? [
                        'id' => $r->cooperation->id,
                        'title' => $r->cooperation->title,
                        'partner_name' => $r->cooperation->partner_name,
                        'type' => $r->cooperation->type,
                    ] : null,
                    'verification' => $r->verification ? [
                        'id' => $r->verification->id,
                        'status' => $r->verification->status,
                        'score_verified' => $r->verification->score_verified,
                        'verifier_note' => $r->verification->verifier_note,
                        'updated_at' => $r->verification->updated_at?->toISOString(),
                    ] : null,
                ];
            });

        $coverage = method_exists($assessment, 'verificationCoverage')
            ? $assessment->verificationCoverage()
            : [
                'total' => $assessment->responses->count(),
                'verified_count' => $assessment->responses->filter(fn ($r) => $r->verification)->count(),
                'need_revision_count' => $assessment->responses->filter(
                    fn ($r) => $r->verification && $r->verification->status === 'need_revision'
                )->count(),
            ];

        return Inertia::render('Assessments/Review', [
            'assessment' => $assessment->only([
                'id',
                'year',
                'province',
                'regency_city',
                'status',
                'created_by',
                'submitted_at',
                'verified_at',
                'published_at',
            ]),
            'creator' => $assessment->creator
                ? $assessment->creator->only(['id', 'name', 'email'])
                : null,
            'coverage' => $coverage,
            'responses' => $responses,
            'can_finalize_verify' => $assessment->canBeVerified(),
        ]);
    }
}
