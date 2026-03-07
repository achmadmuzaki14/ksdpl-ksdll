<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Response;

class ResponsePolicy
{
    /*
    |--------------------------------------------------------------------------
    | Update Response (Isi Skor / Ubah Jawaban)
    |--------------------------------------------------------------------------
    */
    public function update(User $user, Response $response): bool
    {
        $assessment = $response->assessment;

        if (!$user->is_active) {
            return false;
        }

        if (!$assessment) {
            return false;
        }

        if ($assessment->created_by !== $user->id) {
            return false;
        }

        return $response->isEditableInCurrentWorkflow();
    }

    /*
    |--------------------------------------------------------------------------
    | View
    |--------------------------------------------------------------------------
    */
    public function view(User $user, Response $response): bool
    {
        $assessment = $response->assessment;

        if (!$assessment) {
            return false;
        }

        if ($user->role === 'admin' && $user->is_active) {
            return true;
        }

        return $assessment->created_by === $user->id;
    }
}
