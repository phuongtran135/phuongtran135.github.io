// --- Element selectors ---
const fileUpload = document.getElementById("file-upload"),
  fileNameDisplay = document.getElementById("file-name");
const translateBtn = document.getElementById("translateBtn"),
  headerDownloadBtn = document.getElementById("headerDownloadBtn"),
  downloadBtnWrapper = document.getElementById("downloadBtn-wrapper");
const statusDiv = document.getElementById("status"),
  originalSubDiv = document.getElementById("original-sub"),
  translatedSubDiv = document.getElementById("translated-sub");
const loadingContainer = document.getElementById("loading-container"),
  loadingText = document.getElementById("loading-text");
const resultContainer = document.getElementById("result-container"),
  characterMapContainer = document.getElementById("characterMapContainer");
const analysisApiKeyInput = document.getElementById("analysisApiKeyInput"),
  translateApiKeyInput = document.getElementById("translateApiKeyInput");
const analyzeCharactersBtn = document.getElementById("analyzeCharactersBtn"),
  analysisStatus = document.getElementById("analysis-status");
const plotAnalysisBtn = document.getElementById("plotAnalysisBtn"),
  plotAnalysisStatus = document.getElementById("plot-analysis-status"),
  plotAnalysisResultContainer = document.getElementById("plot-analysis-result-container"),
  plotAnalysisResult = document.getElementById("plot-analysis-result");
const analyzeRelationshipsBtn = document.getElementById("analyzeRelationshipsBtn"),
  relationshipsStatus = document.getElementById("relationships-status"),
  relationshipsResultContainer = document.getElementById("relationships-result-container"),
  relationshipsResult = document.getElementById("relationships-result");
// Title Suggestion Elements
const suggestTitlesBtn = document.getElementById("suggestTitlesBtn"),
  titlesStatus = document.getElementById("titles-status"),
  titlesResultContainer = document.getElementById("titles-result-container"),
  suggestedTitlesList = document.getElementById("suggested-titles-list"),
  regenerateTitlesBtn = document.getElementById("regenerateTitlesBtn");
// Place Name Elements (NEW)
const analyzePlaceNamesBtn = document.getElementById("analyzePlaceNamesBtn"),
  placeNamesStatus = document.getElementById("place-names-status"),
  placeNameMapContainer = document.getElementById("placeNameMapContainer");

