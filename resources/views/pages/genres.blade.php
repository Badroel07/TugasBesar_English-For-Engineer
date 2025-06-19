@extends('layouts.page', ['currentPage' => 'genres'])


@section('title')
    Genres
@endsection

@section('content')
    @include('partials._banner_heading', ['titleBanner' => 'Genres'])
    @include('partials.chapter._detail')
@endsection
