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

    fileUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        uploadStatus.textContent = `Analyzing ${file.name}...`;
        uploadStatus.classList.remove('hidden', 'text-red-500');
        uploadStatus.classList.add('text-blue-600');
        
        topicsSection.classList.add('hidden');
        qaSection.classList.add('hidden');

        const formData = new FormData();
        formData.append('file', file);

        try {
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

    function renderTopics(topics) {
        topicsList.innerHTML = ''; 
        topicsSection.classList.remove('hidden');
        
        const counter = document.getElementById('topic-count');
        if(counter) counter.textContent = `${topics.length} found`;
        
        topics.forEach(topic => {
            const card = document.createElement('div');
            card.className = 'bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-indigo-300 hover:-translate-y-1 cursor-pointer transition-all duration-300 flex flex-col h-full group';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <h3 class="font-bold text-lg text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">${topic.title}</h3>
                    <span class="bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20 text-xs font-bold px-2.5 py-1 rounded-full ml-3 whitespace-nowrap">Pg ${topic.pages}</span>
                </div>
                <p class="text-sm text-slate-500 line-clamp-3 leading-relaxed grow">${topic.summary}</p>
            `;
            
            card.addEventListener('click', () => openQA(topic));
            topicsList.appendChild(card);
        });
    }

    function openQA(topic) {
        currentTopicId = topic.id;
        qaTopicTitle.textContent = topic.title;
        qaTopicPages.textContent = `Slides: ${topic.pages}`;
        qaTopicSummary.textContent = topic.summary;
        
        questionInput.value = '';
        answerBox.classList.add('hidden');
        answerText.textContent = '';
        
        qaSection.classList.remove('hidden');
        qaSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    closeQaBtn.addEventListener('click', () => {
        qaSection.classList.add('hidden');
        currentTopicId = null;
    });

    askBtn.addEventListener('click', async () => {
        const question = questionInput.value.trim();
        if (!question || !currentTopicId) return;

        askBtn.textContent = 'Searching...';
        askBtn.disabled = true;
        answerBox.classList.add('hidden');

        try {
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

    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            askBtn.click();
        }
    });
});