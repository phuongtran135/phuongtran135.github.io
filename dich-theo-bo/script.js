document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT SELECTOR ---
    const getEl = (id) => document.getElementById(id);
    const UI = {
        manageApiKeysBtn: getEl('manageApiKeysBtn'),
        apiKeyModal: getEl('apiKeyModal'),
        apiKeySaveBtn: getEl('apiKeySaveBtn'),
        apiKeyCancelBtn: getEl('apiKeyCancelBtn'),
        geminiApiKeyInput: getEl('geminiApiKey'),
        apiKeyCount: getEl('apiKeyCount'),
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
        languageSelect: getEl('language'),
        statusBar: getEl('status-bar'),
        contextSummaryEl: getEl('context-summary'),
        generateContextBtn: getEl('generateContextBtn'),
        fullscreenModal: getEl('fullscreenModal'),
        fullscreenTitle: getEl('fullscreenTitle'),
        fullscreenTextarea: getEl('fullscreenTextarea'),
        fullscreenCopyBtn: getEl('fullscreenCopyBtn'),
        fullscreenCloseBtn: getEl('fullscreenCloseBtn'),
        notificationContainer: getEl('notification-container'),
    };

    // --- STATE MANAGEMENT ---
    let state = {
        apiKeys: [],
        chapters: [],
        selectedChapterId: null,
        isTranslating: false,
        contextSummary: '',
    };

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

    // --- UTILITY & UI FUNCTIONS ---
    const showStatus = (message, showSpinner = false) => {
        const spinner = showSpinner ? '<div class="spinner"></div>' : '';
        UI.statusBar.innerHTML = `${spinner}<span class="ml-2">${message}</span>`;
    };

    const showNotification = (message, type = 'success') => {
        const notif = document.createElement('div');
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
        notif.className = `notification ${type}`;
        notif.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
        UI.notificationContainer.appendChild(notif);
        
        // Trigger animation
        setTimeout(() => notif.classList.add('show'), 10);
        
        // Auto-remove
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
        } catch (e) {
            return htmlString;
        }
    };

    const toggleUIState = (isBusy) => {
        state.isTranslating = isBusy;
        UI.generateContextBtn.disabled = isBusy;
        UI.translateAllBtn.disabled = isBusy || !state.contextSummary.trim();
        UI.translateAllBtn.querySelector('span').textContent = isBusy ? 'Đang dịch...' : 'Dịch toàn bộ';
        
        // Also disable individual chapter buttons
        document.querySelectorAll('.chapter-item button').forEach(btn => btn.disabled = isBusy);
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

    // --- CHAPTER MANAGEMENT ---
    const addChapter = (name, content) => {
        const newChapter = { id: Date.now(), name, originalContent: content, translatedContent: '', status: 'pending' };
        state.chapters.push(newChapter);
        renderChapterList();
        if (!state.selectedChapterId) selectChapter(newChapter.id);
    };
    
    const selectChapter = (id) => {
        state.selectedChapterId = id;
        const chapter = state.chapters.find(c => c.id === id);
        if (chapter) {
            UI.contentViewTitle.textContent = chapter.name;
            UI.originalText.value = chapter.originalContent;
            UI.translatedText.value = chapter.translatedContent;
        } else {
            UI.originalText.value = '';
            UI.translatedText.value = '';
            UI.contentViewTitle.textContent = 'Nội dung chương';
        }
        renderChapterList();
        updateFullscreenButtonsVisibility();
    };
    
    const clearAllChapters = () => {
        if (confirm("Bạn có chắc chắn muốn xóa tất cả các chương và bối cảnh truyện?")) {
            state.chapters = [];
            state.selectedChapterId = null;
            state.contextSummary = '';
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
    };
    
    // --- TRANSLATION & CONTEXT LOGIC ---
    const callGenericGeminiAPI = async (prompt) => {
        if (state.apiKeys.length === 0) throw new Error("Vui lòng thêm Gemini API Key.");
        const key = state.apiKeys.shift();
        state.apiKeys.push(key);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${key}`, {
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
        toggleUIState(true);
        showStatus("Đang phân tích toàn bộ truyện để tạo bối cảnh...", true);

        try {
            const allChaptersText = state.chapters.map(c => `CHƯƠNG ${c.name}:\n${c.originalContent}`).join('\n\n---\n\n');
            const prompt = detailedContextPromptTemplate.replace('{all_chapters_text}', allChaptersText);
            const detailedContext = await callGenericGeminiAPI(prompt);
            state.contextSummary = detailedContext.trim();
            UI.contextSummaryEl.value = state.contextSummary;
            showNotification("Đã tạo thành công bối cảnh chi tiết!");
            showStatus("Sẵn sàng để dịch.");
        } catch (error) {
            console.error("Failed to generate detailed context:", error);
            showNotification(`Lỗi khi tạo bối cảnh: ${error.message}`, 'error');
            showStatus(`Lỗi: ${error.message}`);
        } finally {
            toggleUIState(false);
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
        } catch (error) {
            chapter.status = 'error';
            console.error(`Translation error for ${chapter.name}:`, error);
            showNotification(`Lỗi khi dịch "${chapter.name}"`, 'error');
            showStatus(`Lỗi dịch: ${error.message}`);
        } finally {
            renderChapterList();
            updateFullscreenButtonsVisibility();
        }
    };
    
    const handleTranslateAll = async () => {
        toggleUIState(true);
        for (const chapter of state.chapters) {
            if (['pending', 'error'].includes(chapter.status)) {
                await translateChapter(chapter.id);
            }
        }
        toggleUIState(false);
        showNotification('Đã hoàn tất dịch toàn bộ truyện!');
        showStatus('Hoàn tất dịch toàn bộ.');
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
                    const nextId = state.chapters.length > 0 ? state.chapters[0].id : null;
                    selectChapter(nextId);
                }
                if (state.chapters.length === 0) {
                    state.contextSummary = '';
                    UI.contextSummaryEl.value = '';
                }
                renderChapterList();
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

        const titles = {
            'original-text': 'Văn bản gốc',
            'translated-text': 'Văn bản dịch',
            'context-summary': 'Bối cảnh truyện'
        };
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
                showNotification('Đã lưu thay đổi vào bản dịch.');
            } else if (sourceId === 'context-summary') {
                state.contextSummary = newValue;
                renderChapterList();
                showNotification('Đã lưu thay đổi vào bối cảnh.');
            }
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
        // Modals
        UI.manageApiKeysBtn.addEventListener('click', () => UI.apiKeyModal.classList.remove('hidden'));
        UI.apiKeyCancelBtn.addEventListener('click', () => UI.apiKeyModal.classList.add('hidden'));
        UI.apiKeySaveBtn.addEventListener('click', saveApiKeys);
        UI.addChapterPasteBtn.addEventListener('click', () => UI.pasteModal.classList.remove('hidden'));
        UI.pasteCancelBtn.addEventListener('click', () => UI.pasteModal.classList.add('hidden'));
        UI.pasteSaveBtn.addEventListener('click', handlePasteSave);

        // File Input & Chapter Actions
        UI.docFileInput.addEventListener('change', handleFileUpload);
        UI.chapterList.addEventListener('click', handleChapterListClick);
        UI.globalActions.addEventListener('click', ({ target }) => {
            if (target.closest('#translateAllBtn')) handleTranslateAll();
            if (target.closest('#clearAllBtn')) clearAllChapters();
        });
        UI.generateContextBtn.addEventListener('click', handleGenerateDetailedContext);
        
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
        });
    };
    
    // --- INITIALIZATION ---
    const init = () => {
        loadApiKeys();
        selectChapter(null);
        setupEventListeners();
    };

    init();
});

