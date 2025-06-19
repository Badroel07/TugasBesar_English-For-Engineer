<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MateriController; // Pastikan diimpor
use App\Http\Controllers\ChapterController; // Pastikan diimpor

Route::get('/', function () {
    return view('pages.home');
});

Route::get('/about', function () {
    return view('pages.about/index');
});

Route::get('/genres', function () {
    return view('pages.genres');
});

Route::get('/chapter', function () {
    return view('pages.chapter.index');
});

Route::get('/chapter/{chapterId}', [ChapterController::class, 'show'])->name('chapter.show');

Route::get('/chapter/2', function () {
    return view('pages.chapter.detail_2');
});

Route::get('/chapter/3', function () {
    return view('pages.chapter.detail_3');
});

Route::get('/chapter/4', function () {
    return view('pages.chapter.detail_4');
});

Route::get('/chapter/5', function () {
    return view('pages.chapter.detail_5');
});

Route::get('/chapter/6', function () {
    return view('pages.chapter.detail_6');
});

Route::get('/chapter/7', function () {
    return view('pages.chapter.detail_7');
});

// Ini adalah route BARU untuk menggenerate soal
Route::post('/generate-questions', [MateriController::class, 'generateQuestions']);
// Ini adalah route BARU untuk menganalisis jawaban
Route::post('/analyze-answers', [MateriController::class, 'analyzeAnswers']);

// Rute API baru untuk mengambil konten file cerita (ini yang akan dipanggil JS)
Route::post('/get-story-file-content', [ChapterController::class, 'getStoryFileContent'])->name('story.get_content');