const progressBar = document.getElementById("progress-bar");
const findInput = document.getElementById("find-input");
const genreSelect = document.getElementById("genre-select");
const fullscreenBtn = document.getElementById("fullscreen-analysis-btn");
const analysisModal = document.getElementById("analysis-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const modalContent = document.getElementById("modal-content");
const modalTitle = document.getElementById("modal-title");
const toggleSizeBtn = document.getElementById("toggle-size-btn");
const checkChineseBtn = document.getElementById("check-chinese-btn");
const editToolStatus = document.getElementById("edit-tool-status");
const editToolbar = document.getElementById("edit-toolbar");
const retranslateIssuesBtn = document.getElementById("retranslate-issues-btn");
const retranslateApiKeyInput = document.getElementById("retranslateApiKeyInput");

// --- POPUP SELECTORS ---
const actionWrapper = document.getElementById("action-wrapper");
const popupResultDisplay = document.getElementById("popup-result-display");
const analysisColumnContent = document.getElementById("analysis-column-content");
const charAnalysisSection = document.getElementById("char-analysis-section");
const plotAnalysisSection = document.getElementById("plot-analysis-section");
const relationshipAnalysisSection = document.getElementById("relationship-analysis-section");
const titleSuggestionSection = document.getElementById("title-suggestion-section");
const placeNameAnalysisSection = document.getElementById("place-name-analysis-section"); // NEW

// --- SETTINGS TOGGLE SELECTORS ---
const toggleSettingsBtn = document.getElementById("toggle-settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const settingsChevron = document.getElementById("settings-chevron");

// --- State variables ---
let originalSrtContent = "",
  translatedSrtContent = "",
  originalFileName = "";
let parsedSubs = [],
  translatedParsedSubs = [];
let userAnalysisApiKey = "",
  userTranslateApiKey = "";
let plotAnalysisContext = "";
let relationshipContext = "";
let placeNameContext = ""; // NEW state for place names
let untranslatedIndices = [];
let failedChunkIndices = []; // Keep track of failed chunk indices

// --- POPUP STATE ---
let activePopup = null;
let hidePopupTimer = null;

// --- Event Listeners ---
analysisApiKeyInput.addEventListener("input", (e) => {
  userAnalysisApiKey = e.target.value.trim();
  localStorage.setItem("analysisApiKey", userAnalysisApiKey);
});
translateApiKeyInput.addEventListener("input", (e) => {
  userTranslateApiKey = e.target.value.trim();
  localStorage.setItem("translateApiKey", userTranslateApiKey);
});
fileUpload.addEventListener("change", handleFileSelect);
const fileLabel = fileUpload.previousElementSibling;
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) =>
  fileLabel.addEventListener(
    eventName,
    (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    false
  )
);
["dragenter", "dragover"].forEach((eventName) =>
  fileLabel.addEventListener(eventName, () => fileLabel.classList.add("dragover"), false)
);
["dragleave", "drop"].forEach((eventName) =>
  fileLabel.addEventListener(eventName, () => fileLabel.classList.remove("dragover"), false)
);
fileLabel.addEventListener("drop", handleDrop, false);

analyzeCharactersBtn.addEventListener("click", runCharacterAnalysis);
analyzePlaceNamesBtn.addEventListener("click", runAnalyzePlaceNames); // NEW
plotAnalysisBtn.addEventListener("click", runPlotAnalysis);
analyzeRelationshipsBtn.addEventListener("click", runRelationshipAnalysis);
suggestTitlesBtn.addEventListener("click", runSuggestTitles);
regenerateTitlesBtn.addEventListener("click", runSuggestTitles);

translateBtn.addEventListener("click", runTranslation);
retranslateIssuesBtn.addEventListener("click", retranslateIssues);

// Listen for dynamic delete buttons (characters only for now)
characterMapContainer.addEventListener("click", function (e) {
  const deleteButton = e.target.closest(".delete-char-btn");
  if (deleteButton) {
    deleteButton.closest(".character-profile-card").remove();
  }
});
// Listen for dynamic copy buttons in title list
suggestedTitlesList.addEventListener('click', function (e) {
  const copyButton = e.target.closest('.copy-title-btn');
  if (copyButton) {
    const titleSpan = copyButton.closest('li').querySelector('span');
    if (titleSpan) {
      const titleText = titleSpan.textContent;
      copyToClipboard(titleText, copyButton);
    }
  }
});

// NEW: Listen for retry translate buttons
translatedSubDiv.addEventListener('click', async (e) => {
  const retryButton = e.target.closest('.retry-translate-btn');
  if (retryButton && !retryButton.classList.contains('loading')) {
    const arrayIndex = parseInt(retryButton.dataset.arrayIndex, 10);
    if (!isNaN(arrayIndex)) {
      await retrySingleTranslation(arrayIndex, retryButton);
    }
  }
});

translatedSubDiv.addEventListener("input", (e) => {
  if (e.target.classList.contains("sub-text")) {
    const arrayIndex = parseInt(e.target.dataset.arrayIndex, 10);
    if (!isNaN(arrayIndex) && translatedParsedSubs[arrayIndex]) {
      translatedParsedSubs[arrayIndex].text = e.target.textContent;
      translatedSrtContent = buildSRT(translatedParsedSubs);
      // Remove error class and retry button if user edits a failed line
      const block = e.target.closest('.sub-block');
      if (block && block.classList.contains('error-translate')) {
        block.classList.remove('error-translate');
        const retryBtn = block.querySelector('.retry-translate-btn');
        if (retryBtn) retryBtn.remove();
      }
    }
  }
});
translatedSubDiv.addEventListener("focusin", (e) => {
  if (e.target.classList.contains("sub-text")) {
    document
      .querySelectorAll(".sub-block.highlighted")
      .forEach((el) => el.classList.remove("highlighted"));
    const arrayIndex = e.target.dataset.arrayIndex;
    const originalBlock = document.getElementById(
      `original-sub-block-${arrayIndex}`
    );
    const translatedBlock = e.target.closest(".sub-block");
    if (originalBlock) {
      originalBlock.classList.add("highlighted");
      originalBlock.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    if (translatedBlock) translatedBlock.classList.add("highlighted");
  }
});
checkChineseBtn.addEventListener("click", checkRemainingChinese);
headerDownloadBtn.addEventListener("click", downloadSRT);
fullscreenBtn.addEventListener("click", () =>
  showModalWithContent("analysis") // Currently only supports character analysis modal
);
closeModalBtn.addEventListener("click", hideAnalysisModal);
analysisModal.addEventListener("click", (e) => {
  if (e.target.id === "analysis-modal") {
    hideAnalysisModal();
  }
});
toggleSizeBtn.addEventListener("click", () => {
  const isExpanded = originalSubDiv.classList.contains("expanded");
  originalSubDiv.classList.toggle("expanded");
  translatedSubDiv.classList.toggle("expanded");
  if (isExpanded) {
    toggleSizeBtn.classList.remove("fa-compress-alt");
    toggleSizeBtn.classList.add("fa-expand-alt");
    toggleSizeBtn.title = "Phóng to";
  } else {
    toggleSizeBtn.classList.remove("fa-expand-alt");
    toggleSizeBtn.classList.add("fa-compress-alt");
    toggleSizeBtn.title = "Thu nhỏ";
  }
});

// --- SETTINGS TOGGLE LISTENER ---
toggleSettingsBtn.addEventListener("click", () => {
  if (
    settingsPanel.style.maxHeight &&
    settingsPanel.style.maxHeight !== "0px"
  ) {
    settingsPanel.style.maxHeight = "0px";
    settingsPanel.classList.add("pt-0"); // Ẩn padding khi đóng
  } else {
    settingsPanel.style.maxHeight = settingsPanel.scrollHeight + "px";
    settingsPanel.classList.remove("pt-0"); // Hiển thị lại padding
  }
  settingsChevron.classList.toggle("rotate-180");
});

// --- POPUP LOGIC FUNCTIONS ---
function showPopup(contentElement) {
  clearTimeout(hidePopupTimer);
  if (activePopup === contentElement) return; // Đã hiển thị, không làm gì

  // Ẩn pop-up cũ nếu có
  if (activePopup) {
    activePopup.classList.add("hidden");
    analysisColumnContent.appendChild(activePopup); // Trả về kho chứa ẩn
  }

  activePopup = contentElement;
  popupResultDisplay.appendChild(contentElement); // Di chuyển element vào pop-up
  contentElement.classList.remove("hidden"); // Hiển thị section
  popupResultDisplay.classList.remove("hidden"); // Hiển thị pop-up
}

function startHideTimer() {
  clearTimeout(hidePopupTimer);
  hidePopupTimer = setTimeout(() => {
    if (activePopup) {
      activePopup.classList.add("hidden");
      analysisColumnContent.appendChild(activePopup); // Trả về kho chứa ẩn
      activePopup = null;
      popupResultDisplay.classList.add("hidden");
    }
  }, 300); // Đợi 300ms
}

// --- POPUP EVENT LISTENERS ---
actionWrapper.addEventListener("mouseleave", startHideTimer);
popupResultDisplay.addEventListener("mouseenter", () =>
  clearTimeout(hidePopupTimer)
); // Hủy ẩn nếu di chuột vào pop-up

suggestTitlesBtn.addEventListener("mouseenter", () => showPopup(titleSuggestionSection));
analyzeCharactersBtn.addEventListener("mouseenter", () => showPopup(charAnalysisSection));
analyzePlaceNamesBtn.addEventListener("mouseenter", () => showPopup(placeNameAnalysisSection)); // NEW
plotAnalysisBtn.addEventListener("mouseenter", () => showPopup(plotAnalysisSection));
analyzeRelationshipsBtn.addEventListener("mouseenter", () => showPopup(relationshipAnalysisSection));
// Nút dịch không cần hover
translateBtn.addEventListener("mouseenter", () => clearTimeout(hidePopupTimer));

// --- Load API Keys on Startup ---
function loadApiKeys() {
  const savedAnalysisKey = localStorage.getItem("analysisApiKey");
  if (savedAnalysisKey) {
    analysisApiKeyInput.value = savedAnalysisKey;
    userAnalysisApiKey = savedAnalysisKey;
  }
  const savedTranslateKey = localStorage.getItem("translateApiKey");
  if (savedTranslateKey) {
    translateApiKeyInput.value = savedTranslateKey;
    userTranslateApiKey = savedTranslateKey;
  }
}
loadApiKeys(); // Call on script load

function handleDrop(e) {
  if (e.dataTransfer.files.length > 0) {
    fileUpload.files = e.dataTransfer.files;
    handleFileSelect({ target: fileUpload });
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  // Reset mọi thứ
  characterMapContainer.innerHTML = "";
  analysisStatus.textContent = "";
  placeNameMapContainer.innerHTML = ""; // NEW Reset Place Names
  placeNamesStatus.textContent = ""; // NEW
  plotAnalysisStatus.textContent = "";
  plotAnalysisResultContainer.classList.add("hidden");
  relationshipsStatus.textContent = "";
  relationshipsResultContainer.classList.add("hidden");
  titlesStatus.textContent = "";
  titlesResultContainer.classList.add("hidden");
  suggestedTitlesList.innerHTML = "";

  fullscreenBtn.classList.add("hidden");
  plotAnalysisContext = "";
  relationshipContext = "";
  placeNameContext = ""; // NEW Reset Place Name context
  downloadBtnWrapper.classList.add("hidden");
  editToolbar.classList.add("hidden");
  resultContainer.classList.add("hidden");
  loadingContainer.classList.add("hidden");
  statusDiv.textContent = "";
  failedChunkIndices = []; // Reset failed chunks

  // Ẩn các section trong cột phân tích (dù cột đã ẩn)
  titleSuggestionSection.classList.add("hidden");
  charAnalysisSection.classList.add("hidden");
  placeNameAnalysisSection.classList.add("hidden"); // NEW
  plotAnalysisSection.classList.add("hidden");
  relationshipAnalysisSection.classList.add("hidden");

  if (file && file.name.endsWith(".srt")) {
    originalFileName = file.name.replace(".srt", "");
    fileNameDisplay.textContent = file.name;
    fileNameDisplay.classList.add("text-green-400");
    [analyzeCharactersBtn, analyzePlaceNamesBtn, plotAnalysisBtn, suggestTitlesBtn].forEach( // Added analyzePlaceNamesBtn
      (btn) => (btn.disabled = false)
    );
    analyzeRelationshipsBtn.disabled = true; // Vẫn tắt cho đến khi Bước 2 chạy
    translateBtn.disabled = true; // Vẫn tắt cho đến khi Bước 2 chạy

    const reader = new FileReader();
    reader.onload = (e) => {
      originalSrtContent = e.target.result;
      parsedSubs = parseSRT(originalSrtContent);
      displaySubtitles(parsedSubs, originalSubDiv);
    };
    reader.readAsText(file);
  } else {
    fileNameDisplay.textContent = "Kéo thả hoặc nhấp để tải tệp .srt";
    fileNameDisplay.classList.remove("text-green-400");
    [
      translateBtn,
      analyzeCharactersBtn,
      analyzePlaceNamesBtn, // NEW
      plotAnalysisBtn,
      analyzeRelationshipsBtn,
      suggestTitlesBtn
    ].forEach((btn) => (btn.disabled = true));
    originalFileName = "";
    originalSrtContent = "";
    parsedSubs = [];
  }
}

// --- Modal Logic ---
function showModalWithContent(type) {
  // Currently only supports character analysis modal
  if (type === "analysis") {
    if (characterMapContainer.innerHTML.trim() === "") {
      analysisStatus.textContent = "Chưa có phân tích nào để hiển thị.";
      analysisStatus.className = "text-yellow-400";
      return;
    }
    modalTitle.textContent = "Bản Phân Tích Nhân Vật Chi Tiết";
    const clonedContent = characterMapContainer.cloneNode(true);
    clonedContent.classList.remove(
      "max-h-60",
      "overflow-y-auto",
      "pr-2"
    );
    modalContent.innerHTML = "";
    modalContent.appendChild(clonedContent);
    modalContent.classList.remove("modal-prose");
    analysisModal.classList.remove("hidden");
  }
}

function hideAnalysisModal() {
  analysisModal.classList.add("hidden");
}

// --- Character Profile Logic ---
function getCharacterContext() {
  const entries = characterMapContainer.querySelectorAll(
    ".character-profile-card"
  );
  if (entries.length === 0) return "";
  let contextText =
    "BỐI CẢNH NHÂN VẬT (CỰC KỲ QUAN TRỌNG, HÃY TUÂN THỦ NGHIÊM NGẶT):\n";
  entries.forEach((entry) => {
    const nameDisplay = entry.querySelector(".original-name-display");
    const genderInput = entry.querySelector(".gender-input");
    const ageInput = entry.querySelector(".age-input");
    const ruleInput = entry.querySelector(".translation-rule-input");

    if (nameDisplay && genderInput && ageInput && ruleInput) {
      const nameParts = nameDisplay.textContent.split(":");
      const originalName = nameParts[0]?.trim() || '';
      const phoneticName = nameParts[1]?.trim() || '';
      const gender = genderInput.value.trim();
      const age = ageInput.value.trim();
      const translationRule = ruleInput.value.trim();

      if (originalName && translationRule) {
        let info = `Tên: ${originalName} (Phiên âm: ${phoneticName})`;
        if (gender) info += `, Giới tính: ${gender}`;
        if (age) info += `, Tuổi: ${age}`;
        contextText += `\n- NHÂN VẬT: ${info}\n  - QUY TẮC DỊCH TÊN/XƯNG HÔ CHÍNH: ${translationRule}\n`;
      }
    } else {
      console.warn("Could not find all expected elements in a character card:", entry);
    }
  });
  return contextText;
}

async function runCharacterAnalysis() {
  if (parsedSubs.length === 0)
    throw new Error("Vui lòng tải tệp SRT trước.");

  analysisStatus.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Đang phân tích, vui lòng chờ...`;
  analysisStatus.className =
    "text-blue-400 flex items-center justify-center";
  analyzeCharactersBtn.disabled = true;
  analyzeRelationshipsBtn.disabled = true;
  translateBtn.disabled = true;

  charAnalysisSection.classList.remove("hidden");

  try {
    const sampleText = parsedSubs
      .slice(0, Math.min(parsedSubs.length, 300))
      .map((sub) => sub.text)
      .join("\n");
    const characters = await analyzeCharactersWithAI(sampleText);

    characterMapContainer.innerHTML = "";
    if (characters.length === 0) {
      analysisStatus.textContent = "Không tìm thấy nhân vật nào đáng kể.";
      analysisStatus.className = "text-gray-400";
    } else {
      characters.forEach((char) => {
        const entry = document.createElement("div");
        entry.className = "character-profile-card";
        entry.innerHTML = `
                <button class="delete-char-btn" title="Xóa nhân vật">
                  <i class="fas fa-trash-alt" style="pointer-events: none;"></i>
                </button>
                <h4 class="original-name-display text-lg font-bold text-white mb-2">${
                  char.full_chinese_name
                }: ${char.vietnamese_phonetic_name}</h4>
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Giới tính</label>
                    <input type="text" value="${
                      char.gender || ''
                    }" class="gender-input editable-field" placeholder="Nam/Nữ...">
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Tuổi</label>
                    <input type="text" value="${
                      char.estimated_age || ''
                    }" class="age-input editable-field" placeholder="Tuổi...">
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">Quy tắc dịch tên/xưng hô</label>
                  <input type="text" value="${
                    char.vietnamese_phonetic_name
                  }" placeholder="Nhập quy tắc dịch/xưng hô..." class="translation-rule-input editable-field">
                </div>
              `;
        characterMapContainer.appendChild(entry);
      });
      analysisStatus.textContent = `Phân tích xong! Đã tìm thấy ${characters.length} nhân vật.`;
      analysisStatus.className = "text-green-500";
      fullscreenBtn.classList.remove("hidden");
      translateBtn.disabled = false;
      analyzeRelationshipsBtn.disabled = false;
    }
  } catch (error) {
    console.error("Lỗi phân tích nhân vật:", error);
    analysisStatus.textContent = `Lỗi: ${error.message}`;
    analysisStatus.className = "text-red-500";
    throw error;
  } finally {
    analyzeCharactersBtn.disabled = false;
  }
}

async function analyzeCharactersWithAI(text) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${
    userAnalysisApiKey || ""
  }`;
  const systemPrompt = `Bạn là một chuyên gia phân tích kịch bản. Nhiệm vụ của bạn là đọc phụ đề và trích xuất TOÀN BỘ các nhân vật.
1. ƯU TIÊN HÀNG ĐẦU: Chỉ lấy những nhân vật có "Họ và Tên Đầy Đủ" (ví dụ: 'Lý Mộ Bạch', 'Trương Vô Kỵ').
2. BỎ QUA: Bỏ qua các danh xưng, biệt hiệu (ví dụ: 'bạch nguyệt quang', 'sư phụ') hoặc các tên không đầy đủ, tên chỉ có 1 chữ.
3. NGOẠI LỆ QUAN TRỌNG: Nếu phát hiện có "nhân vật tôi" (người kể chuyện, xưng '我'), HÃY THÊM nhân vật đó vào danh sách với tên 'Nhân vật tôi' hoặc 'Người kể chuyện', và cố gắng suy đoán giới tính, độ tuổi.`;

  const userPrompt = `Phân tích các nhân vật trong phụ đề sau. Chỉ lấy nhân vật có HỌ TÊN ĐẦY ĐỦ (hoặc "Nhân vật tôi"). Với mỗi nhân vật, cung cấp các mục sau:\n1. 'full_chinese_name': Tên đầy đủ tiếng Trung (hoặc '我' nếu là người kể chuyện).\n2. 'vietnamese_phonetic_name': Tên phiên âm Hán-Việt (hoặc 'Nhân vật tôi').\n3. 'gender': Giới tính (suy đoán nếu có thể).\n4. 'estimated_age': Tuổi ước tính (suy đoán nếu có thể).\n\nPhụ đề:\n\n${text}`;

  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            full_chinese_name: { type: "STRING" },
            vietnamese_phonetic_name: { type: "STRING" },
            gender: { type: "STRING" },
            estimated_age: { type: "STRING" },
          },
          required: [
            "full_chinese_name",
            "vietnamese_phonetic_name",
            "gender",
            "estimated_age",
          ],
        },
      },
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  };
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error(
      `Lỗi API phân tích: ${response.status} ${await response.text()}`
    );
  const result = await response.json();
  const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!jsonText) throw new Error("Phản hồi AI không chứa JSON.");
  return JSON.parse(jsonText);
}

