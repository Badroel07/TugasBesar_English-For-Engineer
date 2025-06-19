document.addEventListener('DOMContentLoaded', function() {
    // --- Variabel Global untuk Quiz ---
    const storyInfoElement = document.getElementById('story-info'); // Elemen tersembunyi untuk mengambil nama file cerita
    const storyContentElement = document.getElementById('story-content'); // Elemen untuk menampilkan konten cerita yang dimuat
    const questionsArea = document.getElementById('questions-area');
    let generatedQuestions = []; // Untuk menyimpan soal yang di-generate


    // Fungsi untuk memuat soal dari backend
    async function loadQuestions() {
        const storyFileName = storyInfoElement ? storyInfoElement.dataset.storyFile : '';

        if (!storyFileName) {
             console.error("Nama file cerita tidak ditemukan di elemen 'story-info'. Pastikan atribut data-story-file ada dan berisi nama file.");
             questionsArea.innerHTML = '<p class="text-danger">Error: Nama file cerita tidak dapat ditemukan. Mohon hubungi administrator.</p>';
             return;
        }

        storyContentElement.textContent = 'Loading story content...'; // Tampilkan pesan loading cerita
        questionsArea.innerHTML = '<p>Generating HOTS questions...</p>'; // Tampilkan pesan loading pertanyaan

        let story = '';
        try {
            // Langkah 1: Ambil konten cerita dari backend
            const storyResponse = await fetch('/get-story-file-content', { // Memanggil API baru untuk mengambil konten file
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ file_name: storyFileName }) // Mengirim nama file
            });

            if (!storyResponse.ok) {
                // Coba parse body respons untuk detail error dari backend jika ada
                const errorData = await storyResponse.json().catch(() => ({})); 
                throw new Error(`HTTP error fetching story: Status ${storyResponse.status} - ${storyResponse.statusText}. Details: ${JSON.stringify(errorData)}`);
            }
            const storyData = await storyResponse.json();
            if (storyData.storyContent) {
                story = storyData.storyContent;
                storyContentElement.textContent = story; // Tampilkan cerita di elemen p#story-content
            } else {
                throw new Error('Story content not found in response from backend.');
            }

        } catch (storyError) {
            console.error('Error fetching story content:', storyError);
            storyContentElement.textContent = `Error loading story: ${storyError.message}`;
            questionsArea.innerHTML = `<p class="text-danger">Error loading story content: ${storyError.message}</p>`;
            return; // Hentikan eksekusi jika cerita gagal dimuat
        }

        // Lanjutkan dengan menghasilkan pertanyaan hanya jika cerita berhasil dimuat
        if (story.length < 50) { // Tambahkan cek minimal panjang story untuk generate
            questionsArea.innerHTML = '<p class="text-warning">Cerita terlalu pendek untuk menghasilkan pertanyaan.</p>';
            return;
        }

        try {
            const response = await fetch('/generate-questions', { // Panggil endpoint generate questions Anda
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
                    displayQuestions(generatedQuestions);
                }
            } else {
                questionsArea.innerHTML = '<p class="text-danger">Failed to load questions. Invalid response format from AI.</p>';
                console.error('Invalid questions response (not an array or missing questions key):', data);
            }

        } catch (error) {
            console.error('Error loading questions:', error);
            questionsArea.innerHTML = `<p class="text-danger">Error generating questions: ${error.message}. Please try refreshing the page.</p>`;
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
        questionsArea.innerHTML = html;

        document.getElementById('question-form').addEventListener('submit', handleAnswerSubmission);
    }

    // Fungsi untuk menangani submit jawaban dan mengirim ke backend
    async function handleAnswerSubmission(event) {
    event.preventDefault(); 

    const story = storyContentElement.textContent.trim(); // Ambil cerita dari elemen yang sudah diisi oleh loadQuestions
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
        questionsArea.innerHTML = '<p class="text-danger">Please fill all answers before submitting.</p>' + questionsArea.innerHTML; 
        return; 
    }

    questionsArea.innerHTML = '<p>Analyzing your answers...</p>'; 

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

    // Panggil fungsi untuk memuat soal saat halaman dimuat
    // Pastikan storyInfoElement ada dan berisi nama file.
    if (storyInfoElement) {
        // Beri sedikit delay untuk memastikan storyInfoElement sudah terisi penuh jika ada rendering dinamis
        setTimeout(() => {
            loadQuestions(); // Panggil loadQuestions untuk memulai proses
        }, 100); 
    }
});
