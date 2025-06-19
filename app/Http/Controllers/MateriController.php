<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MateriController extends Controller
{
    private $geminiApiKey;
    private $geminiModel = 'gemini-1.5-flash'; // Ensure this model works

    public function __construct()
    {
        $this->geminiApiKey = config('services.gemini.api_key');
    }

    // Removed showMateriSoal() as per user request to no longer generate stories.
    // The story will now be provided by the frontend.

    /**
     * Generates HOTS questions based on a provided story.
     * The story content is expected to be sent in the request body.
     * Returns a JSON response containing the generated questions or an error.
     */
    public function generateQuestions(Request $request)
    {
        $story = $request->input('story'); // Get the story content from the frontend
        
        // Initialize questions as an empty array to ensure consistent return type
        $questions = [];

        if (!$this->geminiApiKey) {
            Log::error('GEMINI_API_KEY is not set for question generation.');
            // Return an array with an error object for consistent frontend handling
            return response()->json(['questions' => [['error' => 'API key is not configured. Please check server settings.']]], 500);
        }
        
        if (empty($story)) {
            Log::warning('No story provided for question generation.');
            // Return an array with an error object
            return response()->json(['questions' => [['error' => 'No story provided to generate questions from.']]], 400);
        }

        try {
            $prompt = "Based on the following story, generate 5 HOTS (Higher-Order Thinking Skills) questions in English. Ensure the questions require analysis, synthesis, or evaluation, not just recall. For each question, provide a brief expected answer or key points.\n\nStory:\n\"\"\"" . $story . "\"\"\"\n\nQuestions (format as JSON array of objects, each with 'question' and 'key_answer' properties):";

            $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/{$this->geminiModel}:generateContent?key={$this->geminiApiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.7, // Slightly less creative for clear question format
                    'maxOutputTokens' => 700, // Enough for 5 questions + answer keys
                    'responseMimeType' => 'application/json', // Request JSON response
                ],
            ]);

            $responseData = $response->json();

            // Check if candidates and content exist in the response
            if (isset($responseData['candidates'][0]['content'])) {
                $generatedContent = $responseData['candidates'][0]['content'];
                
                // Ensure text content exists (where the JSON string is expected)
                if (isset($generatedContent['parts'][0]['text'])) {
                    $jsonString = $generatedContent['parts'][0]['text'];
                    // Remove Markdown code block delimiters if AI added them
                    $jsonString = trim($jsonString, "```json\n");
                    $jsonString = trim($jsonString, "```\n");
                    
                    $parsedQuestions = json_decode($jsonString, true);
                    
                    // Validate if JSON parsing was successful and result is an array
                    if (json_last_error() === JSON_ERROR_NONE && is_array($parsedQuestions)) {
                        $questions = $parsedQuestions; // Assign the parsed array
                    } else {
                        Log::error('Failed to parse questions JSON from Gemini.', ['jsonString' => $jsonString, 'json_last_error' => json_last_error_msg()]);
                        // Return an array with an error object
                        $questions = [['error' => 'Failed to parse questions from AI. (Invalid JSON response from model)']]; 
                    }
                } else {
                    Log::warning('Gemini API did not return text content for questions.', $responseData);
                    // Return an array with an error object
                    $questions = [['error' => 'AI did not generate text content for questions.']];
                }
            } else {
                Log::warning('Gemini API did not return expected question structure.', $responseData);
                // Return an array with an error object
                $questions = [['error' => 'AI response structure for questions was unexpected.']];
            }

        } catch (\Exception $e) {
            Log::error('Error calling Gemini API for questions: ' . $e->getMessage());
            // Return an array with an error object
            $questions = [['error' => 'Technical error generating questions: ' . $e->getMessage()]];
        }

        // Always return a JSON response with 'questions' as an array
        return response()->json(['questions' => $questions]);
    }


    /**
     * Analyzes user answers based on the story and questions.
     * Story, questions, and user answers are expected in the request body.
     * Returns a JSON response containing the analysis results or an error.
     */
       // METHOD BARU UNTUK MENGANALISIS JAWABAN PENGGUNA
    public function analyzeAnswers(Request $request)
    {
        $story = $request->input('story');
        $questions = $request->input('questions'); // Array pertanyaan dari frontend
        $userAnswers = $request->input('userAnswers'); // Array jawaban pengguna dari frontend

        $analysisResult = "Gagal menganalisis jawaban.";

        if (!$this->geminiApiKey) {
            Log::error('GEMINI_API_KEY tidak diatur untuk analisis jawaban.');
            return response()->json(['analysis' => $analysisResult, 'error' => 'Kunci API tidak dikonfigurasi.'], 500);
        }

        if (empty($story) || empty($questions) || empty($userAnswers)) {
            return response()->json(['analysis' => 'Data tidak lengkap untuk analisis.'], 400);
        }

        try {
            $prompt = "Anda adalah asisten AI yang dirancang untuk mengevaluasi jawaban siswa secara ketat.
            Berdasarkan cerita, pertanyaan, dan jawaban yang diharapkan yang diberikan berikut ini, analisis setiap jawaban pengguna.
            
            **Kriteria Evaluasi:**
            - **Benar:** Jawaban pengguna akurat, lengkap, dan langsung menjawab pertanyaan berdasarkan cerita dan jawaban yang diharapkan.
            - **Sebagian Benar:** Jawaban pengguna mengandung beberapa elemen yang benar tetapi tidak lengkap, samar, atau mengandung ketidakakuratan kecil.
            - **Salah:** Jawaban pengguna sebagian besar salah, tidak relevan, atau bertentangan dengan informasi dalam cerita atau jawaban yang diharapkan.
            
            **Instruksi:**
            - Bersikaplah ketat dalam evaluasi Anda. Jika jawaban tidak sepenuhnya benar, tandai sebagai 'Sebagian Benar' atau 'Salah'.
            - Berikan penjelasan singkat namun jelas untuk penilaian Anda, khususnya sebutkan *mengapa* itu benar, sebagian benar, atau salah, merujuk pada cerita atau jawaban yang diharapkan jika berlaku.
            - Format respons Anda sebagai array JSON objek.

            Cerita:\n\"\"\"" . $story . "\"\"\"\n\nPertanyaan dan Jawaban Pengguna:\n";
            
            // Tambahkan pertanyaan dan jawaban pengguna ke prompt
            foreach ($questions as $index => $q) {
                $prompt .= ($index + 1) . ". Pertanyaan: " . $q['question'] . "\n";
                $prompt .= "   Jawaban Pengguna: " . (isset($userAnswers[$index]) ? $userAnswers[$index] : 'Tidak ada jawaban yang diberikan') . "\n";
                $prompt .= "   Jawaban yang Diharapkan: " . (isset($q['key_answer']) ? $q['key_answer'] : 'N/A') . "\n"; // Sangat penting bagi AI untuk referensi
            }
            $prompt .= "\nAnalisis (array JSON objek, masing-masing dengan properti 'question_number', 'status', dan 'explanation'):";


            $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/{$this->geminiModel}:generateContent?key={$this->geminiApiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.2, // Suhu lebih rendah untuk respons yang lebih faktual dan tidak terlalu kreatif
                    'maxOutputTokens' => 700,
                    'responseMimeType' => 'application/json', // Minta respons JSON
                ],
            ]);

            $responseData = $response->json();
            
            if (isset($responseData['candidates'][0]['content'])) {
                $generatedContent = $responseData['candidates'][0]['content'];
                
                if (isset($generatedContent['parts'][0]['text'])) {
                    $jsonString = $generatedContent['parts'][0]['text'];
                    $jsonString = trim($jsonString, "```json\n");
                    $jsonString = trim($jsonString, "```\n");
                    
                    $parsedAnalysis = json_decode($jsonString, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($parsedAnalysis)) {
                        $analysisResult = $parsedAnalysis;
                    } else {
                        Log::error('Gagal mengurai JSON analisis dari Gemini.', ['jsonString' => $jsonString, 'json_last_error' => json_last_error_msg()]);
                        $analysisResult = "Gagal mengurai analisis dari AI. (Respons JSON tidak valid)";
                    }
                } else {
                    Log::warning('Gemini API tidak mengembalikan konten teks untuk analisis.', $responseData);
                    $analysisResult = "AI tidak menghasilkan teks untuk analisis.";
                }
            } else {
                Log::warning('Gemini API tidak mengembalikan struktur analisis yang diharapkan.', $responseData);
                $analysisResult = "Struktur respons AI untuk analisis tidak terduga.";
            }

        } catch (\Exception $e) {
            Log::error('Kesalahan saat memanggil Gemini API untuk analisis: ' . $e->getMessage());
            $analysisResult = "Kesalahan teknis dalam menganalisis jawaban.";
        }

        return response()->json(['analysis' => $analysisResult]);
    }
}
