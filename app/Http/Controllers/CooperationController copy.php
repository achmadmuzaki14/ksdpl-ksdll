<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\Cooperation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CooperationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Create Cooperation
    |--------------------------------------------------------------------------
    */
    public function create(Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        return Inertia::render('Cooperations/Create', [
            'assessment' => $assessment->only([
                'id',
                'year',
                'status',
            ]),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Store Cooperation
    |--------------------------------------------------------------------------
    */
    public function store(Request $request, Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'partner_name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string'],
            'partner_country' => ['nullable', 'string', 'max:255'],
            'partner_city' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $cooperation = Cooperation::create([
            'assessment_id' => $assessment->id,
            'title' => $validated['title'],
            'partner_name' => $validated['partner_name'],
            'type' => $validated['type'],
            'partner_country' => $validated['partner_country'] ?? null,
            'partner_city' => $validated['partner_city'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
        ]);

        return redirect()->route(
            'cooperations.show',
            [$assessment->id, $cooperation->id]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Show Cooperation
    |--------------------------------------------------------------------------
    */
    public function show(Assessment $assessment, Cooperation $cooperation)
    {
        $this->authorize('view', $assessment);

        abort_unless($cooperation->assessment_id === $assessment->id, 404);

        $cooperation->load([
            'responses.indicator:id,dimension,code,title',
            'responses.verification:id,response_id,verifier_id,score_verified,status,verifier_note,updated_at',
        ]);

        $responses = $cooperation->responses
            ->sortBy(fn ($r) => [$r->indicator?->dimension ?? 99, $r->indicator_definition_id])
            ->groupBy(fn ($r) => $r->indicator?->dimension ?? 0);

        $mapResponse = function ($r) {
            return [
                'id' => $r->id,
                'cooperation_id' => $r->cooperation_id,
                'score_self' => $r->score_self,
                'justification' => $r->justification,
                'evidence_links' => $r->evidence_links,
                'is_not_applicable' => $r->is_not_applicable,
                'is_complete' => $r->is_complete,
                'can_edit' => auth()->user()?->can('update', $r) ?? false,
                'indicator' => $r->indicator ? [
                    'id' => $r->indicator->id,
                    'dimension' => $r->indicator->dimension,
                    'code' => $r->indicator->code,
                    'title' => $r->indicator->title,
                ] : null,
                'verification' => $r->verification ? [
                    'id' => $r->verification->id,
                    'status' => $r->verification->status,
                    'score_verified' => $r->verification->score_verified,
                    'verifier_note' => $r->verification->verifier_note,
                    'updated_at' => $r->verification->updated_at?->toISOString(),
                ] : null,
            ];
        };

        return Inertia::render('Assessments/CooperationShow', [
            'assessment' => $assessment->only([
                'id',
                'year',
                'status',
            ]),
            'cooperation' => $cooperation->only([
                'id',
                'title',
                'partner_name',
                'type',
                'partner_country',
                'partner_city',
                'start_date',
                'end_date',
            ]),

            'dimension2' => $responses->get(2, collect())->map($mapResponse)->values(),
            'dimension3' => $responses->get(3, collect())->map($mapResponse)->values(),
            'dimension4' => $responses->get(4, collect())->map($mapResponse)->values(),

            'dimension2_score' => $cooperation->convertedScore(2),
            'dimension3_score' => $cooperation->convertedScore(3),
            'dimension4_score' => $cooperation->convertedScore(4),

            'maturity_score' => $cooperation->maturityScore(),
            'maturity_category' => $cooperation->maturityCategory(),

            'permissions' => [
                'can_edit' => auth()->user()?->can('update', $assessment) ?? false,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Edit Cooperation
    |--------------------------------------------------------------------------
    */
    public function edit(Assessment $assessment, Cooperation $cooperation)
    {
        $this->authorize('update', $assessment);

        abort_unless($cooperation->assessment_id === $assessment->id, 404);

        return Inertia::render('Cooperations/Edit', [
            'assessment' => $assessment->only(['id', 'year', 'status']),
            'cooperation' => $cooperation,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Update Cooperation
    |--------------------------------------------------------------------------
    */
    public function update(Request $request, Assessment $assessment, Cooperation $cooperation)
    {
        $this->authorize('update', $assessment);

        abort_unless($cooperation->assessment_id === $assessment->id, 404);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'partner_name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string'],
            'partner_country' => ['nullable', 'string', 'max:255'],
            'partner_city' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $cooperation->update($validated);

        return redirect()->route(
            'cooperations.show',
            [$assessment->id, $cooperation->id]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Cooperation
    |--------------------------------------------------------------------------
    */
    public function destroy(Assessment $assessment, Cooperation $cooperation)
    {
        $this->authorize('update', $assessment);

        abort_unless($cooperation->assessment_id === $assessment->id, 404);

        $cooperation->delete();

        return redirect()->route('assessments.show', $assessment->id);
    }
}
