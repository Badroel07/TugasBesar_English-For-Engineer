<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MateriController; // Pastikan diimpor
use App\Http\Controllers\ChapterController; // Pastikan diimpor
use App\Http\Controllers\dragdropController; // Pastikan diimpor

Route::get('/', function () {
    return view('pages.home');
});

Route::get('/about', function () {
    return view('pages.about/index');
});

Route::get('/genres', function () {
    return view('pages.genres');
});

Route::get('/chapter/{chapterId}', [ChapterController::class, 'show'])->name('chapter.show');

// Ini adalah route BARU untuk menggenerate soal
Route::post('/generate-questions', [MateriController::class, 'generateQuestions']);
// Ini adalah route BARU untuk menganalisis jawaban
Route::post('/analyze-answers', [MateriController::class, 'analyzeAnswers']);

// Rute API baru untuk mengambil konten file cerita (ini yang akan dipanggil JS)
Route::post('/get-story-file-content', [ChapterController::class, 'getStoryFileContent'])->name('story.get_content');
