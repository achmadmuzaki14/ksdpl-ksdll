<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Cooperation;
use App\Models\Assessment;

class CooperationPolicy
{
    /*
    |--------------------------------------------------------------------------
    | View Any
    |--------------------------------------------------------------------------
    */
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    /*
    |--------------------------------------------------------------------------
    | View
    |--------------------------------------------------------------------------
    */
    public function view(User $user, Cooperation $cooperation): bool
    {
        // Admin bisa lihat semua
        if ($user->role === 'admin') {
            return true;
        }

        // Owner assessment boleh lihat
        return $cooperation->assessment->created_by === $user->id;
    }

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    | Cooperation hanya boleh dibuat jika assessment masih draft
    */
    public function create(User $user, Assessment $assessment): bool
    {
        if (!$user->is_active) {
            return false;
        }

        // hanya boleh saat draft
        if (!$assessment->isDraft()) {
            return false;
        }

        // admin boleh create walau bukan owner
        if ($user->role === 'admin') {
            return true;
        }

        // user biasa hanya owner
        return $assessment->created_by === $user->id;
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */
    public function update(User $user, Cooperation $cooperation): bool
    {
        if (!$user->is_active) {
            return false;
        }

        // Admin boleh edit kapan saja (opsional)
        if ($user->role === 'admin') {
            return true;
        }

        // Hanya owner assessment
        if ($cooperation->assessment->created_by !== $user->id) {
            return false;
        }

        // Hanya saat assessment draft
        return $cooperation->assessment->isDraft();
    }

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */
    public function delete(User $user, Cooperation $cooperation): bool
    {
        if (!$user->is_active) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        if ($cooperation->assessment->created_by !== $user->id) {
            return false;
        }

        return $cooperation->assessment->isDraft();
    }

    /*
    |--------------------------------------------------------------------------
    | Restore
    |--------------------------------------------------------------------------
    */
    public function restore(User $user, Cooperation $cooperation): bool
    {
        return false;
    }

    /*
    |--------------------------------------------------------------------------
    | Force Delete
    |--------------------------------------------------------------------------
    */
    public function forceDelete(User $user, Cooperation $cooperation): bool
    {
        return false;
    }
}
