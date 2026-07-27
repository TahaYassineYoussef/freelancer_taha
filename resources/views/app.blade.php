<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="{{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        {{-- SEO --}}
        @php($seoDescription = 'Taha Yassine Youssef — freelance full-stack developer (Laravel, React) based in Sousse, Tunisia. Browse my projects, post a task and chat with me directly.')
        <meta name="description" content="{{ $seoDescription }}">
        <meta name="author" content="Taha Yassine Youssef">
        <meta name="theme-color" content="#0b0b0d">
        <link rel="canonical" href="{{ url()->current() }}">

        {{-- Favicon --}}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="apple-touch-icon" href="/images/taha.png">

        {{-- Open Graph / social preview --}}
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="Taha Yassine Youssef">
        <meta property="og:title" content="Taha Yassine Youssef — Freelance Developer">
        <meta property="og:description" content="{{ $seoDescription }}">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:image" content="{{ url('/images/taha.png') }}">

        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="Taha Yassine Youssef — Freelance Developer">
        <meta name="twitter:description" content="{{ $seoDescription }}">
        <meta name="twitter:image" content="{{ url('/images/taha.png') }}">

        {{-- Google Analytics 4 — only loaded when a Measurement ID is configured --}}
        @if ($gaId = config('services.google_analytics.id'))
            <script async src="https://www.googletagmanager.com/gtag/js?id={{ $gaId }}"></script>
            <script>
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', @json($gaId));
            </script>
        @endif

        {{-- Cloudflare Turnstile (bot protection) — only when configured --}}
        @if (config('services.turnstile.site_key'))
            <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
        @endif

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
