<?php

namespace App\Http\Controllers\Admin;

use App\Models\Response;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ResponseController extends Controller
{
    public function update(Request $request, Response $response)
    {
        $this->authorize('update', $response);

        $validated = $request->validate([
            'score_self' => ['nullable', 'integer', 'between:1,4'],
            'justification' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($validated, $response) {
            /*
            |--------------------------------------------------------------------------
            | Jika indikator N/A
            |--------------------------------------------------------------------------
            */
            if ($response->is_not_applicable) {
                $response->update([
                    'score_self' => null,
                    'justification' => null,
                    'is_complete' => true,
                ]);

                // reset verification jika user revisi
                if ($response->verification) {
                    $response->verification()->delete();
                }

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Jika bukan N/A
            |--------------------------------------------------------------------------
            */
            if (($validated['score_self'] ?? null) === null) {
                throw ValidationException::withMessages([
                    'score_self' => 'Skor wajib diisi (1–4).',
                ]);
            }

            $response->update([
                'score_self' => $validated['score_self'],
                'justification' => $validated['justification'] ?? null,
                'is_complete' => true,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Reset verification jika user revisi
            |--------------------------------------------------------------------------
            */
            if ($response->verification) {
                $response->verification()->delete();
            }
        });

        return back()->with('success', 'Jawaban berhasil diperbarui.');
    }
}
