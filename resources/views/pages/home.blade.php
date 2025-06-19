@extends("layouts.page", ['currentPage' => 'home'])


@section('title')
    Home
@endsection

@section('content')

    @include('partials.home._header')
    <!-- Header End -->

    <!-- Facilities Start -->
    @include('partials._facilities')
    <!-- Facilities End -->

    <!-- About Start -->
    @include('partials.home._about')

@endsection
