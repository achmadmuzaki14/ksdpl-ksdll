<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Response;
use App\Models\Verification;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    public function upsert(Request $request, Response $response)
    {
        // admin-only (lebih aman cek assessment submitted juga)
        $assessment = $response->assessment()->firstOrFail();
        $this->authorize('verify', $assessment);

        $validated = $request->validate([
            'status' => ['required', 'in:accepted,adjusted,need_revision'],
            'score_verified' => ['nullable', 'integer', 'between:1,4'],
            'verifier_note' => ['nullable', 'string'],
        ]);

        // aturan konsistensi:
        // - adjusted => score_verified wajib
        if ($validated['status'] === 'adjusted' && empty($validated['score_verified'])) {
            return back()->withErrors([
                'score_verified' => 'score_verified wajib jika status=adjusted.',
            ]);
        }

        // - accepted / need_revision => score_verified harus null
        if (in_array($validated['status'], ['accepted','need_revision'], true)) {
            $validated['score_verified'] = null;
        }

        Verification::updateOrCreate(
            ['response_id' => $response->id],
            [
                'verifier_id' => auth()->id(),
                'status' => $validated['status'],
                'score_verified' => $validated['score_verified'],
                'verifier_note' => $validated['verifier_note'] ?? null,
            ]
        );

        return back()->with('success', 'Verification saved.');
    }
}
