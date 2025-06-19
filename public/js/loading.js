  document.addEventListener('DOMContentLoaded', function() {
        const storyInfo = document.getElementById('story-info');
        const storyContent = document.getElementById('story-content');
        const storyLoadingSpinner = document.getElementById('story-loading-spinner');
        const questionsArea = document.getElementById('questions-area');
        const questionsContent = document.getElementById('questions-content');
        const questionsLoadingSpinner = document.getElementById('questions-loading-spinner');

        const storyFileName = storyInfo.dataset.storyFile;

        // Function to load story content
        async function loadStoryContent() {
            storyLoadingSpinner.style.display = 'block'; // Show spinner
            storyContent.style.display = 'none'; // Hide content
            try {
                const response = await fetch(`/stories/${storyFileName}`); // Assuming your stories are in a 'stories' directory
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const storyText = await response.text();
                storyContent.innerHTML = storyText;
            } catch (error) {
                console.error("Error loading story content:", error);
                storyContent.innerHTML = "<p>Failed to load story content.</p>";
            } finally {
                storyLoadingSpinner.style.display = 'none'; // Hide spinner
                storyContent.style.display = 'block'; // Show content
            }
        }

        // Function to load questions
        async function loadQuestions() {
            questionsLoadingSpinner.style.display = 'block'; // Show spinner
            questionsContent.style.display = 'none'; // Hide content
            try {
                // Replace with your actual API endpoint or method to fetch questions
                const response = await fetch('/api/questions'); 
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const questionsData = await response.json();
                let questionsHtml = '';
                questionsData.forEach((question, index) => {
                    questionsHtml += `<p><strong>${index + 1}. ${question.text}</strong></p>`;
                    if (question.options) {
                        question.options.forEach(option => {
                            questionsHtml += `<input type="radio" name="q${index}" value="${option}"> ${option}<br>`;
                        });
                    }
                    questionsHtml += `<br>`;
                });
                questionsContent.innerHTML = questionsHtml;
            } catch (error) {
                console.error("Error loading questions:", error);
                questionsContent.innerHTML = "<p>Failed to load questions.</p>";
            } finally {
                questionsLoadingSpinner.style.display = 'none'; // Hide spinner
                questionsContent.style.display = 'block'; // Show content
            }
        }

        loadStoryContent();
        loadQuestions();
    });