// --- Place Name Analysis (NEW) ---
function getPlaceNameContext() {
  const entries = placeNameMapContainer.querySelectorAll(".place-name-card");
  if (entries.length === 0) return "";
  let contextText = "BỐI CẢNH ĐỊA DANH (Dịch nhất quán theo quy tắc sau):\n";
  entries.forEach((entry) => {
    const originalNameEl = entry.querySelector(".original-place-name");
    const translationInput = entry.querySelector(".vietnamese-place-name-input");

    if (originalNameEl && translationInput) {
      const originalName = originalNameEl.textContent.trim();
      const translationRule = translationInput.value.trim();
      if (originalName && translationRule) {
        contextText += `- ${originalName}: ${translationRule}\n`;
      }
    } else {
      console.warn("Could not find all expected elements in a place name card:", entry);
    }
  });
  return contextText;
}

async function runAnalyzePlaceNames() {
  if (parsedSubs.length === 0) {
    placeNamesStatus.textContent = "Vui lòng tải tệp SRT trước.";
    placeNamesStatus.className = "text-yellow-400";
    return;
  }
  placeNamesStatus.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Đang phân tích địa danh...`;
  placeNamesStatus.className = "text-blue-400 flex items-center justify-center";
  analyzePlaceNamesBtn.disabled = true;

  placeNameAnalysisSection.classList.remove("hidden"); // Show section for hover

  try {
    const sampleText = parsedSubs.slice(0, Math.min(parsedSubs.length, 500))
      .map(sub => sub.text)
      .join("\n");
    const placeNames = await analyzePlaceNamesWithAI(sampleText);

    placeNameMapContainer.innerHTML = "";
    if (placeNames.length === 0) {
      placeNamesStatus.textContent = "Không tìm thấy địa danh nào đáng kể.";
      placeNamesStatus.className = "text-slate-400";
    } else {
      placeNames.forEach(place => {
        const entry = document.createElement("div");
        entry.className = "place-name-card";
        entry.innerHTML = `
                            <h4 class="original-place-name text-lg font-bold text-white mb-2">${place.chinese_place_name}</h4>
                            <div>
                                <label class="block text-xs font-medium text-slate-400 mb-1">Tên tiếng Việt / Quy tắc dịch</label>
                                <input type="text" value="${place.vietnamese_equivalent}" placeholder="Nhập tên tiếng Việt..." class="vietnamese-place-name-input editable-field">
                            </div>
                        `;
        placeNameMapContainer.appendChild(entry);
      });
      placeNamesStatus.textContent = `Phân tích xong! Đã tìm thấy ${placeNames.length} địa danh.`;
      placeNamesStatus.className = "text-green-500";
    }
  } catch (error) {
    console.error("Lỗi phân tích địa danh:", error);
    placeNamesStatus.textContent = `Lỗi: ${error.message}`;
    placeNamesStatus.className = "text-red-500";
  } finally {
    analyzePlaceNamesBtn.disabled = false;
  }
}

async function analyzePlaceNamesWithAI(text) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${userAnalysisApiKey || ""}`;
  const systemPrompt = "Bạn là chuyên gia phân tích văn bản, giỏi nhận diện các địa danh (tên thành phố, quốc gia, địa điểm cụ thể...) trong văn bản tiếng Trung.";
  const userPrompt = `Phân tích và trích xuất tất cả các địa danh có trong đoạn phụ đề tiếng Trung sau. Với mỗi địa danh, cung cấp:\n1. 'chinese_place_name': Tên địa danh gốc bằng tiếng Trung.\n2. 'vietnamese_equivalent': Tên địa danh đó bằng tiếng Việt (dịch hoặc phiên âm Hán-Việt phù hợp).\n\nChỉ lấy tên địa danh, bỏ qua tên người, tên tổ chức.\n\nPhụ đề:\n${text}\n\nHãy trả về kết quả dưới dạng một mảng JSON hợp lệ. Ví dụ: [{"chinese_place_name": "北京", "vietnamese_equivalent": "Bắc Kinh"}, {"chinese_place_name": "上海", "vietnamese_equivalent": "Thượng Hải"}]`;

  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            chinese_place_name: { type: "STRING" },
            vietnamese_equivalent: { type: "STRING" },
          },
          required: ["chinese_place_name", "vietnamese_equivalent"],
        },
      },
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Lỗi API phân tích địa danh: ${response.status} ${await response.text()}`);
  }
  const result = await response.json();
  const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!jsonText) {
    if (result.candidates && result.candidates.length > 0 && result.candidates[0].finishReason === 'SAFETY') {
      throw new Error("Phản hồi bị chặn vì lý do an toàn.");
    } else {
      console.warn("API returned no place names or unexpected response:", result);
      return [];
    }
  }
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      console.error("Parsed place name data is not an array:", parsed);
      throw new Error("Phản hồi AI không phải là một mảng JSON hợp lệ.");
    }
    return parsed;
  } catch (e) {
    console.error("Lỗi phân tích JSON địa danh:", e, "Raw:", jsonText);
    throw new Error("Phản hồi AI không phải là JSON hợp lệ.");
  }
}


// --- Plot Analysis ---
async function runPlotAnalysis() {
  if (parsedSubs.length === 0) {
    plotAnalysisStatus.textContent = "Vui lòng tải tệp SRT trước.";
    plotAnalysisStatus.className = "text-yellow-400";
    return;
  }
  plotAnalysisStatus.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Đang phân tích cốt truyện...`;
  plotAnalysisStatus.className =
    "text-blue-400 flex items-center justify-center";
  plotAnalysisBtn.disabled = true;
  plotAnalysisContext = "";

  plotAnalysisSection.classList.remove("hidden");

  try {
    const fullText = parsedSubs.map((sub) => sub.text).join("\n");
    const analysisResult = await analyzePlotWithAI(fullText);

    plotAnalysisContext = analysisResult;
    plotAnalysisResult.textContent = analysisResult;
    plotAnalysisResultContainer.classList.remove("hidden");
    plotAnalysisStatus.textContent = "Phân tích cốt truyện hoàn tất.";
    plotAnalysisStatus.className = "text-green-500";
  } catch (error) {
    console.error("Lỗi phân tích cốt truyện:", error);
    plotAnalysisStatus.textContent = `Lỗi: ${error.message}`;
    plotAnalysisStatus.className = "text-red-500";
  } finally {
    plotAnalysisBtn.disabled = false;
  }
}

