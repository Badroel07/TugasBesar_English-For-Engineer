document.addEventListener('DOMContentLoaded', function() {
    // --- Variabel Global untuk Quiz dan Elemen DOM ---
    const storyInfoElement = document.getElementById('story-info'); 
    const storyContentElement = document.getElementById('story-content'); 
    const storyLoadingSpinner = document.getElementById('story-loading-spinner');

    const questionsArea = document.getElementById('questions-area');
    // questionsContent tidak perlu di sini karena questionsArea akan diisi langsung dengan form
    const questionsLoadingSpinner = document.getElementById('questions-loading-spinner');

    let generatedQuestions = []; // Untuk menyimpan soal yang di-generate

    // --- Cek apakah elemen-elemen penting ditemukan ---
    if (!storyInfoElement || !storyContentElement || !storyLoadingSpinner || !questionsArea || !questionsLoadingSpinner) {
        console.error("Salah satu atau lebih elemen DOM penting tidak ditemukan. Pastikan ID HTML sudah benar.");
        // Anda bisa menampilkan pesan error yang lebih user-friendly di sini
        if (!storyContentElement) { /* tampilkan pesan error */ }
        if (!questionsArea) { /* tampilkan pesan error */ }
        return; // Hentikan eksekusi skrip jika elemen penting tidak ada
    }

    // Fungsi untuk memuat cerita dan menghasilkan soal
    async function loadStoryAndQuestions() {
        const storyFileName = storyInfoElement.dataset.storyFile; // storyInfoElement dijamin ada karena cek di atas

        if (!storyFileName) {
            console.error("Nama file cerita tidak ditemukan di elemen 'story-info'. Pastikan atribut data-story-file ada dan berisi nama file.");
            questionsArea.innerHTML = '<p class="text-danger">Error: Nama file cerita tidak dapat ditemukan. Mohon hubungi administrator.</p>';
            return;
        }

        // --- Tampilkan Spinner Cerita dan Sembunyikan Konten Cerita ---
        storyLoadingSpinner.style.display = 'block'; 
        storyContentElement.style.display = 'none';

        // --- Tampilkan Spinner Pertanyaan dan Kosongkan Area Pertanyaan (kecuali spinner) ---
        // Penting: Jangan kosongkan questionsArea.innerHTML dulu, karena spinner ada di dalamnya.
        // Cukup pastikan spinner terlihat dan tidak ada konten lain.
        questionsLoadingSpinner.style.display = 'block';
        questionsArea.innerHTML = '<div id="questions-loading-spinner" class="loading-spinner"></div>'; // Re-insert spinner, will be removed later
        // Note: Cara yang lebih baik adalah dengan menyembunyikan elemen <p id="questions-content">
        // dan memastikan spinner adalah satu-satunya yang terlihat di questionsArea pada awalnya.

        let story = '';
        try {
            // Langkah 1: Ambil konten cerita dari backend
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
            
            // Sembunyikan spinner cerita dan tampilkan konten (pesan error)
            storyLoadingSpinner.style.display = 'none';
            storyContentElement.style.display = 'block';
            
            // Sembunyikan spinner pertanyaan juga jika cerita gagal dimuat
            questionsLoadingSpinner.style.display = 'none';
            // Bersihkan sisa spinner jika ada di questionsArea.innerHTML
            questionsArea.innerHTML = questionsArea.innerHTML.replace('<div id="questions-loading-spinner" class="loading-spinner"></div>', '');
            return; // Hentikan eksekusi jika cerita gagal dimuat
        } finally {
            // Pastikan spinner cerita disembunyikan setelah percobaan loading cerita selesai
            storyLoadingSpinner.style.display = 'none';
            storyContentElement.style.display = 'block';
        }

        // Lanjutkan dengan menghasilkan pertanyaan hanya jika cerita berhasil dimuat
        if (story.length < 50) { 
            questionsArea.innerHTML = '<p class="text-warning">Cerita terlalu pendek untuk menghasilkan pertanyaan.</p>';
            questionsLoadingSpinner.style.display = 'none'; // Sembunyikan spinner pertanyaan
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
                    displayQuestions(generatedQuestions); // Panggil fungsi untuk menampilkan formulir kuis
                }
            } else {
                questionsArea.innerHTML = '<p class="text-danger">Failed to load questions. Invalid response format from AI.</p>';
                console.error('Invalid questions response (not an array or missing questions key):', data);
            }

        } catch (error) {
            console.error('Error loading questions:', error);
            questionsArea.innerHTML = `<p class="text-danger">Error generating questions: ${error.message}. Please try refreshing the page.</p>`;
        } finally {
            // Sembunyikan spinner pertanyaan setelah proses generate selesai (baik sukses atau error)
            questionsLoadingSpinner.style.display = 'none';
        }
    }

    // Fungsi untuk menampilkan soal di halaman
    function displayQuestions(questions) {
        if (questions.length === 0 || (questions.length > 0 && questions[0].error)) {
            questionsArea.innerHTML = `<p class="text-danger">Tidak ada pertanyaan untuk ditampilkan atau terjadi kesalahan saat memuat pertanyaan.</p>`;
            if (questions.length > 0 && questions[0].error) {
                questionsArea.innerHTML += `<p class="text-danger">Detail Error: ${questions[0].error}</p>`;
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
        questionsArea.innerHTML = html; // Ini akan mengganti seluruh isi questionsArea

        document.getElementById('question-form').addEventListener('submit', handleAnswerSubmission);
    }

    // Fungsi untuk menangani submit jawaban dan mengirim ke backend
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

        // --- Tampilkan Spinner Pertanyaan Saat Analisis Jawaban ---
        // Sembunyikan formulir dan tampilkan spinner
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
            questionsLoadingSpinner.style.display = 'none'; // Sembunyikan spinner setelah analisis
        }
    }

    // Fungsi untuk menampilkan hasil analisis AI
    function displayAnalysisResults(analysisResults, userAnswers) {
        let resultsHtml = '<h3>Analysis Result:</h3>';
        let correctCount = 0;
        const totalQuestions = generatedQuestions.length; 

        analysisResults.forEach(resultItem => {
            if (resultItem.status && (resultItem.status.toLowerCase().includes('correct') || resultItem.status.toLowerCase().includes('benar'))) {
                correctCount++;
            }
        });
        const score = (totalQuestions > 0) ? (correctCount / totalQuestions) * 100 : 0;
        resultsHtml += `<h3 class="mb-4">Your Score: ${score.toFixed(2)}%</h3>`;
        resultsHtml += `<h4 class="mb-4">Correct Answers: ${correctCount} out of ${totalQuestions} questions</h4>`;

        analysisResults.forEach((resultItem, index) => {
            const originalQuestion = generatedQuestions[index] ? generatedQuestions[index].question : `Question ${index + 1}`;
            const originalUserAnswer = userAnswers[index] || 'No answer provided';

            let statusClass = 'text-warning'; 
            let statusIcon = '<i class="fa fa-question-circle"></i>';
            let statusText = 'Unknown';

            if (resultItem.status) {
                const lowerCaseStatus = resultItem.status.toLowerCase();
                if (lowerCaseStatus.includes('correct') || lowerCaseStatus.includes('benar')) {
                    statusClass = 'text-success';
                    statusIcon = '<i class="fa fa-check-circle"></i>';
                    statusText = 'Correct';
                } else if (lowerCaseStatus.includes('partially correct') || lowerCaseStatus.includes('sebagian benar')) {
                    statusClass = 'text-info';
                    statusIcon = '<i class="fa fa-adjust"></i>';
                    statusText = 'Partially Correct';
                } else if (lowerCaseStatus.includes('incorrect') || lowerCaseStatus.includes('salah')) {
                    statusClass = 'text-danger';
                    statusIcon = '<i class="fa fa-times-circle"></i>';
                    statusText = 'Incorrect';
                } else if (lowerCaseStatus.includes('tidak relevan') || lowerCaseStatus.includes('irrelevant')) {
                    statusClass = 'text-secondary';
                    statusIcon = '<i class="fa fa-ban"></i>';
                    statusText = 'Irrelevant';
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

    // Panggil fungsi utama untuk memuat cerita dan pertanyaan saat halaman dimuat
    if (storyInfoElement) {
        setTimeout(() => {
            loadStoryAndQuestions(); // Panggil fungsi yang sudah digabungkan
        }, 100); 
    }
});