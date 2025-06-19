<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File; // Import the File facade for file operations
use Illuminate\Support\Facades\Log;   // Import Log for error logging

class ChapterController extends Controller
{
    /**
     * Display a specific chapter page.
     * This method renders the Blade view and passes the story file name to it.
     * The actual story content will be loaded by JavaScript via an AJAX call.
     *
     * @param  string  $chapterId The ID or slug of the chapter to display.
     * @return \Illuminate\View\View|\Illuminate\Http\Response
     */
     public function show($chapterId) // <-- $chapterId adalah parameter dinamis dari URL
    {
        // --- Contoh data chapter (Anda bisa mengambil dari database di sini) ---
        // Array ini memetakan ID chapter ke NAMA FILE cerita yang sesuai.
        $chapters = [
            '1' => [
                'title' => 'The Magical Pencil',
                'file_name' => 'chapter1.txt' // File untuk Chapter 1
            ],
            '2' => [
                'title' => 'The Whispering Map',
                'file_name' => 'chapter2.txt' // File untuk Chapter 2
            ],
            '3' => [
                'title' => 'The Enchanted Forest',
                'file_name' => 'chapter3.txt' // File untuk Chapter 3
            ],
            '4' => [
                'title' => 'The Lost Treasure',
                'file_name' => 'chapter4.txt' // File untuk Chapter 4
            ],
            '5' => [
                'title' => 'The Secret Potion',
                'file_name' => 'chapter5.txt' // File untuk Chapter 5
            ],
            '6' => [
                'title' => 'The Time Traveler',
                'file_name' => 'chapter6.txt' // File untuk Chapter 6
            ],
            '7' => [
                'title' => 'The Dragon\'s Quest',
                'file_name' => 'chapter7.txt' // File untuk Chapter 7
            ],
            // Anda bisa menambahkan pemetaan bab lain di sini
            // '3' => ['title' => 'Another Adventure', 'file_name' => 'chapter3.txt'],
        ];

        $chapterData = $chapters[$chapterId] ?? null; // <-- Mengambil data berdasarkan $chapterId

        if (!$chapterData) {
            abort(404, 'Chapter not found.');
        }

        return view('pages.chapter.index', [
            'chapterId' => $chapterId,
            'chapterTitle' => $chapterData['title'],
            'storyFileName' => $chapterData['file_name'] // <-- Mengirim nama file yang dipilih secara dinamis
        ]);
    }

    /**
     * Reads the content of a specified story file from the public/stories directory.
     * This method acts as an API endpoint, called by frontend JavaScript.
     * It includes security measures to prevent path traversal and restrict file types.
     *
     * @param Request $request The incoming HTTP request, expecting 'file_name'.
     * @return \Illuminate\Http\JsonResponse A JSON response with 'storyContent' or an 'error'.
     */
    public function getStoryFileContent(Request $request)
    {
        $fileName = $request->input('file_name'); // Get the file name from the AJAX request

        if (empty($fileName)) {
            Log::error('Attempt to get story file content without a file name.');
            return response()->json(['error' => 'File name is missing.'], 400);
        }

        // --- IMPORTANT Security Measure: Sanitize filename and build path ---
        // basename() prevents path traversal attacks (e.g., trying to access ../../.env)
        $safeFileName = basename($fileName); 
        // public_path() ensures the file is accessed from the public directory
        $filePath = public_path('stories/' . $safeFileName);

        // Check if the file exists at the constructed path
        if (!File::exists($filePath)) {
            Log::error("Story file not found: {$filePath}");
            return response()->json(['error' => 'Story file not found.'], 404);
        }
        
        // --- IMPORTANT Security Measure: Restrict file extension ---
        // Ensure only .txt files can be accessed
        if (pathinfo($filePath, PATHINFO_EXTENSION) !== 'txt') {
             Log::error("Attempted to access non-txt file: {$filePath} via getStoryFileContent.");
             return response()->json(['error' => 'Invalid file type. Only .txt files are allowed.'], 403);
        }

        try {
            // Read the content of the file
            $content = File::get($filePath);
            // Return the file content as a JSON response
            return response()->json(['storyContent' => $content]);
        } catch (\Exception $e) {
            // Log any errors during file reading
            Log::error("Error reading story file {$filePath}: " . $e->getMessage());
            return response()->json(['error' => 'Failed to read story content due to server error.'], 500);
        }
    }
}