async function analyzePlotWithAI(text) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${
    userAnalysisApiKey || ""
  }`;
  const systemPrompt = `Bạn là một biên tập viên kịch bản. Nhiệm vụ của bạn là đọc toàn bộ phụ đề và đưa ra nhận định ngắn gọn xem cốt truyện đã kết thúc trọn vẹn hay còn bỏ ngỏ, có khả năng có phần tiếp theo.`;
  const userPrompt = `Dựa vào toàn bộ nội dung phụ đề dưới đây, hãy cho biết cốt truyện đã kết thúc trọn vẹn chưa hay còn bỏ ngỏ (có khả năng có phần 2)?\n\nPhụ đề:\n${text.substring(
    0,
    50000
  )}... (trích đoạn toàn bộ phụ đề)`;

  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.3 },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  };
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error(
      `Lỗi API phân tích cốt truyện: ${
        response.status
      } ${await response.text()}`
    );
  const result = await response.json();
  const candidate = result.candidates?.[0];
  if (candidate && candidate.content?.parts?.[0]?.text) {
    return candidate.content.parts[0].text;
  } else {
    throw new Error("Phản hồi AI không hợp lệ.");
  }
}

// --- Relationship Analysis ---
function getCharacterListForAnalysis() {
  const entries = characterMapContainer.querySelectorAll(
    ".character-profile-card"
  );
  if (entries.length === 0) return "Chưa có nhân vật nào được phân tích.";

  let listText = "DANH SÁCH NHÂN VẬT ĐÃ BIẾT:\n";
  entries.forEach((entry) => {
    const nameDisplay = entry.querySelector(".original-name-display");
    const genderInput = entry.querySelector(".gender-input");
    const ageInput = entry.querySelector(".age-input");

    if (nameDisplay && genderInput && ageInput) {
      const nameParts = nameDisplay.textContent.split(":");
      const originalName = nameParts[0]?.trim() || '';
      const phoneticName = nameParts[1]?.trim() || '';
      const gender = genderInput.value.trim() || "Không rõ";
      const age = ageInput.value.trim() || "Không rõ";

      if (originalName) {
        listText += `- Tên: ${originalName} (Phiên âm: ${phoneticName}), Giới tính: ${gender}, Tuổi: ${age}\n`;
      }
    } else {
      console.warn("Could not find all expected elements in a character card for relationship analysis:", entry);
    }
  });
  return listText;
}


async function runRelationshipAnalysis() {
  if (parsedSubs.length === 0) {
    relationshipsStatus.textContent = "Vui lòng tải tệp SRT trước.";
    relationshipsStatus.className = "text-yellow-400";
    return;
  }
  if (characterMapContainer.innerHTML.trim() === "") {
    relationshipsStatus.textContent =
      "Vui lòng chạy 'Phân Tích Nhân Vật' trước.";
    relationshipsStatus.className = "text-yellow-400";
    return;
  }

  relationshipsStatus.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Đang phân tích mối quan hệ...`;
  relationshipsStatus.className =
    "text-blue-400 flex items-center justify-center";
  analyzeRelationshipsBtn.disabled = true;
  relationshipContext = "";

  relationshipAnalysisSection.classList.remove("hidden");

  try {
    const characterList = getCharacterListForAnalysis();
    const fullSrtText = parsedSubs.map((sub) => sub.text).join("\n");

    const analysisResult = await analyzeRelationshipsWithAI(
      characterList,
      fullSrtText
    );

    relationshipContext = analysisResult;
    relationshipsResult.innerHTML = analysisResult.replace(/\n/g, "<br>");
    relationshipsResultContainer.classList.remove("hidden");
    relationshipsStatus.textContent = "Phân tích mối quan hệ hoàn tất.";
    relationshipsStatus.className = "text-green-500";
  } catch (error) {
    console.error("Lỗi phân tích mối quan hệ:", error);
    relationshipsStatus.textContent = `Lỗi: ${error.message}`;
    relationshipsStatus.className = "text-red-500";
  } finally {
    analyzeRelationshipsBtn.disabled = false;
  }
}

