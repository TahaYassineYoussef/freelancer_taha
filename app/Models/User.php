<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'google_id', 'role', 'headline', 'headline_fr', 'headline_ar', 'bio', 'bio_fr', 'bio_ar', 'location', 'phone', 'avatar', 'd17_number', 'd17_qr', 'd17_enabled', 'paypal_email', 'paypal_client_id', 'paypal_enabled'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    // The MustVerifyEmail *trait* (not the contract) gives us
    // sendEmailVerificationNotification() / markEmailAsVerified() so an admin can
    // send a verification link and users can verify — WITHOUT implementing the
    // contract, so verification is never force-required on existing accounts.
    use HasApiTokens, HasFactory, MustVerifyEmail, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'paypal_enabled' => 'boolean',
            'd17_enabled' => 'boolean',
        ];
    }

    public function isFreelancer(): bool
    {
        return $this->role === 'freelancer';
    }

    public function diplomas(): HasMany
    {
        return $this->hasMany(Diploma::class);
    }

    public function experiences(): HasMany
    {
        return $this->hasMany(Experience::class);
    }

    public function internships(): HasMany
    {
        return $this->hasMany(Internship::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function avatarUrl(): ?string
    {
        if (! $this->avatar) {
            return null;
        }

        return \Illuminate\Support\Facades\Storage::url($this->avatar);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function availabilities(): HasMany
    {
        return $this->hasMany(Availability::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function testimonials(): HasMany
    {
        return $this->hasMany(Testimonial::class);
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }
}
