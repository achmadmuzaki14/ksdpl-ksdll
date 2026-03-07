<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Assessment;

class AssessmentPolicy
{
    /*
    |--------------------------------------------------------------------------
    | View
    |--------------------------------------------------------------------------
    */
    public function view(User $user, Assessment $assessment): bool
    {
        if (!$user->is_active) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        return $assessment->created_by === $user->id;
    }

    /*
    |--------------------------------------------------------------------------
    | Update (Edit assessment-level metadata only, draft only by owner)
    |--------------------------------------------------------------------------
    */
    public function update(User $user, Assessment $assessment): bool
    {
        return $user->is_active
            && $assessment->isDraft()
            && $assessment->created_by === $user->id;
    }

    /*
    |--------------------------------------------------------------------------
    | Submit (Only Owner)
    |--------------------------------------------------------------------------
    */
    public function submit(User $user, Assessment $assessment): bool
    {
        return $user->is_active
            && $assessment->isDraft()
            && $assessment->created_by === $user->id;
    }

    /*
    |--------------------------------------------------------------------------
    | Review (Admin opens review page)
    |--------------------------------------------------------------------------
    */
    public function review(User $user, Assessment $assessment): bool
    {
        return $user->is_active
            && $user->role === 'admin'
            && $assessment->canBeReviewedByAdmin();
    }

    /*
    |--------------------------------------------------------------------------
    | Verify (Admin finalizes submitted assessment)
    |--------------------------------------------------------------------------
    */
    public function verify(User $user, Assessment $assessment): bool
    {
        return $user->is_active
            && $user->role === 'admin'
            && $assessment->isSubmitted();
    }

    /*
    |--------------------------------------------------------------------------
    | Publish (Only Admin)
    |--------------------------------------------------------------------------
    */
    public function publish(User $user, Assessment $assessment): bool
    {
        return $user->is_active
            && $user->role === 'admin'
            && $assessment->isVerified();
    }

    public function create(User $user): bool
    {
        return $user->is_active;
    }
}