async function analyzeRelationshipsWithAI(characterList, fullSrtText) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${
    userAnalysisApiKey || ""
  }`;

  const systemPrompt = `Bạn là một chuyên gia phân tích kịch bản, hiểu rõ về văn hóa và cách xưng hô của người Trung Quốc.
Nhiệm vụ của bạn là đọc danh sách nhân vật (cùng tuổi và giới tính) và toàn bộ lời thoại của kịch bản (tiếng Trung).
Sau đó, hãy phân tích mối quan hệ giữa các nhân vật chính VÀ gợi ý cách họ gọi nhau bằng tiếng Trung (sử dụng Pinyin).
Hãy trình bày kết quả một cách ngắn gọn, rõ ràng.`;

  const userPrompt = `Dựa trên danh sách nhân vật và toàn bộ lời thoại dưới đây, hãy phân tích mối quan hệ và gợi ý cách xưng hô tiếng Trung (Pinyin) cho họ.

${characterList}

---
TOÀN BỘ LỜI THOẠI (để phân tích bối cảnh):
${fullSrtText.substring(0, 50000)}... (trích đoạn)
---

Hãy trả về kết quả phân tích của bạn dưới dạng văn bản thuần túy, ví dụ:
- A (Nam, 30) và B (Nữ, 28): Người yêu. A gọi B là 'Bǎobèi'. B gọi A là 'Lǎogōng'.
- C (Nam, 55) là cha của A: A gọi C là 'Bàba'. C gọi A là 'Érzi'.`;

  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.3 },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Lỗi API phân tích MQH: ${
        response.status
      } ${await response.text()}`
    );
  }
  const result = await response.json();
  const candidate = result.candidates?.[0];
  if (candidate && candidate.content?.parts?.[0]?.text) {
    return candidate.content.parts[0].text;
  } else {
    throw new Error("Phản hồi AI không hợp lệ.");
  }
}

