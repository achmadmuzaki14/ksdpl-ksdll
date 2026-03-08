<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssessmentController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Index
    |--------------------------------------------------------------------------
    */
    public function index()
    {
        $user = auth()->user();

        $query = Assessment::withCount('cooperations');

        // jika bukan admin -> hanya lihat miliknya
        if ($user->role !== 'admin') {
            $query->where('created_by', $user->id);
        }

        $assessments = $query
            ->latest('year')
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'year' => $a->year,
                    'province' => $a->province,
                    'regency_city' => $a->regency_city,
                    'status' => $a->status,
                    'overall_score' => $a->overallScore(),
                    'cooperations_count' => $a->cooperations_count,
                    'dimension1_progress' => [
                        'completed' => $a->responses()
                            ->whereNull('cooperation_id')
                            ->where('is_complete', true)
                            ->count(),
                        'total' => $a->responses()
                            ->whereNull('cooperation_id')
                            ->count(),
                    ],
                ];
            });

        return Inertia::render('Assessments/Index', [
            'assessments' => $assessments,
            'permissions' => [
                'is_admin' => $user->role === 'admin',
            ],
        ]);
    }
    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */
    public function create()
    {
        $this->authorize('create', Assessment::class);

        return Inertia::render('Assessments/Create');
    }

    /*
    |--------------------------------------------------------------------------
    | Store
    |--------------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        $this->authorize('create', Assessment::class);

        $validated = $request->validate([
            'province' => ['required', 'string', 'max:255'],
            'regency_city' => ['nullable', 'string', 'max:255'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        $assessment = Assessment::create([
            'province' => $validated['province'],
            'regency_city' => $validated['regency_city'] ?? null,
            'year' => $validated['year'],
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('assessments.show', $assessment->id);
    }

    /*
    |--------------------------------------------------------------------------
    | Show (Dashboard)
    |--------------------------------------------------------------------------
    */
    public function show(Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        $assessment->load([
            'responses.indicator',
            'responses.verification',
            'cooperations.responses.indicator',
            'cooperations.responses.verification',
        ]);

        $coops = $assessment->cooperations->map(function ($c) {
            $score = $c->maturityScore();

            return [
                'id' => $c->id,
                'title' => $c->title,
                'partner_name' => $c->partner_name,
                'type' => $c->type,
                'maturity_score' => $score,
                'category' => $score === null ? null : $this->categoryFromScore($score),
            ];
        })->values();

        $user = auth()->user();

        return Inertia::render('Assessments/Show', [
            'assessment' => $assessment->only([
                'id',
                'year',
                'province',
                'regency_city',
                'status',
            ]),
            'analytics' => [
                'dim1' => $assessment->dimension1ConvertedScore(),
                'dim2' => $assessment->dimension2ConvertedScore(),
                'dim3' => $assessment->dimension3ConvertedScore(),
                'dim4' => $assessment->dimension4ConvertedScore(),

                'overall_score' => $assessment->overallScore(),
                'overall_category' => $assessment->overallCategory(),

                'cooperations_count' => $assessment->cooperations->count(),
                'cooperation_distribution' => $assessment->cooperationCategoryDistribution(),
            ],
            'cooperations' => $coops,
            'permissions' => [
                'can_submit' => $user?->can('submit', $assessment) ?? false,
                'can_verify' => $user?->can('verify', $assessment) ?? false,
                'can_publish' => $user?->can('publish', $assessment) ?? false,

                // assessment-level metadata edit only
                'can_edit' => $user?->can('update', $assessment) ?? false,

                'is_admin' => ($user?->role === 'admin'),
                'can_review' => $user?->can('review', $assessment) ?? false,

                // tambahan yang lebih akurat untuk UI workflow
                'has_editable_responses' => $assessment->hasEditableResponses(),
                'has_revision_requests' => $assessment->hasRevisionRequests(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Dimension 1 Page
    |--------------------------------------------------------------------------
    */
    public function dimension1(Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        $assessment->load([
            'responses' => fn ($q) => $q
                ->whereNull('cooperation_id')
                ->with(['indicator', 'verification'])
                ->orderBy('indicator_definition_id'),
        ]);

        $user = auth()->user();

        $responses = $assessment->responses->map(function ($response) use ($user) {
            return [
                'id' => $response->id,
                'assessment_id' => $response->assessment_id,
                'cooperation_id' => $response->cooperation_id,
                'indicator_definition_id' => $response->indicator_definition_id,
                'score_self' => $response->score_self,
                'is_not_applicable' => $response->is_not_applicable,
                'justification' => $response->justification,
                'evidence_links' => $response->evidence_links,
                'is_complete' => $response->is_complete,
                'can_edit' => $user?->can('update', $response) ?? false,
                'indicator' => $response->indicator ? [
                    'id' => $response->indicator->id,
                    'dimension' => $response->indicator->dimension,
                    'code' => $response->indicator->code,
                    'title' => $response->indicator->title,
                ] : null,
                'verification' => $response->verification ? [
                    'id' => $response->verification->id,
                    'status' => $response->verification->status,
                    'score_verified' => $response->verification->score_verified,
                    'verifier_note' => $response->verification->verifier_note,
                    'updated_at' => $response->verification->updated_at?->toISOString(),
                ] : null,
            ];
        })->values();

        return Inertia::render('Assessments/Dimension1', [
            'assessment' => $assessment->only([
                'id',
                'year',
                'status',
            ]),
            'responses' => $responses,

            // backward-compatible untuk UI lama
            'can_edit' => $responses->contains(fn ($r) => $r['can_edit'] === true),

            // tambahan yang lebih jelas untuk UI baru
            'permissions' => [
                'can_edit_any_response' => $responses->contains(fn ($r) => $r['can_edit'] === true),
                'can_edit_assessment' => $user?->can('update', $assessment) ?? false,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */
    public function submit(Assessment $assessment)
    {
        $this->authorize('submit', $assessment);

        $incomplete = $assessment->responses()
            ->where('is_not_applicable', false)
            ->whereNull('score_self')
            ->exists();

        if ($incomplete) {
            return back()->withErrors([
                'submit' => 'Masih ada indikator yang belum lengkap. Lengkapi semua jawaban sebelum submit.',
            ]);
        }

        $assessment->submit(auth()->id());

        return back()->with('success', 'Assessment submitted successfully.');
    }

    /*
    |--------------------------------------------------------------------------
    | Verify (Admin Only)
    |--------------------------------------------------------------------------
    */
    public function verify(Assessment $assessment)
    {
        $this->authorize('verify', $assessment);

        if (!$assessment->canBeVerified()) {
            return back()->withErrors([
                'verify' => 'Assessment belum dapat diverifikasi. Masih ada indikator yang belum diverifikasi atau perlu revisi.',
            ]);
        }

        $assessment->verify(auth()->id());

        return back()->with('success', 'Assessment verified successfully.');
    }

    /*
    |--------------------------------------------------------------------------
    | Publish (Admin Only)
    |--------------------------------------------------------------------------
    */
    public function publish(Assessment $assessment)
    {
        $this->authorize('publish', $assessment);

        $assessment->publish();

        return back()->with('success', 'Assessment published successfully.');
    }

    /*
    |--------------------------------------------------------------------------
    | Helper: kategori dokumen (skala 0-100)
    |--------------------------------------------------------------------------
    */
    private function categoryFromScore(float $score): string
    {
        if ($score >= 85) return 'Advanced';
        if ($score >= 70) return 'Developed';
        if ($score >= 50) return 'Emerging';

        return 'Early Stage';
    }
}
