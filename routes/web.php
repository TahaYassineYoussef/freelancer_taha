<?php

use App\Http\Controllers\AvailabilityController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CallController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ClientTaskController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CvController;
use App\Http\Controllers\CvPdfController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ModerationLogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymentSettingsController;
use App\Http\Controllers\ReviewModerationController;
use App\Http\Controllers\TaskBoardController;
use App\Http\Controllers\RevisionController;
use App\Http\Controllers\WorkController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TestimonialController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\VisitorController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->middleware('track')->name('home');

/*
 * PayPal checkout surface for the mobile app, rendered inside an in-app web
 * view. The app is already authenticated and passes the amount and the
 * freelancer's client id, so this page touches no database and leaks nothing.
 * After capture it redirects to /paypal/done, which the app intercepts to read
 * the order id and record the payment through the authenticated API.
 */
Route::get('/paypal/checkout', function (\Illuminate\Http\Request $request) {
    $data = $request->validate([
        'client_id' => ['required', 'string', 'max:255'],
        'currency' => ['required', 'string', 'size:3'],
        'amount' => ['required', 'numeric', 'min:0.01'],
        'title' => ['nullable', 'string', 'max:255'],
    ]);

    return view('paypal.checkout', [
        'clientId' => $data['client_id'],
        'currency' => strtoupper($data['currency']),
        'amount' => number_format((float) $data['amount'], 2, '.', ''),
        'title' => $data['title'] ?? 'Task payment',
    ]);
})->name('paypal.checkout');

// Intercepted by the app's web view; only rendered if opened in a plain browser.
Route::get('/paypal/done', function (\Illuminate\Http\Request $r) {
    $ok = $r->filled('order_id');

    return view('auth.google-done', [
        'ok' => $ok,
        'heading' => $ok ? 'Payment complete' : 'Payment cancelled',
        'body' => $ok
            ? 'Your PayPal payment went through. You can close this tab and go back to the app.'
            : 'The payment was cancelled. You can close this tab and try again from the app.',
    ]);
})->name('paypal.done');

// Switch interface language (en / fr / ar) — public, remembered in session
Route::post('/locale/{locale}', [\App\Http\Controllers\LocaleController::class, 'update'])->name('locale.update');