// --- Title Suggestion Logic ---
async function runSuggestTitles() {
  if (parsedSubs.length === 0) {
    titlesStatus.textContent = "Vui lòng tải tệp SRT trước.";
    titlesStatus.className = "text-yellow-400";
    return;
  }
  titlesStatus.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Đang tìm gợi ý tên truyện...`;
  titlesStatus.className = "text-blue-400 flex items-center justify-center";
  suggestTitlesBtn.disabled = true;
  regenerateTitlesBtn.disabled = true;

  titleSuggestionSection.classList.remove("hidden");

  try {
    const srtSampleText = parsedSubs.slice(0, Math.min(parsedSubs.length, 300))
      .map(sub => sub.text)
      .join("\n");
    const suggestedTitles = await suggestTitlesWithAI(srtSampleText);

    suggestedTitlesList.innerHTML = "";
    if (suggestedTitles && suggestedTitles.length > 0) {
      suggestedTitles.forEach(title => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.textContent = title;
        const button = document.createElement("button");
        button.className = "copy-title-btn";
        button.innerHTML = '<i class="fas fa-copy"></i>';
        button.title = "Sao chép tên";

        li.appendChild(span);
        li.appendChild(button);
        suggestedTitlesList.appendChild(li);
      });
      titlesResultContainer.classList.remove("hidden");
      titlesStatus.textContent = "Đã tìm thấy 10 gợi ý tên truyện:";
      titlesStatus.className = "text-green-500";
    } else {
      titlesStatus.textContent = "Không thể tạo gợi ý tên truyện.";
      titlesStatus.className = "text-yellow-400";
      titlesResultContainer.classList.add("hidden");
    }

  } catch (error) {
    console.error("Lỗi gợi ý tên truyện:", error);
    titlesStatus.textContent = `Lỗi: ${error.message}`;
    titlesStatus.className = "text-red-500";
  } finally {
    suggestTitlesBtn.disabled = false;
    regenerateTitlesBtn.disabled = false;
  }
}

async function suggestTitlesWithAI(srtContent) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${userAnalysisApiKey || ""}`;
  const systemPrompt = "Bạn là một biên tập viên sáng tạo. Nhiệm vụ của bạn là đọc tóm tắt hoặc trích đoạn nội dung của một câu chuyện (từ phụ đề) và gợi ý 10 tên truyện bằng tiếng Việt thật hấp dẫn, ngắn gọn và phù hợp với nội dung.";
  const userPrompt = `Dựa vào nội dung phụ đề dưới đây, hãy gợi ý 10 tên truyện bằng tiếng Việt. Mỗi tên truyện cần ngắn gọn, hấp dẫn và phản ánh được nội dung chính hoặc không khí của câu chuyện.\n\nNội dung phụ đề (trích đoạn):\n${srtContent}\n\nHãy trả về kết quả dưới dạng một mảng JSON chỉ chứa các chuỗi tên truyện (ví dụ: ["Tên truyện 1", "Tên truyện 2", ..., "Tên truyện 10"]).`;

  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: { type: "STRING" }
      },
      temperature: 0.7
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Lỗi API gợi ý tên: ${response.status} ${await response.text()}`);
  }
  const result = await response.json();
  const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!jsonText) {
    throw new Error("Phản hồi AI không chứa danh sách tên truyện.");
  }
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Lỗi phân tích JSON tên truyện:", e, "Raw:", jsonText);
    throw new Error("Phản hồi AI không phải là JSON hợp lệ.");
  }
}

// --- Copy to Clipboard Function ---
function copyToClipboard(text, buttonElement) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    const originalIcon = buttonElement.innerHTML;
    buttonElement.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
      buttonElement.innerHTML = originalIcon;
    }, 1500);
  } catch (err) {
    console.error('Không thể sao chép:', err);
  }
  document.body.removeChild(textarea);
}


// --- SRT Utilities ---
function parseSRT(data) {
  return data
    .replace(/\r/g, "")
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n");
      return lines.length >= 3
        ? {
          index: lines[0],
          time: lines[1],
          text: lines.slice(2).join("\n"),
        }
        : null;
    })
    .filter(Boolean);
}
function buildSRT(subs) {
  return subs
    .map((sub) => `${sub.index}\n${sub.time}\n${sub.text}`)
    .join("\n\n");
}

function displaySubtitles(subs, element, isEditable = false) {
  element.innerHTML = "";
  subs.forEach((sub, i) => {
    const block = document.createElement("div");
    block.id = `${element.id}-block-${i}`;
    block.className = "sub-block";

    const indexEl = document.createElement("div");
    indexEl.className = "sub-index";
    indexEl.textContent = sub.index;

    const timeEl = document.createElement("div");
    timeEl.className = "sub-time";
    timeEl.textContent = sub.time;

    const textEl = document.createElement("div");
    textEl.className = "sub-text";
    textEl.textContent = sub.text;

    block.append(indexEl, timeEl, textEl);

    // Add retry button only for the translated side and if it's an error
    if (isEditable && sub.text === "[LỖI DỊCH - Cần dịch lại thủ công]") {
      block.classList.add('error-translate');
      const retryBtn = document.createElement('button');
      retryBtn.className = 'retry-translate-btn';
      retryBtn.title = 'Dịch lại dòng này';
      retryBtn.dataset.arrayIndex = i; // Store index on the button
      retryBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
      block.appendChild(retryBtn); // Append button to the block
    }

    if (isEditable) {
      textEl.contentEditable = true;
      textEl.dataset.arrayIndex = i; // Store index on the text element as well
    }

    element.appendChild(block);
  });
}


// --- Translation & Editing ---
async function runTranslation() {
  if (parsedSubs.length === 0)
    throw new Error("Không có nội dung để dịch.");
  if (characterMapContainer.innerHTML.trim() === "") {
    statusDiv.textContent =
      "Lỗi: Bạn phải chạy 'Phân Tích Nhân Vật' trước khi dịch.";
    statusDiv.className = "text-red-500";
    return;
  }

  translateBtn.disabled = true;
  resultContainer.classList.add("hidden");
  loadingContainer.classList.remove("hidden");
  loadingContainer.classList.add("flex");
  statusDiv.textContent = "";
  translatedSubDiv.innerHTML = "";
  progressBar.style.width = "0%";
  failedChunkIndices = []; // Reset failed chunks tracker

  const CHUNK_SIZE = 30;
  const characterContext = getCharacterContext();
  const placeNameContextForTranslation = getPlaceNameContext();
  const selectedGenre = genreSelect.value;
  const plotContextForTranslation = plotAnalysisContext;
  const relationshipContextForTranslation = relationshipContext;
  translatedParsedSubs = []; // Start fresh for translation results
  let previousChunkContext = "";
  const totalChunks = Math.ceil(parsedSubs.length / CHUNK_SIZE);

  try {
    for (let i = 0; i < parsedSubs.length; i += CHUNK_SIZE) {
      const chunkIndex = Math.floor(i / CHUNK_SIZE); // 0-based index
      const displayChunkIndex = chunkIndex + 1;
      loadingText.textContent = `Đang dịch khối ${displayChunkIndex} / ${totalChunks}...`;
      progressBar.style.width = `${(displayChunkIndex / totalChunks) * 100}%`;

      const chunk = parsedSubs.slice(i, i + CHUNK_SIZE);
      const textToTranslate = chunk
        .map((sub, index) => `${index + 1}:: ${sub.text}`)
        .join("\n---\n");

      let translatedText = "";
      let attempt = 0;
      const MAX_ATTEMPTS = 3;
      let isValidResponse = false;
      let chunkError = null;

      // --- TRY CATCH BLOCK FOR EACH CHUNK ---
      try {
        while (attempt < MAX_ATTEMPTS && !isValidResponse) {
          attempt++;
          try {
            translatedText = await callTranslationAPI(
              textToTranslate,
              characterContext,
              placeNameContextForTranslation,
              selectedGenre,
              previousChunkContext,
              plotContextForTranslation,
              relationshipContextForTranslation
            );
            const translatedMap = new Map();
            translatedText.split("\n---\n").forEach((block) => {
              const match = block.trim().match(/^(\d+)::([\s\S]*)/);
              if (match)
                translatedMap.set(
                  parseInt(match[1], 10) - 1,
                  match[2].trim()
                );
            });
            if (translatedMap.size === chunk.length) {
              isValidResponse = true; // Success!
              // Process successful translation
              const tempTranslatedChunk = [];
              chunk.forEach((sub, index) => {
                const newSub = { ...sub };
                newSub.text = translatedMap.has(index) ? translatedMap.get(index) : `[LỖI PHÂN TÍCH] ${sub.text}`; // Should not happen if size matches
                translatedParsedSubs.push(newSub); // Add to the main results array
                tempTranslatedChunk.push(newSub);
              });
              previousChunkContext = // Update context only on success
                `BỐI CẢNH TỪ NHỮNG CÂU THOẠI TRƯỚC ĐÓ (để dịch cho khớp):\n` +
                tempTranslatedChunk
                .slice(-3)
                .map((s) => s.text)
                .join("\n");

            } else {
              console.warn(
                `Attempt ${attempt}: Invalid response for chunk ${displayChunkIndex}. Expected ${chunk.length}, got ${translatedMap.size}. Retrying...`
              );
              if (attempt >= MAX_ATTEMPTS) {
                chunkError = new Error(`API trả về phản hồi không hợp lệ cho khối ${displayChunkIndex} sau ${MAX_ATTEMPTS} lần thử.`);
              } else {
                await new Promise((res) => setTimeout(res, 1000 * attempt));
              }
            }
          } catch (error) { // Catch errors from callTranslationAPI or response processing
            console.warn(
              `Attempt ${attempt}: API call failed for chunk ${displayChunkIndex}. Retrying...`, error
            );
            if (attempt >= MAX_ATTEMPTS) {
              chunkError = error; // Store the final error
            } else {
              await new Promise((res) => setTimeout(res, 1000 * attempt));
            }
          }
        } // end while loop

        if (chunkError) { // If after retries, there was still an error
          throw chunkError;
        }

      } catch (error) { // Catch errors specific to this chunk (including thrown errors from while loop)
        console.error(`Lỗi khi dịch khối ${displayChunkIndex}:`, error);
        failedChunkIndices.push(displayChunkIndex); // Track failed chunk number
        // Mark lines in this chunk as failed
        chunk.forEach(sub => {
          const failedSub = { ...sub, text: "[LỖI DỊCH - Cần dịch lại thủ công]" };
          translatedParsedSubs.push(failedSub); // Add failed markers to the main results
        });
        previousChunkContext = ""; // Reset context after failure
      }
      // --- END TRY CATCH BLOCK ---

      // Update UI regardless of success or failure for the current chunk
      displaySubtitles(translatedParsedSubs, translatedSubDiv, true);
      await new Promise((res) => setTimeout(res, 500)); // Shorter delay between chunks
    } // end for loop

    // Final status message
    translatedSrtContent = buildSRT(translatedParsedSubs);
    if (failedChunkIndices.length > 0) {
      statusDiv.textContent = `Dịch hoàn tất với ${failedChunkIndices.length} khối bị lỗi (đã đánh dấu). Vui lòng kiểm tra và dịch lại thủ công hoặc dùng chức năng 'Dịch Lại Lỗi'.`;
      statusDiv.className = "text-yellow-500";
    } else {
      statusDiv.textContent = "Dịch hoàn tất! Bạn có thể chỉnh sửa trực tiếp bên trên.";
      statusDiv.className = "text-green-500";
    }
    resultContainer.classList.remove("hidden");
    editToolbar.classList.remove("hidden");
    downloadBtnWrapper.classList.remove("hidden");

  } catch (error) { // Catch any unexpected error outside the chunk loop (should be rare now)
    console.error("Lỗi nghiêm trọng trong quá trình dịch:", error);
    statusDiv.textContent = `Đã xảy ra lỗi nghiêm trọng: ${error.message}`;
    statusDiv.className = "text-red-500";
    // Don't throw, let it finish gracefully but show error
  } finally {
    loadingContainer.classList.add("hidden");
    loadingContainer.classList.remove("flex");
    translateBtn.disabled = false;
  }
}

// Function to retry translation for a single line
async function retrySingleTranslation(index, buttonElement) {
    if (!parsedSubs[index]) return; // Check if original sub exists at this index

    const originalText = parsedSubs[index].text; // Always get the ORIGINAL text

    const blockElement = document.getElementById(`translated-sub-block-${index}`);
    const textElement = blockElement?.querySelector('.sub-text');

    if (!blockElement || !textElement) return;

    // Show loading state
    buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    buttonElement.classList.add('loading');
    buttonElement.disabled = true;
    const originalBlockClasses = blockElement.className;
    blockElement.classList.remove('error-translate', 'warning-highlight'); // Temporarily remove error style

    try {
        const characterContext = getCharacterContext();
        const placeNameContextForRetranslation = getPlaceNameContext();
        const selectedGenre = genreSelect.value;
        const apiKeyToUse = retranslateApiKeyInput.value.trim() || userTranslateApiKey;

         if (!apiKeyToUse) {
            throw new Error("Không tìm thấy API Key để dịch lại.");
         }

        // Call API with isSingleRetry = true
        const translatedTextResult = await callTranslationAPI(
            `1:: ${originalText}`,
            characterContext,
            placeNameContextForRetranslation,
            selectedGenre,
            "", // No previous context
            "", // No plot context
            "", // No relationship context
            apiKeyToUse,
            true // isSingleRetry = true
        );

        const match = translatedTextResult.trim().match(/^1::([\s\S]*)/);
        if (match && match[1]) {
            const newText = match[1].trim();
            translatedParsedSubs[index].text = newText; // Update data array
            textElement.textContent = newText; // Update UI
            textElement.style.fontStyle = 'normal';
            textElement.style.color = '';
            buttonElement.remove(); // Remove retry button on success
            translatedSrtContent = buildSRT(translatedParsedSubs); // Update main SRT content
        } else {
             console.error("API response format unexpected:", translatedTextResult);
             textElement.textContent = `[LỖI PHÂN TÍCH PHẢN HỒI]: ${translatedTextResult}`; // Display raw response for debug
             throw new Error("API không trả về định dạng mong đợi (1:: text).");
        }
    } catch (error) {
        console.error(`Lỗi dịch lại dòng ${index}:`, error);
        textElement.textContent = `[LỖI DỊCH LẠI: ${error.message}]`; // Show error message in the line
        // Ensure the block is marked as error
        if (!blockElement.classList.contains('error-translate')) {
             blockElement.classList.add('error-translate');
        }
        // Reset button after a short delay
        setTimeout(() => {
           buttonElement.innerHTML = '<i class="fas fa-sync-alt"></i>';
           buttonElement.classList.remove('loading');
           buttonElement.disabled = false;
        }, 1500);
    }
}


async function checkRemainingChinese() {
  document
    .querySelectorAll(".sub-block.warning-highlight, .sub-block.error-translate") // Check both warning and error classes
    .forEach((el) => {
      el.classList.remove("warning-highlight");
      // Keep error-translate class if it exists, remove only warning-highlight
    });

  const chineseRegex = /[\u4e00-\u9fa5]/;
  const findValue = findInput.value.trim();
  untranslatedIndices = []; // Reset indices needing re-translation (specifically for Chinese chars)
  retranslateIssuesBtn.classList.add("hidden"); // Hide the bulk retranslate button initially

  if (translatedParsedSubs.length === 0) {
    editToolStatus.textContent = "Chưa có bản dịch để rà soát.";
    editToolStatus.className = "text-sm mt-2 text-center text-yellow-400";
    return;
  }

  let foundHighlightCount = 0; // Count lines that need highlighting (search or error)
  let chineseCharCount = 0; // Count lines with Chinese chars specifically

  translatedParsedSubs.forEach((sub, i) => {
    let needsHighlight = false;
    let hasChinese = false;

    // Check for Chinese characters
    if (chineseRegex.test(sub.text)) {
      hasChinese = true;
      // Only add to untranslatedIndices IF it's not the generic error message
      if (sub.text !== "[LỖI DỊCH - Cần dịch lại thủ công]" && !sub.text.startsWith("[LỖI DỊCH LẠI:") && !sub.text.startsWith("[LỖI PHÂN TÍCH PHẢN HỒI]:")) {
        untranslatedIndices.push(i);
      }
      needsHighlight = true;
    }
    // Check for search term
    if (findValue && sub.text.includes(findValue)) {
      needsHighlight = true;
    }
    // Check for existing error marker
    if (sub.text === "[LỖI DỊCH - Cần dịch lại thủ công]" || sub.text.startsWith("[LỖI DỊCH LẠI:") || sub.text.startsWith("[LỖI PHÂN TÍCH PHẢN HỒI]:")) {
      needsHighlight = true; // Ensure error lines are highlighted by search/scan
    }


    if (needsHighlight) {
      const block = document.getElementById(`translated-sub-block-${i}`);
      if (block) {
        // Add warning highlight unless it's already an error block
        if (!block.classList.contains('error-translate')) {
          block.classList.add("warning-highlight");
        }
        foundHighlightCount++;
      }
    }
    if (hasChinese && sub.text !== "[LỖI DỊCH - Cần dịch lại thủ công]" && !sub.text.startsWith("[LỖI DỊCH LẠI:") && !sub.text.startsWith("[LỖI PHÂN TÍCH PHẢN HỒI]:")) chineseCharCount++; // Count only if it's not the generic error message
  });

  let statusMessage = "";
  if (foundHighlightCount > 0) {
    if (findValue) {
      statusMessage += `Tìm thấy ${foundHighlightCount} dòng chứa "${findValue}" hoặc bị lỗi dịch/còn tiếng Trung. `;
    } else {
      statusMessage += `Tìm thấy ${foundHighlightCount} dòng bị lỗi dịch hoặc còn sót tiếng Trung. `;
    }

    if (chineseCharCount > 0) {
      // Only show bulk retranslate button if there are actual Chinese chars (not just errors)
      retranslateIssuesBtn.classList.remove("hidden");
      statusMessage += `(${chineseCharCount} dòng có tiếng Trung có thể dịch lại hàng loạt).`;
    }
    editToolStatus.textContent = `Rà soát hoàn tất. ${statusMessage}`;
    editToolStatus.className = "text-sm mt-2 text-center text-yellow-400";
    const firstIssue = document.querySelector(
      ".sub-block.warning-highlight, .sub-block.error-translate" // Scroll to first warning or error
    );
    if (firstIssue)
      firstIssue.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    editToolStatus.textContent =
      "Rà soát hoàn tất. Không tìm thấy vấn đề.";
    editToolStatus.className = "text-sm mt-2 text-center text-green-500";
  }
}

async function retranslateIssues() {
  if (untranslatedIndices.length === 0) return; // Only retranslate lines specifically marked for Chinese chars

  retranslateIssuesBtn.disabled = true;
  editToolStatus.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Đang dịch lại ${untranslatedIndices.length} dòng có tiếng Trung...`;
  editToolStatus.className = "text-sm mt-2 text-center text-blue-400";

  const characterContext = getCharacterContext();
  const placeNameContextForRetranslation = getPlaceNameContext();
  const selectedGenre = genreSelect.value;
  // Use shorter prompt for bulk retry as well? Let's try it.
  // const plotContextForRetranslation = plotAnalysisContext;
  // const relationshipContextForRetranslation = relationshipContext;

  const apiKeyToUse =
    retranslateApiKeyInput.value.trim() || userTranslateApiKey;
  if (!apiKeyToUse) {
    editToolStatus.textContent =
      "Lỗi: Cần API Key (ở Cột 1 hoặc ô này) để dịch lại.";
    editToolStatus.className = "text-sm mt-2 text-center text-red-500";
    retranslateIssuesBtn.disabled = false;
    return;
  }

  let successCount = 0;
  // Use Promise.allSettled to handle individual failures without stopping others
  const results = await Promise.allSettled(untranslatedIndices.map(async (index) => {
      const originalText = parsedSubs[index].text;
      // Call API with isSingleRetry = true even for bulk retry of individual lines
      const translatedText = await callTranslationAPI(
        `1:: ${originalText}`,
        characterContext,
        placeNameContextForRetranslation,
        selectedGenre,
        "", // No previous context
        "", // No plot context
        "", // No relationship context
        apiKeyToUse,
        true // isSingleRetry = true
      );
      const match = translatedText.trim().match(/^1::([\s\S]*)/);
      if (match && match[1]) {
        translatedParsedSubs[index].text = match[1].trim();
        return { status: 'fulfilled', index: index }; // Indicate success
      } else {
        console.warn(`Dịch lại dòng ${index} không trả về kết quả hợp lệ:`, translatedText);
         throw new Error(`Invalid format for index ${index}`); // Throw to mark as rejected
      }
  }));

   // Process results after all promises have settled
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            successCount++;
            const block = document.getElementById(`translated-sub-block-${result.value.index}`);
            if (block) {
                block.classList.remove('error-translate', 'warning-highlight');
                const retryBtn = block.querySelector('.retry-translate-btn');
                if (retryBtn) retryBtn.remove();
            }
        } else {
            console.error(`Lỗi khi dịch lại dòng (từ bulk retry):`, result.reason);
            // Error handling for failed lines in bulk retry (similar to single retry failure)
            // Need to extract index from error if possible, or iterate through untranslatedIndices again
            // For simplicity, we might just leave the error marker from the initial check
            // Or re-display with a specific bulk-retry error message
             const failedIndexMatch = result.reason.message.match(/index (\d+)/);
             if (failedIndexMatch && failedIndexMatch[1]) {
                 const failedIndex = parseInt(failedIndexMatch[1], 10);
                 if (!isNaN(failedIndex) && translatedParsedSubs[failedIndex]) {
                     translatedParsedSubs[failedIndex].text = "[LỖI DỊCH LẠI HÀNG LOẠT]";
                     const block = document.getElementById(`translated-sub-block-${failedIndex}`);
                     if (block) {
                         block.classList.add('error-translate');
                         block.classList.remove('warning-highlight');
                         if (!block.querySelector('.retry-translate-btn')) {
                            // Optionally re-add retry button
                         }
                     }
                 }
             }
        }
    });


  displaySubtitles(translatedParsedSubs, translatedSubDiv, true); // Redisplay everything once
  translatedSrtContent = buildSRT(translatedParsedSubs);

  editToolStatus.textContent = `Đã dịch lại ${successCount} / ${untranslatedIndices.length} dòng có tiếng Trung.`;
  editToolStatus.className = "text-sm mt-2 text-center text-green-500";

  retranslateIssuesBtn.disabled = false;
  retranslateIssuesBtn.classList.add("hidden");
  untranslatedIndices = []; // Clear the list after attempting

  // Re-run the check to confirm and highlight remaining issues
  setTimeout(checkRemainingChinese, 500);
}


