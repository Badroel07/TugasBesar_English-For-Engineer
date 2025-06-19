@extends("layouts.page", ['currentPage' => 'about'])
<head>
    <title>About Us</title>
    {{-- ...elemen head lainnya... --}}
</head>

@section("content")
    {{-- Margin atas untuk menjauhkan konten dari navbar --}}
    <div class="container-fluid pt-5">
        <div class="container py-5">
            <h1 class="text-center mb-4">About Us</h1>
            <p class="text-center mb-5">
                Ini adalah halaman tentang kami. Di sini Anda bisa mengenal tim kami.
            </p>

            <div class="row g-4"> {{-- Gunakan g-4 untuk jarak antar kolom --}}
                {{-- Frame Foto 1 --}}
                <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
                    {{-- Tambahkan text-center di sini untuk meratakan semua konten di dalam team-item --}}
                    <div class="team-item bg-light rounded p-4 text-center">
                        <a href="#">
                            <img class="img-fluid rounded-circle mb-3" src="{{ asset('img/anggota/chikal.jpg') }}" alt="Foto Orang 1">
                        </a>
                        <h5>Nama Orang 1</h5>
                        <span>Jabatan 1</span>
                    </div>
                </div>

                {{-- Frame Foto 2 --}}
                <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
                    <div class="team-item bg-light rounded p-4 text-center">
                         <a href="#">
                            <img class="img-fluid rounded-circle mb-3" src="{{ asset('img/anggota/chikal.jpg') }}" alt="Foto Orang 2">
                        </a>
                        <h5>Nama Orang 2</h5>
                        <span>Jabatan 2</span>
                    </div>
                </div>

                {{-- Frame Foto 3 --}}
                <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.5s">
                    <div class="team-item bg-light rounded p-4 text-center">
                         <a href="#">
                            {{-- Saya hapus inline style width dan height karena img-fluid dan rounded-circle sudah cukup --}}
                            <img class="img-fluid rounded-circle mb-3" src="{{ asset('img/anggota/chikal.jpg') }}" alt="Foto Orang 3">
                        </a>
                        <h5>Nama Orang 3</h5>
                        <span>Jabatan 3</span>
                    </div>
                </div>

                {{-- Frame Foto 4 --}}
                <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
                    <div class="team-item bg-light rounded p-4 text-center">
                         <a href="#">
                            <img class="img-fluid rounded-circle mb-3" src="{{ asset('img/anggota/chikal.jpg') }}" alt="Foto Orang 4">
                        </a>
                        <h5>Nama Orang 4</h5>
                        <span>Jabatan 4</span>
                    </div>
                </div>

                {{-- Frame Foto 5 --}}
                <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
                    <div class="team-item bg-light rounded p-4 text-center">
                         <a href="#">
                            <img class="img-fluid rounded-circle mb-3" src="{{ asset('img/anggota/chikal.jpg') }}" alt="Foto Orang 5">
                        </a>
                        <h5>Nama Orang 5</h5>
                        <span>Jabatan 5</span>
                    </div>
                </div>

                {{-- Frame Foto 6 --}}
                <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.5s">
                    <div class="team-item bg-light rounded p-4 text-center">
                         <a href="#">
                            <img class="img-fluid rounded-circle mb-3" src="{{ asset('img/anggota/chikal.jpg') }}" alt="Foto Orang 6">
                        </a>
                        <h5>Nama Orang 6</h5>
                        <span>Jabatan 6</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection