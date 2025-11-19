document.addEventListener('DOMContentLoaded', () => {
    // --- DATABASE HELPER ---
    const idbHelper = {
        db: null,
        init(dbName, version, storeName) {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName, version);
                request.onerror = (event) => reject("Lỗi khi mở IndexedDB.");
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    resolve(this.db);
                };
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'name' });
                    }
                };
            });
        },
        async saveProject(storeName, project) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(project);
                request.onsuccess = () => resolve();
                request.onerror = (event) => reject("Lỗi khi lưu dự án:", event.target.error);
            });
        },
        async getProjects(storeName) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = (event) => reject("Lỗi khi tải các dự án:", event.target.error);
            });
        },
        async deleteProject(storeName, projectName) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(projectName);
                request.onsuccess = () => resolve();
                request.onerror = (event) => reject("Lỗi khi xóa dự án:", event.target.error);
            });
        },
    };

    // --- DOM ELEMENT SELECTOR ---
    const getEl = (id) => document.getElementById(id);
    const UI = {
        manageApiKeysBtn: getEl('manageApiKeysBtn'),
        apiKeyModal: getEl('apiKeyModal'),
        apiKeySaveBtn: getEl('apiKeySaveBtn'),
        apiKeyCancelBtn: getEl('apiKeyCancelBtn'),
        geminiApiKeyInput: getEl('geminiApiKey'),
        apiKeyCount: getEl('apiKeyCount'),
        languageSelect: getEl('language'),
        saveProjectBtn: getEl('saveProjectBtn'),
        manageProjectsBtn: getEl('manageProjectsBtn'),
        projectNameDisplay: getEl('projectNameDisplay'),
        docFileInput: getEl('docFileInput'),
        addChapterPasteBtn: getEl('addChapterPasteBtn'),
        pasteModal: getEl('pasteModal'),
        pasteCancelBtn: getEl('pasteCancelBtn'),
        pasteSaveBtn: getEl('pasteSaveBtn'),
        pasteChapterName: getEl('pasteChapterName'),
        pasteContent: getEl('pasteContent'),
        chapterList: getEl('chapter-list'),
        emptyListPlaceholder: getEl('empty-list-placeholder'),
        globalActions: getEl('global-actions'),
        translateAllBtn: getEl('translateAllBtn'),
        clearAllBtn: getEl('clearAllBtn'),
        originalText: getEl('original-text'),
        translatedText: getEl('translated-text'),
        contentViewTitle: getEl('content-view-title'),
        statusBar: getEl('status-bar'),
        contextSummaryEl: getEl('context-summary'),
        generateContextBtn: getEl('generateContextBtn'),
        fullscreenModal: getEl('fullscreenModal'),
        fullscreenTitle: getEl('fullscreenTitle'),
        fullscreenTextarea: getEl('fullscreenTextarea'),
        fullscreenCopyBtn: getEl('fullscreenCopyBtn'),
        fullscreenCloseBtn: getEl('fullscreenCloseBtn'),
        notificationContainer: getEl('notification-container'),
        projectModal: getEl('projectModal'),
        projectModalCloseBtn: getEl('projectModalCloseBtn'),
        projectList: getEl('projectList'),
        evaluateStoryBtn: getEl('evaluateStoryBtn'),
        evaluationModal: getEl('evaluationModal'),
        evaluationModalCloseBtn: getEl('evaluationModalCloseBtn'),
        evaluationOutput: getEl('evaluationOutput'),
        reevaluateBtn: getEl('reevaluateBtn'),
    };

    // --- STATE MANAGEMENT ---
    let state = {
        apiKeys: [],
        chapters: [],
        selectedChapterId: null,
        isTranslating: false,
        contextSummary: '',
        projectName: null,
        evaluationResult: null,
        isEvaluating: false,
    };
    let autosaveTimeout = null;

    // --- PROMPT TEMPLATES ---
    const seriesTranslationPromptTemplate = `Bạn là một dịch giả văn học chuyên nghiệp, chuyên dịch các bộ truyện dài tập. Nhiệm vụ của bạn là dịch văn bản của chương hiện tại sang {language} và đồng thời phải duy trì tính nhất quán tuyệt đối với các chương trước.

**NGỮ CẢNH TỐI QUAN TRỌNG TỪ CÁC CHƯƠNG TRƯỚC:**
Phần dưới đây chứa Bối cảnh truyện, bao gồm tóm tắt cốt truyện, nhân vật, và các thuật ngữ quan trọng đã được xác định. Bạn BẮT BUỘC phải sử dụng ngữ cảnh này để đảm bảo:
1.  **Tên riêng nhất quán**: Tên nhân vật, địa danh, thuật ngữ đặc biệt phải được dịch giống hệt như trong bối cảnh.
2.  **Giọng văn nhất quán**: Giọng văn và văn phong của bản dịch phải khớp với giọng kể đã được thiết lập.
3.  **Cốt truyện liền mạch**: Bản dịch của chương hiện tại phải logic và tiếp nối các sự kiện, mối quan hệ nhân vật đã có.

<BỐI CẢNH TRUYỆN>
{context}
</BỐI CẢNH TRUYỆN>

**CHƯƠNG HIỆN TẠI CẦN DỊCH:**
Bây giờ, hãy dịch đoạn văn bản sau sang {language}. Tuân thủ nghiêm ngặt bối cảnh đã cung cấp ở trên. Giữ nguyên mọi định dạng và dấu ngắt đoạn của văn bản gốc. Chỉ cung cấp ĐÚNG phần văn bản đã dịch của chương hiện tại làm đầu ra, không thêm bất kỳ bình luận hay tiêu đề nào.

<VĂN BẢN CHƯƠNG HIỆN TẠI>
{text}
</VĂN BẢN CHƯƠNG HIỆN TẠI>
`;
    const detailedContextPromptTemplate = `Bạn là một nhà phân tích văn học và biên kịch chuyên sâu. Nhiệm vụ của bạn là đọc toàn bộ nội dung của các chương truyện được cung cấp và xây dựng một bản "Bối cảnh truyện" cực kỳ chi tiết và toàn diện. Bản bối cảnh này là nền tảng cốt lõi để đảm bảo bản dịch nhất quán và logic.

**YÊU CẦU PHÂN TÍCH CHI TIẾT:**

1.  **DANH SÁCH NHÂN VẬT:**
    * **Nhân vật chính:** Liệt kê tên, vai trò, tính cách, mục tiêu, và các mối quan hệ quan trọng.
    * **Nhân vật phụ:** Liệt kê tên, vai trò, và mối quan hệ với nhân vật chính.
    * **Nhân vật phản diện/Đối thủ:** Nếu có, mô tả rõ vai trò và mục đích của họ.

2.  **BỐI CẢNH THẾ GIỚI (WORLD-BUILDING):**
    * **Thời gian & Địa điểm:** Xác định thời đại, địa điểm chính (thành phố, quốc gia, thế giới giả tưởng...).
    * **Hoàn cảnh xã hội:** Mô tả ngắn gọn về xã hội, chính trị, công nghệ, hoặc các yếu tố ma thuật/siêu nhiên nếu có.

3.  **DÒNG THỜI GIAN & SỰ KIỆN QUAN TRỌNG:**
    * Liệt kê các sự kiện chính đã xảy ra theo thứ tự thời gian.
    * Ghi chú những sự kiện có ảnh hưởng lớn đến cốt truyện hoặc sự phát triển của nhân vật.

4.  **THUẬT NGỮ & KHÁI NIỆM ĐẶC BIỆT:**
    * Liệt kê và giải thích bất kỳ thuật ngữ, vật phẩm, kỹ năng, hoặc khái niệm độc đáo nào trong truyện.

5.  **GIỌNG VĂN & PHONG CÁCH:**
    * Mô tả ngắn gọn về giọng văn của truyện (hài hước, nghiêm túc, lãng mạn, u tối...).

Hãy trình bày kết quả một cách có cấu trúc, sử dụng tiêu đề rõ ràng cho từng mục. Bản bối cảnh này phải đủ chi tiết để một dịch giả có thể hiểu sâu về câu chuyện mà không cần đọc lại từ đầu.

**NỘI DUNG TOÀN BỘ TRUYỆN:**
{all_chapters_text}`;

    const evaluationPromptTemplate = `Bạn là một cô gái trẻ (18-24 tuổi) rất thích đọc truyện, đặc biệt là các tiểu thuyết online như trên Zhihu. Bạn không phải là nhà phê bình, mà là một độc giả đang chia sẻ cảm nhận chân thật của mình sau khi đọc xong một câu chuyện. Toàn bộ bài đánh giá của bạn PHẢI bằng {language}.

**Hướng dẫn:**

1.  **Cảm nhận chung:** Bắt đầu bằng một vài câu nói về cảm nhận tổng thể của bạn. Ví dụ: "Wow, đọc xong truyện này mình thấy...", "Uhm, truyện này đọc giải trí cũng được...", v.v.
2.  **Điểm mình thích:** Kể ra những điều khiến bạn thích thú. Cốt truyện có gay cấn không? Có nhân vật nào 'chất' không? Tình tiết nào làm bạn bất ngờ?
3.  **Điểm mình hơi lấn cấn:** Góp ý một cách nhẹ nhàng về những điểm bạn thấy chưa ổn lắm. Có thể là một vài tình tiết hơi khó hiểu, hoặc nhân vật hành động hơi lạ.
4.  **Vậy có nên 'nhảy hố' không?:** Đưa ra lời khuyên cuối cùng cho những người đọc khác. Dựa trên cảm nhận của bạn, truyện này có đáng để mọi người bắt đầu đọc không?
5.  **Chấm điểm theo gu của mình:** Cho điểm trên thang 10, và nói rõ đây là điểm dựa trên sở thích cá nhân.
6.  **Định dạng:** Sử dụng Markdown để trình bày cho dễ đọc nhé!

**Nội dung truyện cần đánh giá:**
---
{story_text}
---
`;

    // --- UTILITY & UI FUNCTIONS ---
    const showStatus = (message, showSpinner = false) => {
        const spinner = showSpinner ? '<div class="spinner"></div>' : '';
        UI.statusBar.innerHTML = `${spinner}<span class="ml-2">${message}</span>`;
    };

    const showNotification = (message, type = 'success') => {
        const notif = document.createElement('div');
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-triangle', info: 'fa-info-circle' };
        notif.className = `notification ${type}`;
        notif.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
        UI.notificationContainer.appendChild(notif);
        setTimeout(() => notif.classList.add('show'), 10);
        setTimeout(() => {
            notif.classList.remove('show');
            notif.addEventListener('transitionend', () => notif.remove());
        }, 4000);
    };

    const extractTextFromHtml = (htmlString) => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, "text/html");
            return doc.body.innerText || "";
        } catch (e) { return htmlString; }
    };

    const toggleTranslateUIState = (isBusy) => {
        state.isTranslating = isBusy;
        UI.generateContextBtn.disabled = isBusy;
        UI.translateAllBtn.disabled = isBusy || !state.contextSummary.trim();
        UI.translateAllBtn.querySelector('span').textContent = isBusy ? 'Đang dịch...' : 'Dịch toàn bộ';
        document.querySelectorAll('.chapter-item button[data-action="translate-single"], .chapter-item button[data-action="remove"]').forEach(btn => btn.disabled = isBusy);
    };
    
    const updateEvaluationButtonUI = () => {
        const btn = UI.evaluateStoryBtn;
        const icon = btn.querySelector('i');
        const text = btn.querySelector('span');

        btn.disabled = state.isEvaluating || state.chapters.length === 0;

        if (state.isEvaluating) {
            icon.className = 'fas fa-spinner fa-spin';
            text.textContent = 'Đang đánh giá...';
        } else if (state.evaluationResult) {
            icon.className = 'fas fa-eye';
            text.textContent = 'Xem đánh giá';
        } else {
            icon.className = 'fas fa-feather-alt';
            text.textContent = 'Đánh giá truyện';
        }
    };

    // --- API KEY MANAGEMENT ---
    const loadApiKeys = () => {
        const savedKeys = localStorage.getItem('geminiApiKeys_series');
        state.apiKeys = savedKeys ? savedKeys.trim().split('\n').filter(Boolean) : [];
        updateApiKeyUI();
    };

    const saveApiKeys = () => {
        const keysValue = UI.geminiApiKeyInput.value.trim();
        localStorage.setItem('geminiApiKeys_series', keysValue);
        state.apiKeys = keysValue.split('\n').filter(Boolean);
        updateApiKeyUI();
        UI.apiKeyModal.classList.add('hidden');
    };

    const updateApiKeyUI = () => {
        UI.apiKeyCount.textContent = state.apiKeys.length;
        UI.geminiApiKeyInput.value = state.apiKeys.join('\n');
    };
    
    // --- PROJECT MANAGEMENT & AUTOSAVE ---
    const triggerAutosave = () => {
        clearTimeout(autosaveTimeout);
        if (state.projectName) {
            autosaveTimeout = setTimeout(async () => {
                try {
                    const projectData = {
                        name: state.projectName,
                        chapters: state.chapters,
                        contextSummary: state.contextSummary,
                        evaluationResult: state.evaluationResult,
                        lastSaved: new Date().toISOString()
                    };
                    await idbHelper.saveProject('projects', projectData);
                    showNotification(`Dự án "${state.projectName}" đã được tự động lưu.`, 'info');
                } catch (error) {
                    showNotification('Lỗi tự động lưu dự án.', 'error');
                }
            }, 1500); // Debounce autosave
        }
    };
    
    const promptAndSaveProject = async () => {
        if (state.chapters.length === 0) {
            showNotification("Không có nội dung để lưu.", 'error');
            return;
        }
        const currentName = state.projectName || '';
        const name = prompt("Nhập tên dự án để lưu hoặc đổi tên:", currentName);
        if (!name || !name.trim()) return;

        state.projectName = name.trim();
        try {
            const projectData = { name: state.projectName, chapters: state.chapters, contextSummary: state.contextSummary, evaluationResult: state.evaluationResult, lastSaved: new Date().toISOString() };
            await idbHelper.saveProject('projects', projectData);
            updateProjectNameDisplay();
            showNotification(`Đã lưu dự án "${state.projectName}"!`);
        } catch (error) {
            showNotification('Lỗi khi lưu dự án.', 'error');
        }
    };

    const loadProject = async (projectName) => {
        try {
            const projects = await idbHelper.getProjects('projects');
            const project = projects.find(p => p.name === projectName);
            if (project) {
                state.chapters = project.chapters;
                state.contextSummary = project.contextSummary;
                state.projectName = project.name;
                state.evaluationResult = project.evaluationResult || null;
                UI.contextSummaryEl.value = state.contextSummary;
                selectChapter(state.chapters[0]?.id || null);
                UI.projectModal.classList.add('hidden');
                showNotification(`Đã tải dự án "${projectName}"!`);
            } else {
                showNotification(`Không tìm thấy dự án "${projectName}"`, 'error');
            }
        } catch (error) {
            showNotification('Lỗi khi tải dự án.', 'error');
        }
    };
    
    const deleteProject = async (projectName) => {
        if (confirm(`Bạn có chắc chắn muốn xóa dự án "${projectName}"? Hành động này không thể hoàn tác.`)) {
            try {
                await idbHelper.deleteProject('projects', projectName);
                if (state.projectName === projectName) {
                    state.projectName = null;
                    updateProjectNameDisplay();
                }
                renderProjectList();
                showNotification(`Đã xóa dự án "${projectName}".`);
            } catch (error) {
                 showNotification('Lỗi khi xóa dự án.', 'error');
            }
        }
    };

    const renderProjectList = async () => {
        try {
            const projects = await idbHelper.getProjects('projects');
            if (projects.length === 0) {
                UI.projectList.innerHTML = `<p class="text-slate-500 text-center p-4">Chưa có dự án nào được lưu.</p>`;
                return;
            }
            UI.projectList.innerHTML = projects.sort((a,b) => a.name.localeCompare(b.name)).map(proj => `
                <div class="project-item flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                    <span class="font-medium text-slate-300">${proj.name}</span>
                    <div class="flex items-center gap-x-2">
                        <button data-action="load" data-name="${proj.name}" class="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded">Tải</button>
                        <button data-action="delete" data-name="${proj.name}" class="px-3 py-1 text-xs bg-red-600/80 hover:bg-red-600 text-white rounded">Xóa</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
             showNotification('Không thể tải danh sách dự án.', 'error');
        }
    };

    const updateProjectNameDisplay = () => {
        if (state.projectName) {
            UI.projectNameDisplay.textContent = state.projectName;
            UI.projectNameDisplay.classList.remove('hidden');
        } else {
            UI.projectNameDisplay.classList.add('hidden');
        }
    };

    // --- CHAPTER MANAGEMENT ---
    const addChapter = (name, content) => {
        const newChapter = { id: Date.now(), name, originalContent: content, translatedContent: '', status: 'pending' };
        state.chapters.push(newChapter);
        state.evaluationResult = null;
        renderChapterList();
        if (!state.selectedChapterId) selectChapter(newChapter.id);
        triggerAutosave();
    };
    
    const selectChapter = (id) => {
        state.selectedChapterId = id;
        const chapter = state.chapters.find(c => c.id === id);
        UI.contentViewTitle.textContent = chapter?.name || 'Nội dung chương';
        UI.originalText.value = chapter?.originalContent || '';
        UI.translatedText.value = chapter?.translatedContent || '';
        updateProjectNameDisplay();
        renderChapterList();
        updateFullscreenButtonsVisibility();
    };
    
    const clearAllChapters = () => {
        if (confirm("Bạn có chắc chắn muốn xóa tất cả các chương và bối cảnh truyện? Thao tác này sẽ dọn sạch không gian làm việc hiện tại.")) {
            state.chapters = [];
            state.selectedChapterId = null;
            state.contextSummary = '';
            state.projectName = null;
            state.evaluationResult = null;
            UI.contextSummaryEl.value = '';
            selectChapter(null);
        }
    };
    
    // --- RENDERING ---
    const createChapterHTML = (chapter, index) => {
        const isSelected = chapter.id === state.selectedChapterId;
        const hasContext = state.contextSummary.trim() !== '';
        
        const statusIcons = {
            translating: '<div class="spinner"></div>',
            completed: '<i class="fas fa-check-circle text-green-500"></i>',
            error: '<i class="fas fa-exclamation-circle text-red-500"></i>',
            pending: '<i class="fas fa-clock text-slate-500"></i>'
        };

        return `
            <div class="chapter-item flex items-center justify-between p-3 mb-2 rounded-lg border-l-4 cursor-pointer transition-colors ${isSelected ? 'selected' : ''} status-${chapter.status}" data-id="${chapter.id}">
                <div class="flex items-center gap-x-3 flex-grow min-w-0" data-action="select">
                    <span class="font-bold text-slate-400">${index + 1}.</span>
                    <span class="truncate text-sm font-medium text-slate-300">${chapter.name}</span>
                </div>
                <div class="flex items-center gap-x-3 flex-shrink-0">
                    ${statusIcons[chapter.status]}
                    <button data-action="translate-single" class="px-2 py-1 text-xs bg-blue-600/80 hover:bg-blue-600 text-white rounded disabled:bg-slate-600 disabled:cursor-not-allowed" ${!hasContext || state.isTranslating ? 'disabled' : ''}>Dịch</button>
                    <button data-action="remove" class="px-2 py-1 text-xs bg-red-600/80 hover:bg-red-600 text-white rounded" ${state.isTranslating ? 'disabled' : ''}><i class="fas fa-times"></i></button>
                </div>
            </div>`;
    };

    const renderChapterList = () => {
        const hasChapters = state.chapters.length > 0;
        UI.emptyListPlaceholder.classList.toggle('hidden', hasChapters);
        UI.globalActions.classList.toggle('hidden', !hasChapters);
        UI.generateContextBtn.disabled = state.isTranslating || !hasChapters;
        UI.translateAllBtn.disabled = state.isTranslating || !state.contextSummary.trim();
        UI.chapterList.innerHTML = state.chapters.map(createChapterHTML).join('');
        updateEvaluationButtonUI();
    };
    
    // --- TRANSLATION & CONTEXT LOGIC ---
    const callGenericGeminiAPI = async (prompt) => {
        if (state.apiKeys.length === 0) throw new Error("Vui lòng thêm Gemini API Key.");
        const key = state.apiKeys.shift();
        state.apiKeys.push(key);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || response.statusText);
        }
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Phản hồi từ API không hợp lệ.");
        return text;
    };

    const handleGenerateDetailedContext = async () => {
        toggleTranslateUIState(true);
        showStatus("Đang phân tích toàn bộ truyện để tạo bối cảnh...", true);
        try {
            const allChaptersText = state.chapters.map(c => `CHƯƠNG ${c.name}:\n${c.originalContent}`).join('\n\n---\n\n');
            const prompt = detailedContextPromptTemplate.replace('{all_chapters_text}', allChaptersText);
            const detailedContext = await callGenericGeminiAPI(prompt);
            state.contextSummary = detailedContext.trim();
            UI.contextSummaryEl.value = state.contextSummary;
            showNotification("Đã tạo thành công bối cảnh chi tiết!");
            showStatus("Sẵn sàng để dịch.");
            triggerAutosave();
        } catch (error) {
            showNotification(`Lỗi khi tạo bối cảnh: ${error.message}`, 'error');
            showStatus(`Lỗi: ${error.message}`);
        } finally {
            toggleTranslateUIState(false);
            renderChapterList();
            updateFullscreenButtonsVisibility();
        }
    };
    
    const translateChapter = async (chapterId) => {
        const chapter = state.chapters.find(c => c.id === chapterId);
        if (!chapter || !state.contextSummary.trim()) {
            showNotification("Vui lòng tạo bối cảnh trước khi dịch.", 'error');
            return;
        }

        chapter.status = 'translating';
        renderChapterList();
        showStatus(`Đang dịch "${chapter.name}"...`, true);

        try {
            const prompt = seriesTranslationPromptTemplate
                .replace('{language}', UI.languageSelect.value)
                .replace('{context}', state.contextSummary)
                .replace('{text}', chapter.originalContent);
            const translated = await callGenericGeminiAPI(prompt);
            chapter.translatedContent = translated.trim();
            chapter.status = 'completed';
            if (state.selectedChapterId === chapterId) {
                UI.translatedText.value = chapter.translatedContent;
            }
            showNotification(`Đã dịch xong "${chapter.name}"!`);
            showStatus(`Hoàn thành dịch "${chapter.name}".`);
            triggerAutosave();
        } catch (error) {
            chapter.status = 'error';
            showNotification(`Lỗi khi dịch "${chapter.name}"`, 'error');
            showStatus(`Lỗi dịch: ${error.message}`);
        } finally {
            renderChapterList();
            updateFullscreenButtonsVisibility();
        }
    };
    
    const handleTranslateAll = async () => {
        toggleTranslateUIState(true);
        for (const chapter of state.chapters) {
            if (['pending', 'error'].includes(chapter.status)) {
                await translateChapter(chapter.id);
            }
        }
        toggleTranslateUIState(false);
        showNotification('Đã hoàn tất dịch toàn bộ truyện!', 'info');
        showStatus('Hoàn tất dịch toàn bộ.');
    };
    
    // --- EVALUATION LOGIC ---
    const handleEvaluateStory = async (isReevaluation = false) => {
        if (state.isEvaluating) return;
    
        if (state.chapters.length === 0) {
            showNotification("Vui lòng tải lên ít nhất một chương để đánh giá.", 'error');
            return;
        }
    
        if (isReevaluation) {
            UI.evaluationModal.classList.add('hidden');
        }
    
        state.isEvaluating = true;
        updateEvaluationButtonUI();
        showStatus("AI đang đọc toàn bộ truyện để đánh giá...", true);
    
        try {
            const allChaptersText = state.chapters.map(c => `CHƯƠNG ${c.name}:\n${c.originalContent}`).join('\n\n---\n\n');
            const prompt = evaluationPromptTemplate
                .replace('{language}', UI.languageSelect.value)
                .replace('{story_text}', allChaptersText);
            
            const evaluationResult = await callGenericGeminiAPI(prompt);
            state.evaluationResult = evaluationResult.trim();
            UI.evaluationOutput.textContent = state.evaluationResult;
            
            showNotification("Đánh giá truyện hoàn tất!");
            showStatus("Sẵn sàng.");
            triggerAutosave();
            
            UI.evaluationModal.classList.remove('hidden');
    
        } catch (error) {
            state.evaluationResult = null;
            showNotification(`Lỗi khi đánh giá truyện: ${error.message}`, 'error');
            showStatus(`Lỗi: ${error.message}`);
        } finally {
            state.isEvaluating = false;
            updateEvaluationButtonUI();
        }
    };

    // --- EVENT HANDLERS ---
    const handleFileUpload = async ({ target }) => {
        const files = target.files;
        if (!files.length) return;
        showStatus(`Đang xử lý ${files.length} file...`, true);
        for (const file of files) {
            if (file.name.toLowerCase().endsWith('.docx')) {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const { value } = await mammoth.extractRawText({ arrayBuffer });
                    addChapter(file.name.replace(/\.docx$/i, ''), value);
                } catch (error) {
                    showNotification(`Không thể đọc file: ${file.name}`, 'error');
                }
            }
        }
        target.value = '';
        showStatus(`Đã thêm ${files.length} chương.`);
    };

    const handleChapterListClick = ({ target }) => {
        const actionTarget = target.closest('[data-action]');
        if (!actionTarget) return;

        const { action } = actionTarget.dataset;
        const chapterId = Number(actionTarget.closest('.chapter-item').dataset.id);
        
        if (action === 'select') selectChapter(chapterId);
        if (action === 'translate-single') translateChapter(chapterId);
        if (action === 'remove') {
            const chapter = state.chapters.find(c => c.id === chapterId);
            if (chapter && confirm(`Bạn có chắc chắn muốn xóa "${chapter.name}"?`)) {
                state.chapters = state.chapters.filter(c => c.id !== chapterId);
                if (state.selectedChapterId === chapterId) {
                    selectChapter(state.chapters[0]?.id || null);
                }
                if (state.chapters.length === 0) {
                    state.contextSummary = '';
                    state.evaluationResult = null;
                    UI.contextSummaryEl.value = '';
                }
                renderChapterList();
                triggerAutosave();
            }
        }
    };

    const handlePasteSave = () => {
        const name = UI.pasteChapterName.value.trim() || `Chương dán lúc ${new Date().toLocaleTimeString()}`;
        let content = UI.pasteContent.value.trim();
        if (content.startsWith('<')) content = extractTextFromHtml(content);
        if (content) {
            addChapter(name, content);
            UI.pasteModal.classList.add('hidden');
            UI.pasteChapterName.value = '';
            UI.pasteContent.value = '';
        } else {
            alert("Nội dung không được để trống.");
        }
    };
    
    // --- FULLSCREEN MODAL LOGIC ---
    const updateFullscreenButtonsVisibility = () => {
        document.querySelector('[data-target="original-text"] button').classList.toggle('hidden', !UI.originalText.value.trim());
        document.querySelector('[data-target="translated-text"] button').classList.toggle('hidden', !UI.translatedText.value.trim());
        document.querySelector('[data-target="context-summary"] button').classList.toggle('hidden', !UI.contextSummaryEl.value.trim());
    };

    const openFullscreenModal = (targetId) => {
        const targetEl = getEl(targetId);
        if (!targetEl || !targetEl.value.trim()) return;

        const titles = { 'original-text': 'Văn bản gốc', 'translated-text': 'Văn bản dịch', 'context-summary': 'Bối cảnh truyện' };
        UI.fullscreenTitle.textContent = titles[targetId] || 'Nội dung';
        UI.fullscreenTextarea.value = targetEl.value;
        UI.fullscreenTextarea.readOnly = (targetId === 'original-text');
        UI.fullscreenModal.dataset.sourceId = targetId;
        UI.fullscreenModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeFullscreenModal = () => {
        const { sourceId } = UI.fullscreenModal.dataset;
        if (!sourceId) return;

        if (!UI.fullscreenTextarea.readOnly) {
            const newValue = UI.fullscreenTextarea.value;
            getEl(sourceId).value = newValue;
            
            if (sourceId === 'translated-text') {
                const chapter = state.chapters.find(c => c.id === state.selectedChapterId);
                if (chapter) chapter.translatedContent = newValue;
                showNotification('Đã lưu thay đổi vào bản dịch.', 'info');
            } else if (sourceId === 'context-summary') {
                state.contextSummary = newValue;
                renderChapterList();
                showNotification('Đã lưu thay đổi vào bối cảnh.', 'info');
            }
            triggerAutosave();
        }
        
        UI.fullscreenModal.classList.add('hidden');
        document.body.style.overflow = '';
        delete UI.fullscreenModal.dataset.sourceId;
    };

    const copyFullscreenText = () => {
        navigator.clipboard.writeText(UI.fullscreenTextarea.value).then(() => {
            const btn = UI.fullscreenCopyBtn.querySelector('span');
            const originalText = btn.textContent;
            btn.textContent = 'Đã sao chép!';
            setTimeout(() => { btn.textContent = originalText; }, 2000);
        }).catch(err => console.error('Could not copy text: ', err));
    };

    // --- EVENT LISTENERS ---
    const setupEventListeners = () => {
        // Main Modals
        UI.manageApiKeysBtn.addEventListener('click', () => UI.apiKeyModal.classList.remove('hidden'));
        UI.apiKeyCancelBtn.addEventListener('click', () => UI.apiKeyModal.classList.add('hidden'));
        UI.apiKeySaveBtn.addEventListener('click', saveApiKeys);
        UI.addChapterPasteBtn.addEventListener('click', () => UI.pasteModal.classList.remove('hidden'));
        UI.pasteCancelBtn.addEventListener('click', () => UI.pasteModal.classList.add('hidden'));
        UI.pasteSaveBtn.addEventListener('click', handlePasteSave);

        // Project Management
        UI.saveProjectBtn.addEventListener('click', promptAndSaveProject);
        UI.manageProjectsBtn.addEventListener('click', async () => {
            await renderProjectList();
            UI.projectModal.classList.remove('hidden');
        });
        UI.projectModalCloseBtn.addEventListener('click', () => UI.projectModal.classList.add('hidden'));
        UI.projectList.addEventListener('click', ({target}) => {
            const btn = target.closest('button[data-action]');
            if (btn) {
                const { action, name } = btn.dataset;
                if (action === 'load') loadProject(name);
                if (action === 'delete') deleteProject(name);
            }
        });

        // File Input & Chapter Actions
        UI.docFileInput.addEventListener('change', handleFileUpload);
        UI.chapterList.addEventListener('click', handleChapterListClick);
        UI.globalActions.addEventListener('click', ({ target }) => {
            if (target.closest('#translateAllBtn')) handleTranslateAll();
            if (target.closest('#clearAllBtn')) clearAllChapters();
        });
        UI.generateContextBtn.addEventListener('click', handleGenerateDetailedContext);
        
        // Evaluation
        UI.evaluateStoryBtn.addEventListener('click', () => {
            if (state.evaluationResult && !state.isEvaluating) {
                UI.evaluationOutput.textContent = state.evaluationResult;
                UI.evaluationModal.classList.remove('hidden');
            } else {
                handleEvaluateStory();
            }
        });
        UI.reevaluateBtn.addEventListener('click', () => handleEvaluateStory(true));
        UI.evaluationModalCloseBtn.addEventListener('click', () => {
            UI.evaluationModal.classList.add('hidden');
        });
        
        // Fullscreen
        document.querySelectorAll('.view-controls button[data-action="fullscreen"]').forEach(btn => {
            btn.addEventListener('click', () => openFullscreenModal(btn.closest('.view-controls').dataset.target));
        });
        UI.fullscreenCloseBtn.addEventListener('click', closeFullscreenModal);
        UI.fullscreenCopyBtn.addEventListener('click', copyFullscreenText);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !UI.fullscreenModal.classList.contains('hidden')) {
                closeFullscreenModal();
            }
        });

        // Context Manual Edit
        UI.contextSummaryEl.addEventListener('change', () => {
            state.contextSummary = UI.contextSummaryEl.value;
            showStatus("Bối cảnh đã được cập nhật thủ công.");
            renderChapterList();
            updateFullscreenButtonsVisibility();
            triggerAutosave();
        });
    };
    
    // --- INITIALIZATION ---
    const init = async () => {
        try {
            await idbHelper.init('TranslationProjectsDB', 1, 'projects');
            loadApiKeys();
            selectChapter(null);
            setupEventListeners();
            showStatus("Sẵn sàng.");
        } catch (error) {
            showStatus("Không thể khởi tạo cơ sở dữ liệu. Lưu trữ dự án sẽ không hoạt động.");
            console.error(error);
        }
    };

    init();
});