async function callTranslationAPI(
  text,
  characterContext,
  placeNameContext,
  genre,
  previousContext,
  plotAnalysisContext,
  relationshipContext,
  specificApiKey = null,
  isSingleRetry = false // NEW parameter
) {
  const apiKey = specificApiKey || userTranslateApiKey;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${
    apiKey || ""
  }`;
  const genreInstruction =
    genre && genre !== "chung"
    ? `PHONG CÁCH DỊCH: Dịch theo phong cách phù hợp với thể loại '${genre}'.`
    : "";
  const narratorRule = `6. XƯNG HÔ "NHÂN VẬT TÔI": Nếu người nói là "Nhân vật tôi" (Người kể chuyện), hãy mặc định dịch đại từ nhân xưng là "tôi", trừ khi bối cảnh (ví dụ: nói chuyện với vua, cha mẹ) rõ ràng yêu cầu cách xưng hô khác (ví dụ: thần, con...).`
  const placeNameRule = `7. DỊCH ĐỊA DANH: Tuân thủ nghiêm ngặt các quy tắc dịch địa danh trong BỐI CẢNH ĐỊA DANH được cung cấp.`;

  // Choose prompt based on isSingleRetry
  let systemPrompt = "";
  if (isSingleRetry) {
    // Shorter prompt focusing only on the single line, character, and place context
    systemPrompt = `Bạn là chuyên gia dịch thuật phụ đề từ tiếng Trung sang tiếng Việt.
NHIỆM VỤ CỰC KỲ QUAN TRỌNG: Chỉ dịch DUY NHẤT dòng được cung cấp dưới dạng '1:: nội dung'. Giữ nguyên định dạng '1:: nội dung đã dịch'.

${characterContext}

${placeNameContext || "Chưa phân tích địa danh."}

QUY TẮC TUYỆT ĐỐI:
1. GIỮ NGUYÊN CẤU TRÚC SỐ '1::'.
2. KHÔNG BÌNH LUẬN.
3. TUÂN THỦ "QUY TẮC DỊCH TÊN/XƯNG HÔ CHÍNH" và "BỐI CẢNH ĐỊA DANH" ở trên.
4. ${genreInstruction}
${narratorRule}
${placeNameRule}`;
  } else {
    // Full prompt for batch translation
    systemPrompt = `Bạn là chuyên gia dịch thuật phụ đề từ tiếng Trung sang tiếng Việt. Nhiệm vụ của bạn là dịch với độ chính xác và nhất quán cao nhất dựa trên các bối cảnh được cung cấp.

BỐI CẢNH CỐT TRUYỆN (để hiểu rõ hơn về mạch truyện, chỉ dùng để tham khảo, không được lấy nội dung từ đây để dịch):
${plotAnalysisContext || "Không có."}

${characterContext}

${placeNameContext || "Chưa phân tích địa danh."}

BỐI CẢNH MỐI QUAN HỆ VÀ XƯNG HÔ (Tham khảo kỹ để dịch xưng hô cho đúng):
${relationshipContext || "Chưa phân tích."}

${previousContext}

QUY TẮC TUYỆT ĐỐI:
1. GIỮ NGUYÊN CẤU TRÚC SỐ: Đầu vào có dạng 'số:: nội dung' và phân tách bằng '---'. Đầu ra BẮT BUỘC phải giữ nguyên format 'số:: nội dung đã dịch' và dấu '---'.
2. KHÔNG BÌNH LUẬN: Chỉ trả về nội dung dịch.
3. TUÂN THỦ "QUY TẮC DỊCH TÊN/XƯNG HÔ CHÍNH" ở trên.
4. CHỦ ĐỘNG SỬ DỤNG Giới tính, Tuổi (từ Bối cảnh nhân vật) và Bối cảnh mối quan hệ để quyết định cách xưng hô (anh, em, chị, ông, bà...) cho phù hợp văn hóa Việt Nam.
5. ${genreInstruction}
${narratorRule}
${placeNameRule}`;
  }


  const payload = {
    contents: [{ parts: [{ text: text }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.3, topK: 1, topP: 1 },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  };
  let retries = 3,
    delay = 1000,
    response;
  while (retries > 0) {
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const result = await response.json();
        const candidate = result.candidates?.[0];
        // Log the raw response text for debugging
        // console.log("Raw API Response:", candidate?.content?.parts?.[0]?.text);

        if (candidate && candidate.content?.parts?.[0]?.text)
          return candidate.content.parts[0].text;

        // Check for safety block specifically
        if (result.promptFeedback?.blockReason) {
            console.error("API call blocked due to safety settings:", result.promptFeedback);
             throw new Error(`Nội dung bị chặn: ${result.promptFeedback.blockReason}`);
         }
         // Check for other finish reasons like RECITATION, etc.
         if (candidate && candidate.finishReason && candidate.finishReason !== 'STOP') {
             console.error("API call finished with reason:", candidate.finishReason, candidate.finishMessage);
              throw new Error(`API dừng: ${candidate.finishReason}`);
          }
         // If no text and no specific block/finish reason, assume invalid structure
          console.error("Invalid API response structure:", result);
          throw new Error("Phản hồi API không hợp lệ hoặc trống.");

      }
      if (response.status === 429 || response.status === 503) {
           console.warn(`Rate limited (status ${response.status}), retrying...`);
            throw new Error("Rate limited"); // Let the retry logic handle this
       }
       // Handle other HTTP errors
        const errorText = await response.text();
        console.error(`HTTP Error ${response.status}:`, errorText);
        throw new Error(`Lỗi HTTP ${response.status}`);

    } catch (error) {
        console.error(`Attempt failed (${3 - retries + 1}/${MAX_ATTEMPTS}):`, error.message);
      if (
        error.message.includes("Rate limited") ||
        error.message.includes("Nội dung bị chặn") || // Keep retrying safety blocks? Maybe not. Let's throw immediately for safety.
         error.message.startsWith("Lỗi HTTP 5") // Retry on server errors
      ) {
        retries--;
        if (retries === 0) {
           console.error("Max retries reached.");
            throw error; // Throw the last error after retries fail
         }
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
      } else {
        // Don't retry for other errors (e.g., invalid format, other HTTP errors)
         throw error;
      }
    }
  }
   // Should ideally not be reached if errors are thrown correctly
  throw new Error("Không thể dịch sau nhiều lần thử.");
}


// --- Download Logic ---
function downloadSRT() {
  translatedSrtContent = buildSRT(translatedParsedSubs);
  if (!translatedSrtContent) return;
  const blob = new Blob([translatedSrtContent], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${originalFileName}_vi.srt`;
  a.click();
  URL.revokeObjectURL(url);
}