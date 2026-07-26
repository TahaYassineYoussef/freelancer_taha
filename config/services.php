<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    // Supabase — used for object storage (S3) and Realtime call signalling.
    // url + anon_key are public and shared to the front-end for the Realtime
    // WebSocket so incoming calls ring instantly instead of waiting for a poll.
    'supabase' => [
        'url' => env('SUPABASE_URL'),
        'anon_key' => env('SUPABASE_ANON_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Google sign-in (Laravel Socialite).
    // Firebase Cloud Messaging: rings the mobile app for incoming calls even
    // when it is closed. Point this at the service-account JSON.
    'fcm' => [
        'credentials' => env('FCM_CREDENTIALS', storage_path('app/firebase-service-account.json')),
    ],

  'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI', 'https://freelancer-taha.vercel.app/auth/google/callback'),
],

    // AI moderation (Claude). Without an API key the site falls back to the
    // built-in word/pattern list — nothing breaks, it just gets less clever.
    'anthropic' => [
        'api_key' => env('ANTHROPIC_API_KEY'),
        'moderation' => env('AI_MODERATION_ENABLED', true),
    ],

    'paypal' => [
        // Set PAYPAL_ENABLED=false to hide the PayPal button from clients while
        // keeping every credential below intact — flip it back to true anytime.
        'enabled' => env('PAYPAL_ENABLED', true),
        'mode' => env('PAYPAL_MODE', 'sandbox'),
        'client_id' => env('PAYPAL_CLIENT_ID'),
        'secret' => env('PAYPAL_CLIENT_SECRET'),
        'currency' => env('PAYPAL_CURRENCY', 'USD'),
    ],

    // Google Analytics 4. Paste your Measurement ID (G-XXXXXXXXXX) into the .env
    // as GOOGLE_ANALYTICS_ID and the tracking tag is added automatically.
    // Leave it empty and no analytics script is loaded at all.
    'google_analytics' => [
        'id' => env('GOOGLE_ANALYTICS_ID'),
    ],

    // Tunisian payment gateway that supports D17 (Konnect / Flouci / Paymee).
    // Fill these once you have a merchant account to enable automated D17 payments.
    'd17_gateway' => [
        'provider' => env('D17_GATEWAY_PROVIDER'), // 'konnect' | 'flouci' | 'paymee'
        'api_key' => env('D17_GATEWAY_API_KEY'),
        'secret' => env('D17_GATEWAY_SECRET'),
        'mode' => env('D17_GATEWAY_MODE', 'test'),
    ],

];
