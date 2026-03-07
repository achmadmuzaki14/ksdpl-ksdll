<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Verification;

class VerificationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === 'admin' && $user->is_active;
    }

    public function view(User $user, Verification $verification): bool
    {
        return $user->role === 'admin' && $user->is_active;
    }

    public function create(User $user): bool
    {
        return $user->role === 'admin' && $user->is_active;
    }

    public function update(User $user, Verification $verification): bool
    {
        // hanya admin aktif
        return $user->role === 'admin' && $user->is_active;
    }
}
