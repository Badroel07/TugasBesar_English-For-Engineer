@extends('layouts.page', ['currentPage' => '$chapterId'])

@section('title')
    Chapter {{ $chapterId }}
@endsection


@section('content')
    @include('partials._banner_heading')
    <div class="container py-5">
        <div class="row pt-5">
            <div class="col-lg-12">
                @include('partials._content')
            </div>
        </div>
    </div>
@endsection