document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fileUpload = document.getElementById('file-upload');
    const uploadStatus = document.getElementById('upload-status');
    const topicsSection = document.getElementById('topics-section');
    const topicsList = document.getElementById('topics-list');
    
    const qaSection = document.getElementById('qa-section');
    const qaTopicTitle = document.getElementById('qa-topic-title');
    const qaTopicPages = document.getElementById('qa-topic-pages');
    const qaTopicSummary = document.getElementById('qa-topic-summary');
    const questionInput = document.getElementById('question-input');
    const askBtn = document.getElementById('ask-btn');
    const answerBox = document.getElementById('answer-box');
    const answerText = document.getElementById('answer-text');
    const closeQaBtn = document.getElementById('close-qa');

    let currentTopicId = null;

    // 1. Handle File Upload
    fileUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        uploadStatus.textContent = `Analyzing ${file.name}...`;
        uploadStatus.classList.remove('hidden', 'text-red-500');
        uploadStatus.classList.add('text-blue-600');
        
        // Hide previous results if uploading a new file
        topicsSection.classList.add('hidden');
        qaSection.classList.add('hidden');

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Call FastAPI upload endpoint
            const response = await fetch('http://localhost:8000/study/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (response.ok) {
                uploadStatus.textContent = 'Analysis complete!';
                renderTopics(result.data);
            } else {
                showUploadError(result.detail);
            }
        } catch (error) {
            showUploadError('Connection error. Ensure FastAPI is running on port 8000.');
        }
    });

    function showUploadError(msg) {
        uploadStatus.textContent = `Error: ${msg}`;
        uploadStatus.classList.replace('text-blue-600', 'text-red-500');
    }

    // 2. Render the extracted topics as clickable cards
    function renderTopics(topics) {
        topicsList.innerHTML = ''; 
        topicsSection.classList.remove('hidden');
        
        // Example expected data structure from backend: 
        // [{ id: "t1", title: "POS Tagging", pages: "4-10", summary: "Brief overview..." }]
        topics.forEach(topic => {
            const card = document.createElement('div');
            card.className = 'bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition flex flex-col h-full';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <h3 class="font-bold text-lg text-gray-800 leading-tight">${topic.title}</h3>
                    <span class="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded ml-2 whitespace-nowrap">Pg ${topic.pages}</span>
                </div>
                <p class="text-sm text-gray-500 line-clamp-3">${topic.summary}</p>
            `;
            
            card.addEventListener('click', () => openQA(topic));
            topicsList.appendChild(card);
        });
    }

    // 3. Open Q&A specific to the clicked topic
    function openQA(topic) {
        currentTopicId = topic.id;
        qaTopicTitle.textContent = topic.title;
        qaTopicPages.textContent = `Slides: ${topic.pages}`;
        qaTopicSummary.textContent = topic.summary;
        
        // Reset inputs and answers
        questionInput.value = '';
        answerBox.classList.add('hidden');
        answerText.textContent = '';
        
        qaSection.classList.remove('hidden');
        qaSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Close Q&A
    closeQaBtn.addEventListener('click', () => {
        qaSection.classList.add('hidden');
        currentTopicId = null;
    });

    // 4. Handle Question Submission
    askBtn.addEventListener('click', async () => {
        const question = questionInput.value.trim();
        if (!question || !currentTopicId) return;

        // UI Loading state
        askBtn.textContent = 'Searching...';
        askBtn.disabled = true;
        answerBox.classList.add('hidden');

        try {
            // Call FastAPI ask endpoint
            const response = await fetch('http://localhost:8000/study/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic_id: currentTopicId,
                    question: question
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                answerText.textContent = result.answer;
                answerBox.classList.remove('hidden');
            } else {
                answerText.textContent = `Error: ${result.detail}`;
                answerBox.classList.remove('hidden');
            }
        } catch (error) {
            answerText.textContent = 'Failed to connect to the server.';
            answerBox.classList.remove('hidden');
        } finally {
            // Restore UI state
            askBtn.textContent = 'Ask';
            askBtn.disabled = false;
        }
    });

    // Allow pressing "Enter" in the input field to trigger the Ask button
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            askBtn.click();
        }
    });
});