<div class="d-flex flex-column text-left mb-3">
    <p class="section-title pr-5">
        <span class="pr-2">Chapter {{$chapterId}}</span>
    </p>
    <h1 class="mb-3">{{$chapterTitle}}</h1>
    <div class="d-flex">
        <p class="mr-3"><i class="fa fa-user text-primary"></i> Admin</p>
        <p class="mr-3">
            <i class="fa fa-folder text-primary"></i> Web Design
        </p>
        <p class="mr-3"><i class="fa fa-comments text-primary"></i> 15</p>
    </div>
</div>
<div class="mb-5">
        <!-- Elemen tersembunyi yang menyimpan NAMA FILE cerita untuk dibaca JS -->
            <div id="story-info" data-story-file="{{ $storyFileName }}" style="display:none;"></div> 
    <img class="img-fluid rounded w-100 mb-4" src="{{asset('img/detail.jpg')}}" alt="Image" />
<p id="story-content" style="text-align: justify;" line-height="1.5">
    {{-- Konten cerita akan dimuat di sini oleh JavaScript --}}
    Loading story content...
</p> {{-- Beri ID agar bisa diakses JS --}}

        <hr>
        <p>Setelah membaca cerita di atas, jawablah pertanyaan-pertanyaan berikut:</p>

        {{-- AREA BARU UNTUK SOAL DAN JAWABAN --}}
        <div id="questions-area">
            <p>Loading questions...</p>
        </div>
        {{-- AKHIR AREA BARU UNTUK SOAL DAN JAWABAN --}}
</div>

<!-- Related Post
<div class="mb-5 mx-n3">
    <h2 class="mb-4 ml-3">Related Post</h2>
    <div class="owl-carousel post-carousel position-relative">
        <div class="d-flex align-items-center bg-light shadow-sm rounded overflow-hidden mx-3">
            <img class="img-fluid" src="img/post-1.jpg" style="width: 80px; height: 80px" />
            <div class="pl-3">
                <h5 class="">Diam amet eos at no eos</h5>
                <div class="d-flex">
                    <small class="mr-3"><i class="fa fa-user text-primary"></i> Admin</small>
                    <small class="mr-3"><i class="fa fa-folder text-primary"></i> Web
                        Design</small>
                    <small class="mr-3"><i class="fa fa-comments text-primary"></i> 15</small>
                </div>
            </div>
        </div>
        <div class="d-flex align-items-center bg-light shadow-sm rounded overflow-hidden mx-3">
            <img class="img-fluid" src="img/post-2.jpg" style="width: 80px; height: 80px" />
            <div class="pl-3">
                <h5 class="">Diam amet eos at no eos</h5>
                <div class="d-flex">
                    <small class="mr-3"><i class="fa fa-user text-primary"></i> Admin</small>
                    <small class="mr-3"><i class="fa fa-folder text-primary"></i> Web
                        Design</small>
                    <small class="mr-3"><i class="fa fa-comments text-primary"></i> 15</small>
                </div>
            </div>
        </div>
        <div class="d-flex align-items-center bg-light shadow-sm rounded overflow-hidden mx-3">
            <img class="img-fluid" src="img/post-3.jpg" style="width: 80px; height: 80px" />
            <div class="pl-3">
                <h5 class="">Diam amet eos at no eos</h5>
                <div class="d-flex">
                    <small class="mr-3"><i class="fa fa-user text-primary"></i> Admin</small>
                    <small class="mr-3"><i class="fa fa-folder text-primary"></i> Web
                        Design</small>
                    <small class="mr-3"><i class="fa fa-comments text-primary"></i> 15</small>
                </div>
            </div>
        </div>
    </div>
</div> -->