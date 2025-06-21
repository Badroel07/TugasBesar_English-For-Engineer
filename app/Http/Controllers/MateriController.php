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
            $prompt = "Based on the following story, generate 5 HOTS (Higher-Order Thinking Skills) questions in English (DO NOT TOO DIFFICULT). Ensure the questions require analysis, synthesis, or evaluation, not just recall. For each question, provide a brief expected answer or key points.\n\nStory:\n\"\"\"" . $story . "\"\"\"\n\nQuestions (format as JSON array of objects, each with 'question' and 'key_answer' properties):";

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
    public function analyzeAnswers(Request $request)
    {
        $story = $request->input('story');
        $questions = $request->input('questions'); // Array of questions from frontend
        $userAnswers = $request->input('userAnswers'); // Array of user answers from frontend

        $analysisResult = "Failed to analyze answers.";

        if (!$this->geminiApiKey) {
            Log::error('GEMINI_API_KEY is not set for answer analysis.');
            return response()->json(['analysis' => $analysisResult, 'error' => 'API key is not configured.'], 500);
        }

        if (empty($story) || empty($questions) || empty($userAnswers)) {
            return response()->json(['analysis' => 'Incomplete data for analysis.'], 400);
        }

        try {
            // Start building the prompt with overall instructions and the story
            $prompt = "You are an AI assistant designed to provide an **STRICT** evaluation of student answers.
            Your task is to analyze each user answer **ABSOLUTELY INDIVIDUALLY and SOLELY AGAINST** the **exact specific question** it corresponds to. General story knowledge IS NOT to be used for validation if the answer does not directly address the question's specifics.

            **EXTREMELY STRICT Evaluation Criteria (Adhere to these definitions only):**
            - **Correct:** The user's answer MUST be 99% ACCURATE, and DIRECTLY address THIS SPECIFIC question's intent according to the story and the question.
            - **Partially Correct:** (This status should be used **EXTREMELY RARELY**. If there is any ambiguity or significant missing information, default to 'Incorrect'.) This status applies only if a user's answer is *almost* perfect but has a single, minor, unambiguous, and easily identifiable flaw that does not fundamentally change the core meaning for THIS SPECIFIC QUESTION. For example, a typo that does not change the meaning.
            - **Incorrect:** This is the default status for almost all non-'Correct' answers. The user's answer is largely WRONG for THIS QUESTION, completely irrelevant to THIS QUESTION's intent, contradicts information in the story specific to THIS QUESTION, or CLEARLY DOES NOT MATCH the expected answer for THIS QUESTION in any significant way. This includes answers that are broadly true to the story but do not specifically and precisely answer *this exact question*. Any deviation, vagueness, or attempt to generalize from the story where specificity is required, will result in 'Incorrect'.

            **ABSOLUTE CRITICAL Instructions - Adhere Without Exception:**
            - Short but correct answers are allowed
            - DO NOT compare the user's answer for one question with *any other* question or expected answer. Each is an isolated evaluation.
            - The explanation MUST explicitly refer to why the user's answer *precisely matches or unequivocally fails to precisely match* the specific question and its expected answer. For 'Incorrect' answers, clearly state what makes it fall short of the specific question's requirements, referring to the discrepancy with the expected answer or the story's specific details for *that question*.

            **Story:**
            \"\"\"" . $story . "\"\"\"\n\n";
            
            $analysisSections = []; // To build sections for each question evaluation

            // Iterate through each question and its corresponding user answer to build distinct evaluation blocks
            foreach ($questions as $index => $q) {
                $questionNumber = $index + 1;
                $userAnswer = isset($userAnswers[$index]) ? $userAnswers[$index] : 'No answer provided';
                $keyAnswer = isset($q['key_answer']) ? $q['key_answer'] : 'N/A';

                // Append a distinct evaluation block for each question
                $analysisSections[] = "
                ### Evaluation for Question " . $questionNumber . ":
                - **Question:** " . $q['question'] . "
                - **User Answer:** " . $userAnswer . "
                - **Expected Answer:** " . $keyAnswer . "
                "; 
            }

            // Combine all analysis sections into the main prompt
            $prompt .= implode("\n", $analysisSections);

            // Add the final instruction for the desired JSON format
            $prompt .= "\nPlease provide your analysis results in a JSON array of objects, where each object represents the analysis for one question and has 'question_number', 'status', and 'explanation' properties. Example: [{'question_number': 1, 'status': 'Correct', 'explanation': '...'}]";


            $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/{$this->geminiModel}:generateContent?key={$this->geminiApiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.1, // Lower temperature for stricter, more factual responses
                    'maxOutputTokens' => 700,
                    'responseMimeType' => 'application/json', // Request JSON response
                ],
            ]);

            $responseData = $response->json();
            
            if (isset($responseData['candidates'][0]['content'])) {
                $generatedContent = $responseData['candidates'][0]['content'];
                
                if (isset($generatedContent['parts'][0]['text'])) {
                    $jsonString = $generatedContent['parts'][0]['text'];
                    // Remove Markdown code block delimiters if AI added them
                    $jsonString = trim($jsonString, "```json\n");
                    $jsonString = trim($jsonString, "```\n");
                    
                    $parsedAnalysis = json_decode($jsonString, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($parsedAnalysis)) {
                        $analysisResult = $parsedAnalysis;
                    } else {
                        Log::error('Failed to parse analysis JSON from Gemini.', ['jsonString' => $jsonString, 'json_last_error' => json_last_error_msg()]);
                        $analysisResult = "Failed to parse analysis from AI. (Invalid JSON response)";
                    }
                } else {
                    Log::warning('Gemini API did not return text content for analysis.', $responseData);
                    $analysisResult = "AI did not generate text content for analysis.";
                }
            } else {
                Log::warning('Gemini API did not return expected analysis structure.', $responseData);
                $analysisResult = "AI response structure for analysis was unexpected.";
            }

        } catch (\Exception $e) {
            Log::error('Error calling Gemini API for analysis: ' . $e->getMessage());
            $analysisResult = "Technical error analyzing answers.";
        }

        return response()->json(['analysis' => $analysisResult]);
    }
}
// Note: The above code is designed to handle the generation of questions and analysis of answers based on a provided story.
// It includes error handling, logging, and ensures the responses are in a consistent JSON format for frontend consumption.