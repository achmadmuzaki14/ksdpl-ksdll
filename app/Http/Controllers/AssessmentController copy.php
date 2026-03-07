<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssessmentController extends Controller
{
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
            // status default = draft (via model)
        ]);

        // opsional: kalau mau langsung masuk dimensi 1
        // return redirect()->route('assessments.dimension1', $assessment->id);

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

        // Hindari N+1: maturityScore() akan butuh responses + verification
        $assessment->load([
            'cooperations.responses.verification',
        ]);

        $coops = $assessment->cooperations->map(function ($c) {
            return [
                'id' => $c->id,
                'title' => $c->title,
                'partner_name' => $c->partner_name,
                'type' => $c->type,
                'maturity_score' => $c->maturityScore(),
                'maturity_category' => $c->maturityCategory(),
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

                'overall_score' => $assessment->overallAssessmentScore(),
                'overall_category' => $assessment->overallAssessmentCategory(),

                'cooperations_count' => $assessment->cooperations->count(),
            ],
            'cooperations' => $coops,
            'permissions' => [
                'can_submit' => $user?->can('submit', $assessment) ?? false,
                'can_verify' => $user?->can('verify', $assessment) ?? false,
                'can_publish' => $user?->can('publish', $assessment) ?? false,
                'can_edit' => $user?->can('update', $assessment) ?? false,
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

        $responses = $assessment->responses()
            ->whereNull('cooperation_id')
            ->with([
                'indicator:id,dimension,code,title',
                'verification:id,response_id,verifier_id,score_verified,status,verifier_note,created_at,updated_at',
            ])
            ->orderBy('indicator_definition_id')
            ->get();

        $user = auth()->user();

        return Inertia::render('Assessments/Dimension1', [
            'assessment' => $assessment->only([
                'id',
                'year',
                'status',
            ]),
            'responses' => $responses,
            'can_edit' => $user?->can('update', $assessment) ?? false,
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

        // OPTIONAL (kalau kamu ingin submit harus lengkap):
        // $incomplete = $assessment->responses()
        //     ->whereNull('cooperation_id')
        //     ->where('is_not_applicable', false)
        //     ->whereNull('score_self')
        //     ->exists();
        // if ($incomplete) {
        //     return back()->withErrors([
        //         'submit' => 'Dimensi 1 belum lengkap. Lengkapi dulu sebelum submit.'
        //     ]);
        // }

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

        // defense-in-depth (meski verify() di model sudah cek)
        if (method_exists($assessment, 'canBeVerified') && !$assessment->canBeVerified()) {
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
}
