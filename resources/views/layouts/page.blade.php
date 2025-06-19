<!DOCTYPE html>
<html lang="en">

<head>
    @stack('prepend-styles')
    @include('partials._head')
    @stack('styles')

    <!-- Required meta tags for gemini -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Website Title</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- memanggil css -->
    <link rel="stylesheet" href="{{ asset('css/chatbot.css') }}">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">

</head>

<body>
    <!-- Navbar Start -->
    @include('partials._navbar', ['currentPage' => $currentPage])
    <!-- Navbar End -->

    <!-- Content -->
    @yield('content')
    <!-- Content End -->

    <!-- Footer Start -->
    @include('partials._footer')
    <!-- Footer End -->

    <!-- Back to Top -->
    @include('partials._back_to_top')
    <!-- Back to Top End -->
    
    <!-- Chatbot
    @include('components._chatbot') -->

    <!-- JavaScript Libraries -->
    @stack('prepend-scripts')
    @include('partials._scripts')
    @stack('scripts')
</body>

</html>
