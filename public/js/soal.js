// Display loading spinner animation while fetching story and questions data
document.addEventListener('DOMContentLoaded', function() {
    // --- Global Variables for Quiz and DOM Elements ---
    const storyInfoElement = document.getElementById('story-info'); 
    const storyContentElement = document.getElementById('story-content'); 
    const storyLoadingSpinner = document.getElementById('story-loading-spinner');

    const questionsArea = document.getElementById('questions-area');
    // questionsContent is not needed here as questionsArea will be directly populated with the form
    const questionsLoadingSpinner = document.getElementById('questions-loading-spinner');

    let generatedQuestions = []; // To store generated questions

    // --- Check if essential DOM elements are found ---
    if (!storyInfoElement || !storyContentElement || !storyLoadingSpinner || !questionsArea || !questionsLoadingSpinner) {
        console.error("One or more essential DOM elements not found. Ensure HTML IDs are correct.");
        // You could display a more user-friendly error message here
        if (!storyContentElement) { /* display error message */ }
        if (!questionsArea) { /* display error message */ }
        return; // Stop script execution if essential elements are missing
    }

    
// Function to load story and generate questions
    async function loadStoryAndQuestions() {
        const storyFileName = storyInfoElement.dataset.storyFile; // storyInfoElement is guaranteed to exist due to check above

        if (!storyFileName) {
            console.error("Story file name not found in 'story-info' element. Ensure data-story-file attribute exists and contains a file name.");
            questionsArea.innerHTML = '<p class="text-danger">Error: Story file name could not be found. Please contact the administrator.</p>';
            return;
        }

        // --- Display Story Spinner and Hide Story Content ---
        storyLoadingSpinner.style.display = 'block'; 
        storyContentElement.style.display = 'none';

        // --- Display Questions Spinner and Clear Questions Area (except spinner) ---
        // Important: Do not clear questionsArea.innerHTML immediately, as the spinner is inside it.
        // Just ensure the spinner is visible and no other content.
        questionsLoadingSpinner.style.display = 'block';
        questionsArea.innerHTML = '<div id="questions-loading-spinner" class="loading-spinner"></div>'; // Re-insert spinner, will be removed later
        // Note: A better way would be to hide the <p id="questions-content"> element
        // and ensure the spinner is the only thing visible in questionsArea initially.

        let story = '';
        try {
            // Step 1: Fetch story content from the backend
            const storyResponse = await fetch('/get-story-file-content', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ file_name: storyFileName }) 
            });

            if (!storyResponse.ok) {
                const errorData = await storyResponse.json().catch(() => ({})); 
                throw new Error(`HTTP error fetching story: Status ${storyResponse.status} - ${storyResponse.statusText}. Details: ${JSON.stringify(errorData)}`);
            }
            const storyData = await storyResponse.json();
            if (storyData.storyContent) {
                story = storyData.storyContent;
                storyContentElement.innerHTML = story; 
            } else {
                throw new Error('Story content not found in response from backend.');
            }

        } catch (storyError) {
            console.error('Error fetching story content:', storyError);
            storyContentElement.innerHTML = `<p class="text-danger">Error loading story: ${storyError.message}</p>`;
            questionsArea.innerHTML = `<p class="text-danger">Error loading story content: ${storyError.message}</p>`;
            
            // Hide story spinner and show content (error message)
            storyLoadingSpinner.style.display = 'none';
            storyContentElement.style.display = 'block';
            
            // Hide questions spinner as well if story failed to load
            questionsLoadingSpinner.style.display = 'none';
            // Clean up remaining spinner if present in questionsArea.innerHTML
            questionsArea.innerHTML = questionsArea.innerHTML.replace('<div id="questions-loading-spinner" class="loading-spinner"></div>', '');
            return; // Stop execution if story failed to load
        } finally {
            // Ensure story spinner is hidden after story loading attempt is complete
            storyLoadingSpinner.style.display = 'none';
            storyContentElement.style.display = 'block';
        }

        // Continue with question generation only if story loaded successfully
        if (story.length < 50) { 
            questionsArea.innerHTML = '<p class="text-warning">Story is too short to generate questions.</p>';
            questionsLoadingSpinner.style.display = 'none'; // Hide questions spinner
            return;
        }

        try {
            const response = await fetch('/generate-questions', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ story: story })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); 
                throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}. Details: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();

            if (data.questions && Array.isArray(data.questions)) {
                if (data.questions.length > 0 && data.questions[0].error) {
                    questionsArea.innerHTML = `<p class="text-danger">Error generating questions: ${data.questions[0].error}</p>`;
                    console.error('Backend error generating questions:', data.questions[0].error);
                } else {
                    generatedQuestions = data.questions; 
                    displayQuestions(generatedQuestions); // Call function to display quiz form
                }
            } else {
                questionsArea.innerHTML = '<p class="text-danger">Failed to load questions. Invalid response format from AI.</p>';
                console.error('Invalid questions response (not an array or missing questions key):', data);
            }

        } catch (error) {
            console.error('Error loading questions:', error);
            questionsArea.innerHTML = `<p class="text-danger">Error generating questions: ${error.message}. Please try refreshing the page.</p>`;
        } finally {
            // Hide questions spinner after generation process is complete (success or error)
            questionsLoadingSpinner.style.display = 'none';
        }
    }

    // Function to display questions on the page
    function displayQuestions(questions) {
        if (questions.length === 0 || (questions.length > 0 && questions[0].error)) {
            questionsArea.innerHTML = `<p class="text-danger">No questions to display or an error occurred while loading questions.</p>`;
            if (questions.length > 0 && questions[0].error) {
                questionsArea.innerHTML += `<p class="text-danger">Error Details: ${questions[0].error}</p>`;
            }
            return; 
        }

        let html = '<form id="question-form">';
        questions.forEach((q, index) => {
            html += `
                <div class="form-group mb-4">
                    <label for="answer-${index + 1}"><strong>${index + 1}. ${q.question}</strong></label>
                    <input type="text" id="answer-${index + 1}" class="form-control user-answer-input" name="answer[${index}]" required />
                </div>
            `;
        });
        html += `
            <button type="submit" class="btn btn-primary">Submit Answers</button>
        </form>`;
        questionsArea.innerHTML = html; // This will replace the entire content of questionsArea

        document.getElementById('question-form').addEventListener('submit', handleAnswerSubmission);
    }

    // Function to handle answer submission and send to backend
    async function handleAnswerSubmission(event) {
        event.preventDefault(); 

        const story = storyContentElement.textContent.trim(); 
        const userAnswers = [];
        let allAnswersFilled = true; 

        document.querySelectorAll('.user-answer-input').forEach(input => {
            const answer = input.value.trim();
            userAnswers.push(answer);
            if (answer === "") {
                allAnswersFilled = false; 
            }
        });

        if (!allAnswersFilled) {
            const warningDiv = document.createElement('div');
            warningDiv.classList.add('alert', 'alert-danger', 'mt-3');
            warningDiv.textContent = 'Please fill all answers before submitting.';
            questionsArea.prepend(warningDiv); 
            setTimeout(() => warningDiv.remove(), 3000); 
            return; 
        }

        // --- Display Questions Spinner During Answer Analysis ---
        // Hide the form and display spinner
        questionsArea.innerHTML = '<div id="questions-loading-spinner" class="loading-spinner"></div><p class="text-info mt-3">Analyzing your answers...</p>';
        questionsLoadingSpinner.style.display = 'block';


        console.log("User Answers collected:", userAnswers); 

        try {
            const response = await fetch('/analyze-answers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ 
                    story: story, 
                    questions: generatedQuestions, 
                    userAnswers: userAnswers 
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); 
                throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}. Details: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();

            if (data.analysis && Array.isArray(data.analysis)) {
                if (data.analysis.length > 0 && data.analysis[0].error) {
                    questionsArea.innerHTML = `<p class="text-danger">Error analyzing answers: ${data.analysis[0].error}</p>`;
                    console.error('Backend error analyzing answers:', data.analysis[0].error);
                } else {
                    displayAnalysisResults(data.analysis, userAnswers); 
                }
            } else {
                questionsArea.innerHTML = '<p class="text-danger">Failed to analyze your answers. Invalid AI response.</p>';
                console.error('Invalid analysis response:', data);
            }

        } catch (error) {
            console.error('Error submitting answers:', error);
            questionsArea.innerHTML = `<p class="text-danger">Error submitting answers: ${error.message}. Please try again.</p>`;
        } finally {
            questionsLoadingSpinner.style.display = 'none'; // Hide spinner after analysis
        }
    }

    // Function to display AI analysis results
    function displayAnalysisResults(analysisResults, userAnswers) {
        let resultsHtml = '<h3>Analysis Result:</h3>';
        let earnedPoints = 0; // Changed from correctCount to earnedPoints for fractional scoring
        const totalQuestions = generatedQuestions.length; 

        analysisResults.forEach(resultItem => {
            const lowerCaseStatus = resultItem.status ? resultItem.status.toLowerCase() : '';
            if (lowerCaseStatus === 'correct') {
                earnedPoints += 1; // 1 point for correct
            } else if (lowerCaseStatus === 'partially correct') {
                earnedPoints += 0.5; // 0.5 points for partially correct
            }
        });
        
        // Calculate score based on earned points out of total questions
        const score = (totalQuestions > 0) ? (earnedPoints / totalQuestions) * 100 : 0;
        
        resultsHtml += `<h3 class="mb-4">Your Score: ${score.toFixed(2)}%</h3>`;
        resultsHtml += `<h4 class="mb-4">Questions Graded: ${earnedPoints} out of ${totalQuestions} questions</h4>`; // Updated text

        analysisResults.forEach((resultItem, index) => {
            const originalQuestion = generatedQuestions[index] ? generatedQuestions[index].question : `Question ${index + 1}`;
            const originalUserAnswer = userAnswers[index] || 'No answer provided';

            let statusClass = 'text-warning'; 
            let statusIcon = '<i class="fa fa-question-circle"></i>';
            let statusText = 'Unknown';

            if (resultItem.status) {
                const lowerCaseStatus = resultItem.status.toLowerCase();
                
                // Use strict equality (===) to ensure the status is an exact match
                if (lowerCaseStatus === 'correct') { 
                    statusClass = 'text-success';
                    statusIcon = '<i class="fa fa-check-circle"></i>';
                    statusText = 'Correct';
                } else if (lowerCaseStatus === 'partially correct') { 
                    statusClass = 'text-info';
                    statusIcon = '<i class="fa fa-adjust"></i>';
                    statusText = 'Partially Correct';
                } else if (lowerCaseStatus === 'incorrect') { 
                    statusClass = 'text-danger';
                    statusIcon = '<i class="fa fa-times-circle"></i>';
                    statusText = 'Incorrect';
                } else if (lowerCaseStatus === 'irrelevant') { 
                    statusClass = 'text-secondary';
                    statusIcon = '<i class="fa fa-ban"></i>';
                    statusText = 'Irrelevant';
                } else {
                    // Fallback for any unexpected status
                    statusClass = 'text-warning'; 
                    statusIcon = '<i class="fa fa-question-circle"></i>';
                    statusText = 'Unknown Status';
                }
            }

            resultsHtml += `<div class="mb-3 p-3 border rounded ${statusClass.replace('text-', 'border-')}">`;
            resultsHtml += `<p><strong>Question ${index + 1}:</strong> ${originalQuestion}</p>`;
            resultsHtml += `<p><strong>Your Answer:</strong> ${originalUserAnswer}</p>`;
            resultsHtml += `<p><strong>Status:</strong> <span class="${statusClass} font-weight-bold">${statusIcon} ${statusText}</span></p>`;
            
            if (resultItem.explanation) {
                resultsHtml += `<p><strong>AI Explanation:</strong> ${resultItem.explanation}</p>`;
            }
            resultsHtml += `</div>`;
        });

        questionsArea.innerHTML = resultsHtml;
    }

    // Call main function to load story and questions when page is loaded
    if (storyInfoElement) {
        setTimeout(() => {
            loadStoryAndQuestions(); // Call the combined function
        }, 100); 
    }
});
