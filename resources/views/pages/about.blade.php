@extends("layouts.page", ['currentPage' => 'about'])


@section('title')
    About
@endsection

@section('content')

    @include('partials._banner_heading', ['titleBanner' => 'About Us'])

    @include('partials._facilities')

    @include('partials.about._team')

@endsection
