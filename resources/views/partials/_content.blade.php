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
    <div id="story-info" data-story-file="{{ $storyFileName }}" style="display:none;"></div> 
    <img class="img-fluid rounded w-100 mb-4" src="{{asset('img/detail.jpg')}}" alt="Image" />
    <div id="story-loading-spinner" class="loading-spinner"></div>
    <p id="story-content" style="text-align: justify; line-height: 1.5; display: none;">
        {{-- Konten cerita akan dimuat di sini oleh JavaScript --}}
    </p> 

    <hr>
    <p>After reading the story above, answer the following questions:</p>

    {{-- AREA BARU UNTUK SOAL DAN JAWABAN --}}
    <div id="questions-area">
        <div id="questions-loading-spinner" class="loading-spinner"></div>
        <p id="questions-content" style="display: none;">Loading questions...</p>
    </div>
    {{-- AKHIR AREA BARU UNTUK SOAL DAN JAWABAN --}}
</div>