<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Assessment;
use App\Models\Cooperation;
use App\Observers\AssessmentObserver;
use App\Observers\CooperationObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Assessment::observe(AssessmentObserver::class);
        Cooperation::observe(CooperationObserver::class);
    }
}
