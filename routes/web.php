<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AssessmentController;
use App\Http\Controllers\CooperationController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/assessments/create', [AssessmentController::class, 'create'])
        ->name('assessments.create');

    Route::post('/assessments', [AssessmentController::class, 'store'])
        ->name('assessments.store');

    Route::get('/assessments/{assessment}/dimension-1',
    [AssessmentController::class, 'dimension1'])
    ->name('assessments.dimension1');

    // submit dimension 1
    Route::post(
        '/assessments/{assessment}/submit',
        [AssessmentController::class, 'submit']
    )->name('assessments.submit');

    Route::post('/assessments/{assessment}/verify',
        [AssessmentController::class, 'verify']
    )->name('assessments.verify');

    Route::post('/assessments/{assessment}/publish',
        [AssessmentController::class, 'publish']
    )->name('assessments.publish');

    Route::get(
        '/assessments/{assessment}/cooperations/create',
        [CooperationController::class, 'create']
    )->name('cooperations.create');

    Route::post(
        '/assessments/{assessment}/cooperations',
        [CooperationController::class, 'store']
    )->name('cooperations.store');

    Route::get(
        '/assessments/{assessment}/cooperations/{cooperation}',
        [CooperationController::class, 'show']
    )->name('cooperations.show');


    Route::get('/assessments/{assessment}', [AssessmentController::class, 'show'])
        ->name('assessments.show');

        Route::get('/assessments', [AssessmentController::class, 'index'])
        ->name('assessments.index');
});






require __DIR__ . '/admin.php';
require __DIR__ . '/auth.php';
