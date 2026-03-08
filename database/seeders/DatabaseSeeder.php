<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        $this->call(IndicatorDefinitionSeeder::class);

        /*
        |--------------------------------------------------------------------------
        | Admin User
        |--------------------------------------------------------------------------
        */

        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Evaluator',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Evaluator Userse
        |--------------------------------------------------------------------------
        */
        User::updateOrCreate(
            ['email' => 'user1@ksdpl.local'],
            [
                'name' => 'User Satu',
                'password' => Hash::make('password'),
                'role' => 'user',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        User::updateOrCreate(
            ['email' => 'user2@ksdpl.local'],
            [
                'name' => 'User Dua',
                'password' => Hash::make('password'),
                'role' => 'user',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
