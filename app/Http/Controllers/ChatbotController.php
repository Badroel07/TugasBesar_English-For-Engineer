<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http; // Untuk Guzzle HTTP client
use Illuminate\Support\Facades\Log; // Untuk logging error

class ChatbotController extends Controller
{
    public function sendMessage(Request $request)
    {
        $userMessage = $request->input('message');
        $botResponse = "Maaf, saya sedang tidak bisa memproses permintaan Anda saat ini."; // Default error message

        if (empty($userMessage)) {
            return response()->json(['response' => 'Pesan tidak boleh kosong.'], 400);
        }

        // Ambil API Key dari .env atau config/services.php
        $geminiApiKey = config('services.gemini.api_key'); // Jika Anda menambahkan di config/services.php
        // Atau langsung dari env: $geminiApiKey = env('GEMINI_API_KEY');

        if (!$geminiApiKey) {
            Log::error('GEMINI_API_KEY not set in environment.');
            return response()->json(['response' => 'Error: API key tidak dikonfigurasi.'], 500);
        }

        try {
            // Panggil Gemini API
            // Coba dengan gemini-1.5-flash
$response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$geminiApiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $userMessage],
                        ],
                    ],
                ],
                // Optional: Anda bisa menambahkan 'safety_settings' atau 'generation_config'
                // Baca dokumentasi Gemini API untuk lebih lanjut
            ]);

            $responseData = $response->json();

            // Cek apakah ada respons dari Gemini dan ekstrak teksnya
            if (isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
                $botResponse = $responseData['candidates'][0]['content']['parts'][0]['text'];
            } else {
                Log::warning('Gemini API did not return expected response structure.', $responseData);
                $botResponse = "Maaf, ada masalah dalam mendapatkan respons dari AI.";
            }

        } catch (\Exception $e) {
            // Tangani error jika terjadi masalah dengan request HTTP
            Log::error('Error calling Gemini API: ' . $e->getMessage());
            $botResponse = "Maaf, terjadi kesalahan teknis. Silakan coba lagi nanti.";
        }

        return response()->json(['response' => $botResponse]);
    }
}