// Public: download Taha's CV as PDF + guest contact form
Route::get('/cv/download', [CvPdfController::class, 'download'])->name('cv.download');
Route::post('/contact', [ContactController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('contact.store');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    // Profile (Breeze)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Tasks
    Route::post('/tasks', [TaskController::class, 'store'])
        ->middleware('throttle:10,60') // anti-spam: max 10 posted tasks per hour
        ->name('tasks.store');
    Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus'])->name('tasks.status');
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');

    // Task workflow
    Route::post('/tasks/{task}/accept', [TaskController::class, 'accept'])->name('tasks.accept');
    Route::post('/tasks/{task}/decline', [TaskController::class, 'decline'])->name('tasks.decline');
    Route::post('/tasks/{task}/deliver', [TaskController::class, 'deliver'])->name('tasks.deliver');
    Route::post('/tasks/{task}/approve', [TaskController::class, 'approve'])->name('tasks.approve');
    Route::post('/tasks/{task}/request-changes', [TaskController::class, 'requestChanges'])->name('tasks.requestChanges');

    // In-app notifications (the bell)
    Route::post('/notifications/read', [NotificationController::class, 'markAllRead'])->name('notifications.readAll');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');

    // Payments (client pays for a task via PayPal)
    Route::post('/tasks/{task}/pay', [PaymentController::class, 'store'])->name('payments.store');
    // Payments (client declares a D17 transfer for a task)
    Route::post('/tasks/{task}/d17', [PaymentController::class, 'storeD17'])->name('payments.d17');

    // Client's own tasks (filterable)
    Route::get('/my-tasks', [ClientTaskController::class, 'index'])->name('mytasks.index');

    // Client's deliveries (work delivered to them, awaiting approval)
    Route::get('/deliveries', [DeliveryController::class, 'index'])->name('deliveries.index');

    // Booking a call with the freelancer (client requests a free slot)
    Route::get('/booking', [BookingController::class, 'index'])->name('booking.index');
    Route::post('/booking', [BookingController::class, 'store'])
        ->middleware('throttle:10,60') // anti-spam: max 10 requests per hour
        ->name('booking.store');
    Route::delete('/booking/{booking}', [BookingController::class, 'destroy'])->name('booking.destroy');

    // Chat
    Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
    Route::get('/chat/{user}/messages', [ChatController::class, 'fetch'])->name('chat.fetch');
    Route::get('/chat/{user}/poll', [ChatController::class, 'poll'])->name('chat.poll');
    Route::post('/chat/{user}/messages', [ChatController::class, 'store'])->name('chat.store');
    Route::post('/chat/{user}/signal', [ChatController::class, 'signal'])->name('chat.signal');

    // Global call signalling (polled on every page so you're rung anywhere)
    Route::get('/calls/poll', [CallController::class, 'poll'])->name('calls.poll');
    Route::post('/calls/signal', [CallController::class, 'signal'])->name('calls.signal');
    Route::post('/calls/log', [CallController::class, 'log'])->name('calls.log');

    // Testimonials: clients submit, freelancer moderates
    Route::post('/testimonials', [TestimonialController::class, 'store'])
        ->middleware('throttle:5,60') // anti-spam: max 5 reviews per hour
        ->name('testimonials.store');
    Route::delete('/testimonials/{testimonial}', [TestimonialController::class, 'destroy'])->name('testimonials.destroy');

    // Payment tracking + moderation (freelancer only)
    Route::middleware('freelancer')->group(function () {
        Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
        Route::patch('/payments/{payment}/review', [PaymentController::class, 'review'])->name('payments.review');

        Route::patch('/testimonials/{testimonial}/review', [TestimonialController::class, 'review'])->name('testimonials.review');

        // Where Taha receives money (PayPal + D17)
        Route::get('/payment-settings', [PaymentSettingsController::class, 'edit'])->name('payment.settings');
        Route::post('/payment-settings', [PaymentSettingsController::class, 'update'])->name('payment.settings.update');

        Route::get('/contact-messages', [ContactController::class, 'index'])->name('contact.index');
        Route::delete('/contact-messages/{contactMessage}', [ContactController::class, 'destroy'])->name('contact.destroy');

        // Website traffic / visitor analytics
        Route::get('/visitors', [VisitorController::class, 'index'])->name('visitors.index');

        // Registered accounts: stats + searchable, paginated user list
        Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
        Route::post('/users/scan', [UserManagementController::class, 'scan'])->name('users.scan');
        Route::post('/users/bulk-delete', [UserManagementController::class, 'bulkDestroy'])->name('users.bulkDestroy');
        Route::post('/users/{user}/send-verification', [UserManagementController::class, 'sendVerification'])
            ->name('users.sendVerification');
        Route::delete('/users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');

        // Filterable board of all tasks
        Route::get('/tasks-board', [TaskBoardController::class, 'index'])->name('tasks.index');

        // Freelancer's delivery workspace
        Route::get('/work', [WorkController::class, 'index'])->name('work.index');

        // Review moderation
        Route::get('/reviews', [ReviewModerationController::class, 'index'])->name('reviews.index');

        // Pending client change requests
        Route::get('/revisions', [RevisionController::class, 'index'])->name('revisions.index');

        // Weekly availability (working hours) + booking management
        Route::get('/availability', [AvailabilityController::class, 'edit'])->name('availability.edit');
        Route::post('/availability', [AvailabilityController::class, 'update'])->name('availability.update');
        Route::post('/availability/date', [AvailabilityController::class, 'storeDate'])->name('availability.date.store');
        Route::delete('/availability/date/{date}', [AvailabilityController::class, 'destroyDate'])
            ->where('date', '[0-9]{4}-[0-9]{2}-[0-9]{2}')->name('availability.date.destroy');
        Route::get('/bookings', [BookingController::class, 'manage'])->name('bookings.index');
        Route::patch('/bookings/{booking}/confirm', [BookingController::class, 'confirm'])->name('bookings.confirm');
        Route::patch('/bookings/{booking}/decline', [BookingController::class, 'decline'])->name('bookings.decline');

        // Blocked submissions (scam / profanity caught by moderation)
        Route::get('/blocked', [ModerationLogController::class, 'index'])->name('moderation.index');
        Route::delete('/blocked/{moderationLog}', [ModerationLogController::class, 'destroy'])->name('moderation.destroy');
    });

    // CV management (freelancer only)
    Route::middleware('freelancer')->group(function () {
        Route::get('/cv', [CvController::class, 'edit'])->name('cv.edit');
        Route::patch('/cv/profile', [CvController::class, 'updateProfile'])->name('cv.profile');

        Route::post('/cv/diplomas', [CvController::class, 'storeDiploma'])->name('cv.diplomas.store');
        Route::patch('/cv/diplomas/{diploma}', [CvController::class, 'updateDiploma'])->name('cv.diplomas.update');
        Route::delete('/cv/diplomas/{diploma}', [CvController::class, 'destroyDiploma'])->name('cv.diplomas.destroy');

        Route::post('/cv/experiences', [CvController::class, 'storeExperience'])->name('cv.experiences.store');
        Route::patch('/cv/experiences/{experience}', [CvController::class, 'updateExperience'])->name('cv.experiences.update');
        Route::delete('/cv/experiences/{experience}', [CvController::class, 'destroyExperience'])->name('cv.experiences.destroy');

        Route::post('/cv/internships', [CvController::class, 'storeInternship'])->name('cv.internships.store');
        Route::patch('/cv/internships/{internship}', [CvController::class, 'updateInternship'])->name('cv.internships.update');
        Route::delete('/cv/internships/{internship}', [CvController::class, 'destroyInternship'])->name('cv.internships.destroy');

        // Projects
        Route::post('/cv/projects', [PortfolioController::class, 'storeProject'])->name('cv.projects.store');
        Route::post('/cv/projects/{project}', [PortfolioController::class, 'updateProject'])->name('cv.projects.update');
        Route::delete('/cv/projects/{project}', [PortfolioController::class, 'destroyProject'])->name('cv.projects.destroy');

        // Skills
        Route::post('/cv/skills', [PortfolioController::class, 'storeSkill'])->name('cv.skills.store');
        Route::patch('/cv/skills/{skill}', [PortfolioController::class, 'updateSkill'])->name('cv.skills.update');
        Route::delete('/cv/skills/{skill}', [PortfolioController::class, 'destroySkill'])->name('cv.skills.destroy');

        // Services
        Route::post('/cv/services', [PortfolioController::class, 'storeService'])->name('cv.services.store');
        Route::patch('/cv/services/{service}', [PortfolioController::class, 'updateService'])->name('cv.services.update');
        Route::delete('/cv/services/{service}', [PortfolioController::class, 'destroyService'])->name('cv.services.destroy');
    });
});

require __DIR__.'/auth.php';
