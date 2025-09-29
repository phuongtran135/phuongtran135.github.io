window.onload = () => {
  // Lấy các phần tử DOM
  const manageApiKeysBtn = document.getElementById("manageApiKeysBtn");
  const apiKeyModal = document.getElementById("apiKeyModal");
  const apiKeySaveBtn = document.getElementById("apiKeySaveBtn");
  const apiKeyCancelBtn = document.getElementById("apiKeyCancelBtn");
  const geminiApiKeyInput = document.getElementById("geminiApiKey");
  const apiKeyCount = document.getElementById("apiKeyCount");
  const docFileInput = document.getElementById("docFile");
  const fileNameSpan = document.getElementById("fileName");
  const languageSelect = document.getElementById("language");
  const customPromptToggle = document.getElementById("customPromptToggle");
  const customPrompt = document.getElementById("customPrompt");
  const customPromptContainer = document.getElementById(
    "custom-prompt-container"
  );
  const translateBtn = document.getElementById("translateBtn");
  const statusDiv = document.getElementById("status");
  const resultArea = document.getElementById("resultArea");
  const translatedOutput = document.getElementById("translatedOutput");
  const copyBtn = document.getElementById("copyBtn");
  const uploadIcon = document.getElementById("uploadIcon");
  const clearFileBtn = document.getElementById("clearFileBtn");
  const qualityCheckBtn = document.getElementById("qualityCheckBtn");
  const qualityCheckResultArea = document.getElementById(
    "qualityCheckResultArea"
  );
  const qualityCheckOutput = document.getElementById("qualityCheckOutput");
  const regenerateBtn = document.getElementById("regenerateBtn");
  const historyArea = document.getElementById("historyArea");
  const storyHistoryTab = document.getElementById("storyHistoryTab");
  const subtitleHistoryTab = document.getElementById("subtitleHistoryTab");
  const storyHistoryList = document.getElementById("storyHistoryList");
  const subtitleHistoryList = document.getElementById("subtitleHistoryList");
  const titleSuggestionBtn = document.getElementById("titleSuggestionBtn");
  const titleSuggestionArea = document.getElementById("titleSuggestionArea");
  const titleSuggestionOutput = document.getElementById(
    "titleSuggestionOutput"
  );
  const suggestAgainBtn = document.getElementById("suggestAgainBtn");
  const confirmationModal = document.getElementById("confirmationModal");
  const modalMessage = document.getElementById("modalMessage");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const renameModal = document.getElementById("renameModal");
  const renameInput = document.getElementById("renameInput");
  const renameSaveBtn = document.getElementById("renameSaveBtn");
  const renameCancelBtn = document.getElementById("renameCancelBtn");
  const clearStoryHistoryBtn = document.getElementById("clearStoryHistoryBtn");
  const clearSubtitleHistoryBtn = document.getElementById(
    "clearSubtitleHistoryBtn"
  );
  const uploadTab = document.getElementById("uploadTab");
  const pasteTab = document.getElementById("pasteTab");
  const uploadPanel = document.getElementById("uploadPanel");
  const pastePanel = document.getElementById("pastePanel");
  const pasteInput = document.getElementById("pasteInput");
  const addCommentBtn = document.getElementById("addCommentBtn");
  const commentModal = document.getElementById("commentModal");
  const commentHtmlInput = document.getElementById("commentHtmlInput");
  const processCommentBtn = document.getElementById("processCommentBtn");
  const commentCancelBtn = document.getElementById("commentCancelBtn");
  const commentSection = document.getElementById("commentSection");
  const formattedCommentsOutput = document.getElementById(
    "formattedCommentsOutput"
  );
  const commentActions = document.getElementById("commentActions");
  const translateAllCommentsGoogleBtn = document.getElementById(
    "translateAllCommentsGoogleBtn"
  );
  const translateAllCommentsAIBtn = document.getElementById(
    "translateAllCommentsAIBtn"
  );
  const toggleCommentsBtn = document.getElementById("toggleCommentsBtn");

  // Get new DOM elements for evaluation feature
  const evaluateBtn = document.getElementById("evaluateBtn");
  const evaluationResultArea = document.getElementById("evaluationResultArea");
  const evaluationOutput = document.getElementById("evaluationOutput");
  const toggleEvaluationBtn = document.getElementById("toggleEvaluationBtn");

  // Get new DOM elements for multi-threading
  const detailedStatusContainer = document.getElementById(
    "detailedStatusContainer"
  );
  const retryContainer = document.getElementById("retryContainer");
  const retryTranslationBtn = document.getElementById("retryTranslationBtn");
  const threadWarning = document.getElementById("threadWarning");

  // Get new DOM elements for character count
  const characterCountContainer = document.getElementById(
    "characterCountContainer"
  );
  const totalCharCount = document.getElementById("totalCharCount");

  // ADDED: Get DOM element for timer
  const timerDisplay = document.getElementById("timerDisplay");

  let apiKeys = [];
  let originalContent = "";
  let translatedContent = "";
  let analysisContent = "";
  let currentFileType = null;
  let parsedSrt = [];
  let isFirstTranslationDone = false;
  let activeConfirmCallback = null;
  let activeRenameCallback = null;
  let inputMethod = "file"; // 'file' or 'paste'

  // ADDED: Timer variables
  let timerInterval = null;
  let startTime = 0;

  // --- Prompt Templates ---

  const storyPromptTemplate = `You are an expert literary translator. Your primary goal is to translate the following text into {language}.

Adhere to these critical rules for the highest quality translation:
1.  **Plot and Cohesion**: Maintain a clear, logical, and interconnected storyline.
2.  **Character Name and Proper Noun Transliteration**: All character names and proper nouns must be transliterated into the target language's phonetic system (e.g., into Vietnamese for a Vietnamese translation). These transliterated names must be used consistently throughout the entire text.
3.  **Accurate Meaning**: Translate the original meaning and context accurately and faithfully.
4.  **No Content Alteration**: Do not add or omit any content from the original text. Preserve all paragraph breaks and original formatting.
5.  **Completeness**: Ensure every single word and sentence from the original text is translated. Do not leave out any part of the content.
6.  **No Untranslated Words**: Do not leave any words from the original source language in the final translation. All terms, including keywords, must be fully translated or adapted into the target language.
7.  **Contextual Pronoun Identification**: Be highly sensitive to the narrative perspective (e.g., first-person). Characters used as pronouns in specific contexts, such as the Chinese character '上' often meaning 'I' (the narrator) in online stories, must be translated based on this context, not literally transliterated as a name.
8.  **Contextual and Cultural Nuance**: Differentiate between proper nouns and common terms. If a word seems illogical in context (e.g., '国 303'), infer the most logical meaning (e.g., 'Room 303') rather than translating literally. A term like '万发钥匙' should be understood contextually as a 'master key' or 'universal key' (chìa khóa vạn năng), not a branded name. Prioritize natural, fluent translation over rigid, literal equivalents.
9.  **Consistent Character Roles and Gender**: From the beginning of the story, identify the main characters, their gender, and their relationships (e.g., older brother, younger sister). You MUST maintain this consistency throughout the entire translation. Do not switch a character's gender or their familial role.

Provide only the translated text as your output, without any additional comments or summaries.

Here is the text to translate:

---
{text}
---`;

  const srtPromptTemplate = `You are an expert subtitle translator. Your task is to translate the following subtitle entries into {language}.
- The entries are separated by a unique delimiter: \`[<->]\`.
- You MUST preserve this delimiter in your output.
- The number of entries in your output MUST exactly match the number of entries in the input.
- Translate the meaning accurately for a viewing audience.
- Keep the translation concise and natural-sounding.
- **Crucially, you must translate the ENTIRE content of each entry. Do not leave any words or phrases from the original language untranslated. Your job is to provide a complete and polished translation for every line.**

Here is the subtitle text to translate:
---
{text}
---
`;

  const qualityCheckPromptTemplate = `You are a professional editor reviewing a translated story. The text has been translated from an original text into {language}.

Please perform the following tasks based on the texts provided below. **IMPORTANT: Your entire analysis and response MUST be in {language}.**

1.  **Summarize the Plot**: Briefly summarize the main plot of the translated text in 2-3 sentences to confirm the story's logic and coherence.
2.  **Identify Potential Issues**: Carefully review the translated text and point out any specific sentences or phrases that seem illogical, unnatural, or poorly translated. For each issue, provide a brief explanation and suggest a better alternative.
3.  **Check for Omissions**: Compare the translated text against the original text. Point out any specific words, phrases, or sentences that were missed or omitted during translation.
4.  If the translation is excellent and has no issues, state that clearly.

Format your response clearly using Markdown for headings and lists.

**Original Text:**
---
{original_text}
---

**Translated Text to Review:**
---
{translated_text}
---
`;
  const regenerationPromptTemplate = `You are a master literary translator tasked with refining a translation based on an editor's feedback.

**Original Text:**
---
{original_text}
---

**First Draft Translation (in {language}):**
---
{first_translation}
---

**Editor's Feedback and Suggestions (in {language}):**
---
{editor_feedback}
---

Your task is to produce a new, final version of the translation in {language}. You must incorporate the editor's suggestions to fix the identified issues while retaining the high-quality parts of the first draft. The final output should ONLY be the complete, refined translated text. Do not include any of your own commentary or headings.`;

  const titleSuggestionPromptTemplate = `You are a creative assistant specializing in titling stories. Based on the full story text provided below, which is written in {language}, please generate a list of 5-7 creative, compelling, and suitable titles for this story.

**Instructions:**
- The titles must be in {language}.
- The titles should reflect the main theme, plot, or mood of the story.
- Provide a variety of title styles (e.g., mysterious, romantic, action-oriented, metaphorical).
- Format the output as a simple numbered list.

**Story Text:**
---
{story_text}
---
`;

  const commentPromptTemplate = `You are an expert translator. Your task is to translate the following list of user comments into {language}.
- The comments are separated by a unique delimiter: \`[<->]\`.
- You MUST preserve this delimiter in your output.
- The number of comments in your output MUST exactly match the number of comments in the input.
- Translate the meaning naturally, keeping the tone of a casual user comment.

Here are the comments to translate:
---
{text}
---
`;
  // UPDATED: Prompt for a more casual, reader-focused evaluation
  const evaluationPromptTemplate = `Bạn là một cô gái trẻ (18-24 tuổi) rất thích đọc truyện, đặc biệt là các tiểu thuyết online như trên Zhihu. Bạn không phải là nhà phê bình, mà là một độc giả đang chia sẻ cảm nhận chân thật của mình sau khi đọc xong một câu chuyện. Toàn bộ bài đánh giá của bạn PHẢI bằng {language}.

**Hướng dẫn:**

1.  **Cảm nhận chung:** Bắt đầu bằng một vài câu nói về cảm nhận tổng thể của bạn. Ví dụ: "Wow, đọc xong truyện này mình thấy...", "Uhm, truyện này đọc giải trí cũng được...", v.v.
2.  **Điểm mình thích:** Kể ra những điều khiến bạn thích thú. Cốt truyện có gay cấn không? Có nhân vật nào 'chất' không? Tình tiết nào làm bạn bất ngờ?
3.  **Điểm mình hơi lấn cấn:** Góp ý một cách nhẹ nhàng về những điểm bạn thấy chưa ổn lắm. Có thể là một vài tình tiết hơi khó hiểu, hoặc nhân vật hành động hơi lạ.
4.  **Vậy có nên 'nhảy hố' không?:** Đưa ra lời khuyên cuối cùng cho những người đọc khác. Dựa trên cảm nhận của bạn, truyện này có đáng để mọi người bắt đầu đọc không?
5.  **Chấm điểm theo gu của mình:** Cho điểm trên thang 10, và nói rõ đây là điểm dựa trên sở thích cá nhân.
6.  **Hóng hớt comment:** Nếu có bình luận từ người dùng khác, hãy xem qua và cho biết bạn có đồng tình với họ không. Nếu không có, chỉ cần nói rằng bạn đang đánh giá dựa trên cảm nhận của riêng mình.
7.  **Định dạng:** Sử dụng Markdown để trình bày cho dễ đọc nhé!

**Nội dung truyện cần đánh giá:**
---
{story_text}
---

**Bình luận của người dùng (nếu có):**
---
{user_comments}
---
`;

  // --- Timer Functions ---
  function startTimer() {
    stopTimer(); // Clear any existing timer
    startTime = Date.now();
    timerDisplay.textContent = "Thời gian: 00:00.0";
    timerDisplay.classList.remove("hidden");
    timerInterval = setInterval(updateTimer, 100);
  }

  function updateTimer() {
    const elapsedTime = Date.now() - startTime;
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    const milliseconds = String(Math.floor((elapsedTime % 1000) / 100)).slice(
      0,
      1
    );
    timerDisplay.textContent = `Thời gian: ${minutes}:${seconds}.${milliseconds}`;
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // --- Utility Functions ---
  function extractTextFromHtml(htmlString) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");
      const contentSpan = doc.querySelector("span#content");
      if (contentSpan) {
        return contentSpan.innerText;
      }
      return doc.body.innerText;
    } catch (e) {
      console.error("Could not parse HTML, returning as plain text.", e);
      return htmlString;
    }
  }

  // --- Modal Functions ---
  function showConfirmation(message, onConfirm) {
    modalMessage.textContent = message;
    activeConfirmCallback = onConfirm;
    confirmationModal.classList.remove("hidden");
  }

  function hideConfirmation() {
    confirmationModal.classList.add("hidden");
    activeConfirmCallback = null;
  }

  function showRenameModal(currentName, onSave) {
    renameInput.value = currentName;
    activeRenameCallback = onSave;
    renameModal.classList.remove("hidden");
    renameInput.focus();
  }

  function hideRenameModal() {
    renameModal.classList.add("hidden");
    activeRenameCallback = null;
  }

  // --- Core App Logic ---
  function initializeApp() {
    renderHistory();
    loadApiKeysFromCache();
    customPrompt.placeholder = `Ví dụ: Dịch với văn phong hài hước, dí dỏm.`;
    Notification.requestPermission();
    addEventListeners();
    updateApiKeyUIAndChecks();
  }

  function addEventListeners() {
    manageApiKeysBtn.addEventListener("click", () => {
      geminiApiKeyInput.value = apiKeys.join("\n");
      apiKeyModal.classList.remove("hidden");
      geminiApiKeyInput.focus();
    });
    apiKeyCancelBtn.addEventListener("click", () => {
      apiKeyModal.classList.add("hidden");
    });
    apiKeySaveBtn.addEventListener("click", () => {
      const keysValue = geminiApiKeyInput.value.trim();
      localStorage.setItem("geminiApiKeys", keysValue);
      apiKeys = keysValue.split("\n").filter((k) => k.trim() !== "");
      updateApiKeyUIAndChecks();
      apiKeyModal.classList.add("hidden");
    });
    docFileInput.addEventListener("change", handleFileSelect);
    customPromptToggle.addEventListener("change", () => {
      customPrompt.classList.toggle("hidden", !customPromptToggle.checked);
    });
    clearFileBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      resetFileSelection();
    });
    translateBtn.addEventListener("click", handleTranslation);
    // Add event listener for evaluation button
    evaluateBtn.addEventListener("click", handleEvaluation);
    copyBtn.addEventListener("click", copyTranslatedText);
    qualityCheckBtn.addEventListener("click", handleQualityCheck);
    regenerateBtn.addEventListener("click", handleRegeneration);
    titleSuggestionBtn.addEventListener("click", handleTitleSuggestion);
    suggestAgainBtn.addEventListener("click", handleTitleSuggestion);
    storyHistoryTab.addEventListener("click", () => handleTabClick("story"));
    subtitleHistoryTab.addEventListener("click", () =>
      handleTabClick("subtitle")
    );
    storyHistoryList.addEventListener("click", handleHistoryClick);
    subtitleHistoryList.addEventListener("click", handleHistoryClick);
    clearStoryHistoryBtn.addEventListener("click", () =>
      clearHistoryForType("docx")
    );
    clearSubtitleHistoryBtn.addEventListener("click", () =>
      clearHistoryForType("srt")
    );
    uploadTab.addEventListener("click", () => switchInputMethod("file"));
    pasteTab.addEventListener("click", () => switchInputMethod("paste"));
    pasteInput.addEventListener("input", () => {
      const hasText = pasteInput.value.trim() !== "";
      if (hasText) {
        clearFileInput();
        addCommentBtn.classList.remove("hidden");
        evaluateBtn.classList.remove("hidden"); // Show button
      } else {
        addCommentBtn.classList.add("hidden");
        evaluateBtn.classList.add("hidden"); // Hide button
      }
      const currentContent = pasteInput.value;
      if (/<[a-z][\s\S]*>/i.test(currentContent)) {
        const extractedText = extractTextFromHtml(currentContent);
        if (pasteInput.value !== extractedText) {
          pasteInput.value = extractedText;
        }
      }
      updateCharacterCount(pasteInput.value);
      updateTranslateButtonState();
    });
    modalConfirmBtn.addEventListener("click", () => {
      if (activeConfirmCallback) activeConfirmCallback();
    });
    modalCancelBtn.addEventListener("click", hideConfirmation);
    renameSaveBtn.addEventListener("click", () => {
      if (activeRenameCallback) activeRenameCallback(renameInput.value);
    });
    renameCancelBtn.addEventListener("click", hideRenameModal);

    // Comment event listeners
    addCommentBtn.addEventListener("click", () => {
      commentModal.classList.remove("hidden");
      commentHtmlInput.focus();
    });
    commentCancelBtn.addEventListener("click", () => {
      commentModal.classList.add("hidden");
    });
    processCommentBtn.addEventListener("click", handleCommentProcessing);

    // Comment translation event listeners
    translateAllCommentsGoogleBtn.addEventListener("click", () =>
      translateAllComments("google")
    );
    translateAllCommentsAIBtn.addEventListener("click", () =>
      translateAllComments("ai")
    );
    formattedCommentsOutput.addEventListener(
      "click",
      handleSingleCommentTranslate
    );
    toggleCommentsBtn.addEventListener("click", toggleCommentVisibility);
    toggleEvaluationBtn.addEventListener("click", toggleEvaluationVisibility);
    retryTranslationBtn.addEventListener("click", handleTranslation);

    // Add listener for thread selection to show/hide warning
    document
      .getElementById("threadSelection")
      .addEventListener("change", updateApiKeyChecks);
  }

  function getApiKeys() {
    return apiKeys;
  }

  function updateApiKeyUIAndChecks() {
    apiKeyCount.textContent = apiKeys.length;
    updateApiKeyChecks();
  }

  function updateApiKeyChecks() {
    const keys = getApiKeys();
    const keyCount = keys.length;

    const threadRequirements = {
      2: 4,
      5: 10,
      "50p": 12,
    };

    for (const [thread, req] of Object.entries(threadRequirements)) {
      const radio = document.getElementById(`threadCount${thread}`);
      if (radio) {
        const isEnabled = keyCount >= req;
        radio.disabled = !isEnabled;
        radio.parentElement.title = isEnabled
          ? `Mở khóa với ${req} API keys`
          : `Yêu cầu tối thiểu ${req} API keys (hiện có ${keyCount})`;

        if (!isEnabled && radio.checked) {
          document.getElementById("threadCount1").checked = true;
        }
      }
    }

    // Handle 50% warning visibility
    const radio50p = document.getElementById("threadCount50p");
    if (radio50p && radio50p.checked && !radio50p.disabled) {
      const numThreads = Math.floor(keyCount / 2);
      threadWarning.innerHTML = `<strong>Cảnh báo 50% luồng:</strong> Chế độ này sẽ chạy <strong>${numThreads} luồng</strong>. 
        <br><strong>Lợi:</strong> Rất nhanh với truyện dài. 
        <br><strong>Hại:</strong> Có thể nhanh hết hạn mức API, dễ gây lỗi nếu API không ổn định.`;
      threadWarning.classList.remove("hidden");
    } else {
      threadWarning.classList.add("hidden");
    }

    updateTranslateButtonState();
  }

  function updateCharacterCount(text) {
    const count = text.length;
    if (count > 0) {
      totalCharCount.textContent = count.toLocaleString("vi-VN");
      characterCountContainer.classList.remove("hidden");
    } else {
      characterCountContainer.classList.add("hidden");
    }
  }

  function loadApiKeysFromCache() {
    const savedKeys = localStorage.getItem("geminiApiKeys");
    if (savedKeys) {
      apiKeys = savedKeys
        .trim()
        .split("\n")
        .filter((k) => k.trim() !== "");
    }
  }

  function clearFileInput() {
    docFileInput.value = "";
    fileNameSpan.textContent = "Kéo và thả hoặc nhấn để chọn file";
    fileNameSpan.classList.add("text-slate-500");
    fileNameSpan.classList.remove("text-slate-700", "font-medium");
    uploadIcon.classList.remove("hidden");
    clearFileBtn.classList.add("hidden");
    currentFileType = null;
  }

  function switchInputMethod(method) {
    inputMethod = method;
    const isFile = method === "file";

    uploadTab.classList.toggle("tab-active", isFile);
    uploadTab.classList.toggle("border-transparent", !isFile);
    uploadTab.classList.toggle("text-slate-400", !isFile);

    pasteTab.classList.toggle("tab-active", !isFile);
    pasteTab.classList.toggle("border-transparent", isFile);
    pasteTab.classList.toggle("text-slate-400", isFile);

    uploadPanel.classList.toggle("hidden", !isFile);
    pastePanel.classList.toggle("hidden", isFile);

    if (isFile) {
      pasteInput.value = "";
      if (docFileInput.files.length === 0) {
        addCommentBtn.classList.add("hidden");
        evaluateBtn.classList.add("hidden");
      }
    } else {
      clearFileInput();
      const hasText = pasteInput.value.trim() !== "";
      addCommentBtn.classList.toggle("hidden", !hasText);
      evaluateBtn.classList.toggle("hidden", !hasText);
    }
    updateCharacterCount(pasteInput.value);
    updateTranslateButtonState();
  }

  function updateTranslateButtonState() {
    const hasApiKeys = getApiKeys().length > 0;
    const hasFile = docFileInput.files.length > 0;
    const hasPastedText = pasteInput.value.trim() !== "";
    const isInputReady =
      (inputMethod === "file" && hasFile) ||
      (inputMethod === "paste" && hasPastedText);

    translateBtn.disabled = !(hasApiKeys && isInputReady);
    evaluateBtn.disabled = !(hasApiKeys && isInputReady);

    if (isFirstTranslationDone) {
      translateBtn.querySelector("span").textContent = "Dịch lại";
      translateBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");
      translateBtn.classList.add("bg-purple-600", "hover:bg-purple-700");
    } else {
      translateBtn.querySelector("span").textContent = "Bắt đầu dịch";
      translateBtn.classList.add("bg-blue-600", "hover:bg-blue-700");
      translateBtn.classList.remove("bg-purple-600", "hover:bg-purple-700");
    }
  }

  function toggleActionButtons(disabled) {
    translateBtn.disabled = disabled;
    qualityCheckBtn.disabled = disabled;
    regenerateBtn.disabled = disabled;
    titleSuggestionBtn.disabled = disabled;
    evaluateBtn.disabled = disabled;
  }

  async function showBrowserNotification(title, body) {
    if (!("Notification" in window)) return;
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission === "granted") {
      new Notification(title, {
        body,
        icon: "https://aistudio.google.com/favicon.ico",
      });
    }
  }

  async function handleFileSelect() {
    pasteInput.value = "";
    if (docFileInput.files.length > 0) {
      const file = docFileInput.files[0];
      fileNameSpan.textContent = file.name;
      uploadIcon.classList.add("hidden");
      clearFileBtn.classList.remove("hidden");

      let fileContent = "";
      if (file.name.toLowerCase().endsWith(".srt")) {
        currentFileType = "srt";
        fileContent = await file.text();
        qualityCheckBtn.classList.add("hidden");
        customPromptContainer.classList.add("hidden");
        titleSuggestionBtn.classList.add("hidden");
        addCommentBtn.classList.add("hidden");
        evaluateBtn.classList.add("hidden"); // Hide for SRT
      } else {
        currentFileType = "docx";
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        fileContent = result.value;
        addCommentBtn.classList.remove("hidden");
        evaluateBtn.classList.remove("hidden"); // Show for DOCX
        qualityCheckBtn.classList.remove("hidden");
        customPromptContainer.classList.remove("hidden");
        titleSuggestionBtn.classList.remove("hidden");
      }
      updateCharacterCount(fileContent);
    } else {
      resetFileSelection();
    }
    updateTranslateButtonState();
  }

  function showStatus(message, showSpinner = false) {
    let spinner = showSpinner ? '<div class="spinner"></div>' : "";
    statusDiv.innerHTML = `${spinner}<span>${message}</span>`;
  }

  function updateDetailedStatus(
    threadId,
    message,
    isError = false,
    charCount = null
  ) {
    let statusLine = document.getElementById(`status-thread-${threadId}`);
    if (!statusLine) {
      statusLine = document.createElement("div");
      statusLine.id = `status-thread-${threadId}`;
      statusLine.className = "text-sm p-2 rounded-md transition-colors";
      detailedStatusContainer.appendChild(statusLine);
    }

    let countHtml =
      charCount !== null
        ? ` <span class="text-xs text-slate-500">(${charCount.toLocaleString(
            "vi-VN"
          )} ký tự)</span>`
        : "";
    statusLine.innerHTML = `<span class="font-bold">Luồng ${threadId}:</span> ${message}${countHtml}`;

    if (isError) {
      statusLine.classList.remove("bg-slate-800", "text-green-400");
      statusLine.classList.add("bg-red-900/50", "text-red-400");
    } else if (message.includes("Hoàn thành")) {
      statusLine.classList.remove("bg-slate-800", "text-red-400");
      statusLine.classList.add("bg-green-900/50", "text-green-400");
    } else {
      statusLine.classList.remove(
        "bg-red-900/50",
        "text-red-400",
        "bg-green-900/50",
        "text-green-400"
      );
      statusLine.classList.add("bg-slate-800", "text-slate-300");
    }
  }

  async function executeWithFailover(apiFunction) {
    const keys = getApiKeys();
    if (keys.length === 0)
      throw new Error("Vui lòng nhập ít nhất một Gemini API Key.");
    let lastError = null;
    for (let i = 0; i < keys.length; i++) {
      try {
        return await apiFunction(keys[i], i + 1, keys.length);
      } catch (error) {
        console.error(`API key ${i + 1} thất bại:`, error);
        lastError = error;
      }
    }
    if (
      lastError &&
      (lastError.message.includes("API key not valid") ||
        lastError.message.includes("permission to access") ||
        lastError.message.includes("API key is invalid"))
    ) {
      throw new Error(
        `API key không hợp lệ. Vui lòng kiểm tra lại hoặc tạo key mới.`
      );
    } else if (lastError) {
      throw new Error(
        `Tất cả ${keys.length} API key đều thất bại. Lỗi cuối cùng: ${lastError.message}`
      );
    } else {
      throw new Error(`Đã xảy ra lỗi không xác định.`);
    }
  }

  function parseSrt(data) {
    const blocks = data.trim().replace(/\r/g, "").split("\n\n");
    return blocks
      .map((block) => {
        const lines = block.split("\n");
        if (lines.length < 2) return null;
        return {
          index: lines[0],
          timestamp: lines[1],
          text: lines.slice(2).join("\n"),
        };
      })
      .filter(Boolean);
  }

  function reconstructSrt(originalSubs, translatedTexts) {
    return originalSubs
      .map((sub, i) => {
        const translatedText = translatedTexts[i] || sub.text;
        return `${sub.index}\n${sub.timestamp}\n${translatedText.trim()}`;
      })
      .join("\n\n");
  }

  // --- History Functions ---
  function saveToHistory(type, fileName, content, original) {
    const key = `history_${type}`;
    let history = JSON.parse(sessionStorage.getItem(key)) || [];
    const newEntry = {
      name: fileName,
      content: content,
      original: original,
      date: new Date().toLocaleString("vi-VN"),
    };
    history.unshift(newEntry);
    history = history.slice(0, 10);
    sessionStorage.setItem(key, JSON.stringify(history));
    renderHistory();
  }

  function updateClearButtonsVisibility() {
    const isStoryTabActive = storyHistoryTab.classList.contains("tab-active");
    const storyHistory =
      JSON.parse(sessionStorage.getItem("history_docx")) || [];
    const subtitleHistory =
      JSON.parse(sessionStorage.getItem("history_srt")) || [];

    if (isStoryTabActive) {
      clearStoryHistoryBtn.classList.toggle(
        "hidden",
        storyHistory.length === 0
      );
      clearSubtitleHistoryBtn.classList.add("hidden");
    } else {
      clearSubtitleHistoryBtn.classList.toggle(
        "hidden",
        subtitleHistory.length === 0
      );
      clearStoryHistoryBtn.classList.add("hidden");
    }
  }

  function renderHistory() {
    const storyHistory =
      JSON.parse(sessionStorage.getItem("history_docx")) || [];
    const subtitleHistory =
      JSON.parse(sessionStorage.getItem("history_srt")) || [];
    if (storyHistory.length === 0 && subtitleHistory.length === 0) {
      historyArea.classList.add("hidden");
      return;
    }
    historyArea.classList.remove("hidden");
    const renderList = (list, element, type) => {
      element.innerHTML = "";
      if (list.length === 0) {
        element.innerHTML = `<p class="text-sm text-slate-500 px-2">Chưa có lịch sử.</p>`;
        return;
      }
      list.forEach((item, index) => {
        const div = document.createElement("div");
        div.className =
          "history-item p-2 rounded-md flex justify-between items-center group";
        div.innerHTML = `
            <div class="flex items-center cursor-pointer flex-grow min-w-0" data-action="load" data-index="${index}" data-type="${type}">
                <span class="text-sm font-medium text-slate-300 truncate pointer-events-none">${item.name}</span>
                <span class="text-xs text-slate-400 whitespace-nowrap ml-4 pointer-events-none">${item.date}</span>
            </div>
            <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button title="Đổi tên" class="p-1 text-slate-400 hover:text-white" data-action="rename" data-index="${index}" data-type="${type}"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg></button>
                <button title="Xóa" class="p-1 text-slate-400 hover:text-red-500" data-action="delete" data-index="${index}" data-type="${type}"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"></path></svg></button>
            </div>`;
        element.appendChild(div);
      });
    };
    renderList(storyHistory, storyHistoryList, "docx");
    renderList(subtitleHistory, subtitleHistoryList, "srt");
    updateClearButtonsVisibility();
  }

  function handleHistoryClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const index = parseInt(target.dataset.index, 10);
    const type = target.dataset.type;
    const history = JSON.parse(sessionStorage.getItem(`history_${type}`)) || [];
    const item = history[index];
    if (!item) return;

    if (action === "load") {
      translatedContent = item.content;
      originalContent = item.original;
      translatedOutput.textContent = translatedContent;
      resultArea.classList.remove("hidden");
      addCommentBtn.classList.remove("hidden");
      evaluateBtn.classList.remove("hidden");
      qualityCheckResultArea.classList.add("hidden");
      titleSuggestionArea.classList.add("hidden");
      commentSection.classList.add("hidden");
      evaluationResultArea.classList.add("hidden");
    } else if (action === "rename") {
      showRenameModal(item.name, (newName) => {
        renameHistoryItem(type, index, newName);
      });
    } else if (action === "delete") {
      deleteHistoryItem(type, index);
    }
  }

  function handleTabClick(tab) {
    const isStory = tab === "story";
    storyHistoryTab.classList.toggle("tab-active", isStory);
    subtitleHistoryTab.classList.toggle("tab-active", !isStory);
    storyHistoryList.classList.toggle("hidden", !isStory);
    subtitleHistoryList.classList.toggle("hidden", isStory);
    updateClearButtonsVisibility();
  }

  function deleteHistoryItem(type, index) {
    showConfirmation("Bạn có chắc chắn muốn xóa mục này?", () => {
      const key = `history_${type}`;
      let history = JSON.parse(sessionStorage.getItem(key)) || [];
      history.splice(index, 1);
      sessionStorage.setItem(key, JSON.stringify(history));
      renderHistory();
      hideConfirmation();
    });
  }

  function renameHistoryItem(type, index, newName) {
    if (!newName || !newName.trim()) return;
    const key = `history_${type}`;
    let history = JSON.parse(sessionStorage.getItem(key)) || [];
    if (history[index]) {
      history[index].name = newName.trim();
      sessionStorage.setItem(key, JSON.stringify(history));
      renderHistory();
    }
    hideRenameModal();
  }

  function clearHistoryForType(type) {
    const typeName = type === "docx" ? "truyện" : "phụ đề";
    const key = `history_${type}`;
    if ((JSON.parse(sessionStorage.getItem(key)) || []).length === 0) return;
    showConfirmation(
      `Bạn có chắc muốn xóa toàn bộ lịch sử ${typeName}?`,
      () => {
        sessionStorage.removeItem(key);
        renderHistory();
        hideConfirmation();
      }
    );
  }

  // --- Comment Processing and Translation ---

  function toggleCommentVisibility() {
    const icon = toggleCommentsBtn.querySelector("i");
    const isHidden = formattedCommentsOutput.classList.toggle("hidden");

    if (isHidden) {
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  }

  function toggleEvaluationVisibility() {
    const icon = toggleEvaluationBtn.querySelector("i");
    const isHidden = evaluationOutput.classList.toggle("hidden");

    if (isHidden) {
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  }

  function handleCommentProcessing() {
    const htmlString = commentHtmlInput.value;
    if (!htmlString.trim()) {
      alert("Vui lòng dán nội dung HTML.");
      return;
    }

    commentModal.classList.add("hidden");
    commentSection.classList.remove("hidden");
    formattedCommentsOutput.innerHTML = ""; // Clear old results

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");
      const commentBlocks = doc.querySelectorAll("div[data-id]");
      let commentIndex = 0;

      commentBlocks.forEach((block) => {
        const authorNode = block.querySelector("a.css-10u695f");
        const commentNode = block.querySelector(".CommentContent");

        if (authorNode && commentNode) {
          const authorName = authorNode.innerText.trim();
          const commentText = commentNode.innerText.trim();

          if (authorName && commentText) {
            const commentDiv = document.createElement("div");
            commentDiv.className =
              "comment-item flex justify-between items-start gap-x-2";
            commentDiv.dataset.commentId = commentIndex;

            commentDiv.innerHTML = `
              <div>
                  <span class="font-bold text-teal-400">${authorName}: </span>
                  <span class="comment-text text-slate-300" data-original-text="${encodeURIComponent(
                    commentText
                  )}">${commentText}</span>
              </div>
              <div class="flex items-center gap-x-1 flex-shrink-0">
                  <button title="Dịch nhanh" class="comment-translate-btn" data-type="google" data-comment-id="${commentIndex}"><i class="fa-brands fa-google text-green-500 hover:text-green-400"></i></button>
                  <button title="Dịch AI" class="comment-translate-btn" data-type="ai" data-comment-id="${commentIndex}"><i class="fa-solid fa-wand-magic-sparkles text-indigo-500 hover:text-indigo-400"></i></button>
              </div>`;

            formattedCommentsOutput.appendChild(commentDiv);
            commentIndex++;
          }
        }
      });

      if (formattedCommentsOutput.children.length > 0) {
        commentActions.classList.remove("hidden");
        commentActions.classList.add("flex");
        // Reset toggle state
        formattedCommentsOutput.classList.remove("hidden");
        toggleCommentsBtn.querySelector("i").classList.add("fa-eye");
        toggleCommentsBtn.querySelector("i").classList.remove("fa-eye-slash");
      } else {
        commentActions.classList.add("hidden");
        formattedCommentsOutput.innerHTML = `<p class="text-slate-500 p-2">Không tìm thấy comment nào có định dạng phù hợp (ví dụ: comment từ Zhihu).</p>`;
      }
    } catch (e) {
      console.error("Lỗi khi xử lý HTML:", e);
      commentActions.classList.add("hidden");
      formattedCommentsOutput.innerHTML = `<p class="text-red-500 p-2">Đã xảy ra lỗi khi xử lý HTML. Vui lòng kiểm tra lại nội dung đã dán.</p>`;
    }
  }

  async function translateAllComments(method) {
    const commentElements =
      formattedCommentsOutput.querySelectorAll(".comment-text");
    if (commentElements.length === 0) return;

    translateAllCommentsGoogleBtn.disabled = true;
    translateAllCommentsAIBtn.disabled = true;
    showStatus(
      `Đang dịch toàn bộ comment bằng ${method.toUpperCase()}...`,
      true
    );

    const originalTexts = Array.from(commentElements).map((el) =>
      decodeURIComponent(el.dataset.originalText)
    );

    try {
      let translatedTexts = [];
      if (method === "google") {
        translatedTexts = await Promise.all(
          originalTexts.map(translateTextGoogle)
        );
      } else {
        translatedTexts = await translateTextAI(
          originalTexts.join("\n[<->]\n"),
          commentPromptTemplate
        ).then((res) => res.split("[<->]").map((t) => t.trim()));
      }

      if (originalTexts.length !== translatedTexts.length) {
        throw new Error("Số lượng comment trả về không khớp.");
      }

      commentElements.forEach((el, index) => {
        el.textContent = translatedTexts[index] || originalTexts[index];
      });
      showStatus("Dịch toàn bộ comment hoàn tất!", false);
    } catch (error) {
      console.error("Lỗi dịch toàn bộ comment:", error);
      showStatus(`Lỗi dịch: ${error.message}`, false);
    } finally {
      translateAllCommentsGoogleBtn.disabled = false;
      translateAllCommentsAIBtn.disabled = false;
    }
  }

  async function handleSingleCommentTranslate(event) {
    const button = event.target.closest(".comment-translate-btn");
    if (!button) return;

    const { type, commentId } = button.dataset;
    const commentTextElement = formattedCommentsOutput.querySelector(
      `[data-comment-id='${commentId}'] .comment-text`
    );
    const originalText = decodeURIComponent(
      commentTextElement.dataset.originalText
    );

    const originalIcon = button.innerHTML;
    button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
    button.disabled = true;

    try {
      let translatedText = "";
      if (type === "google") {
        translatedText = await translateTextGoogle(originalText);
      } else {
        translatedText = await translateTextAI(
          originalText,
          commentPromptTemplate.replace(
            "The comments are separated by a unique delimiter: `[<->]`.",
            ""
          )
        );
      }
      commentTextElement.textContent = translatedText;
    } catch (error) {
      console.error(`Lỗi dịch comment #${commentId}:`, error);
      commentTextElement.textContent = `Lỗi dịch: ${error.message}`;
    } finally {
      button.innerHTML = originalIcon;
      button.disabled = false;
    }
  }

  async function translateTextGoogle(text) {
    if (!text) return "";
    const targetLanguage = languageSelect.value.split(" ")[0].toLowerCase();
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage.substring(
      0,
      2
    )}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Lỗi Google Translate API: ${response.statusText}`);
    }
    const data = await response.json();
    return data[0].map((item) => item[0]).join("");
  }

  async function translateTextAI(
    text,
    promptTemplate,
    statusCallback = showStatus
  ) {
    const aiFunction = async (apiKey, currentKeyIndex, totalKeys) => {
      statusCallback(
        `Đang xử lý với AI (key ${currentKeyIndex}/${totalKeys})...`,
        true
      );
      const targetLanguage = languageSelect.value;
      const model = "gemini-2.5-flash-preview-05-20";
      const prompt = promptTemplate
        .replace("{text}", text)
        .replace(/{language}/g, targetLanguage);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Lỗi API: ${errorData.error?.message || response.statusText}`
        );
      }
      const data = await response.json();
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text)
        throw new Error("Phản hồi từ API không hợp lệ.");
      return data.candidates[0].content.parts[0].text;
    };
    return executeWithFailover(aiFunction);
  }

  // --- Main Action Flows ---

  function splitText(text, numParts) {
    if (numParts <= 1) return [text];
    const parts = new Array(numParts).fill("");
    const lines = text.split("\n");
    const totalLines = lines.length;

    lines.forEach((line, index) => {
      const partIndex = Math.min(
        Math.floor((index / totalLines) * numParts),
        numParts - 1
      );
      parts[partIndex] += line + "\n";
    });

    return parts.map((p) => p.trim());
  }

  async function translatePart(
    text,
    keys,
    threadId,
    promptTemplate,
    charCount
  ) {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      try {
        updateDetailedStatus(
          threadId,
          `Đang dịch với key #${i + 1}...`,
          false,
          charCount
        );
        const response = await translateTextAI(
          text,
          promptTemplate,
          (msg, spinner) => {
            updateDetailedStatus(threadId, msg, false, charCount);
          }
        );
        updateDetailedStatus(threadId, `Hoàn thành!`, false, charCount);
        return response;
      } catch (error) {
        console.error(`Lỗi luồng ${threadId} với key ${i + 1}:`, error);
        updateDetailedStatus(
          threadId,
          `Lỗi với key #${i + 1}. Đang thử lại...`,
          true,
          charCount
        );
      }
    }
    throw new Error(`Tất cả API keys đều thất bại cho luồng ${threadId}.`);
  }

  async function evaluatePart(
    text,
    keys,
    threadId,
    promptTemplate,
    charCount,
    commentsText
  ) {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      try {
        updateDetailedStatus(
          threadId,
          `Đang đánh giá với key #${i + 1}...`,
          false,
          charCount
        );
        const response = await translateTextAI(
          "", // text is unused as it's in the template
          promptTemplate
            .replace("{story_text}", text)
            .replace("{user_comments}", commentsText),
          (msg, spinner) => {
            updateDetailedStatus(threadId, msg, false, charCount);
          }
        );
        updateDetailedStatus(threadId, `Hoàn thành!`, false, charCount);
        return response;
      } catch (error) {
        console.error(
          `Lỗi luồng đánh giá ${threadId} với key ${i + 1}:`,
          error
        );
        updateDetailedStatus(
          threadId,
          `Lỗi với key #${i + 1}. Đang thử lại...`,
          true,
          charCount
        );
      }
    }
    throw new Error(
      `Tất cả API keys đều thất bại cho luồng đánh giá ${threadId}.`
    );
  }
  function startCountdown(seconds, threadId, charCount) {
    return new Promise((resolve) => {
      let count = seconds;
      const update = () =>
        updateDetailedStatus(
          threadId,
          `Sẽ bắt đầu sau <strong>${count}</strong> giây...`,
          false,
          charCount
        );
      update();
      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          update();
        } else {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });
  }

  async function handleMultiThreadTranslation(threadCountValue) {
    const keys = getApiKeys();
    let numThreads = 0;

    if (threadCountValue === "50p") {
      numThreads = Math.floor(keys.length / 2);
    } else {
      numThreads = parseInt(threadCountValue, 10);
    }

    if (keys.length < numThreads) {
      showStatus(
        `Không đủ API keys cho ${numThreads} luồng. Cần ít nhất ${numThreads} key chính.`,
        false
      );
      return;
    }

    detailedStatusContainer.classList.remove("hidden");
    detailedStatusContainer.innerHTML = "";
    retryContainer.classList.add("hidden");

    const parts = splitText(originalContent, numThreads);
    const promises = [];
    const results = new Array(numThreads);

    for (let i = 0; i < numThreads; i++) {
      const part = parts[i];
      if (!part) continue;

      if (i > 0) {
        // This is the sequential delay. The FOR loop will pause here.
        await startCountdown(10, i + 1, part.length);
      }

      const keysForThread = [keys[i], ...keys.slice(numThreads)];

      // Dispatch the translation task. Don't await it here.
      // It runs in the background. We just store the promise.
      const taskPromise = translatePart(
        part,
        keysForThread,
        i + 1,
        storyPromptTemplate,
        part.length
      ).then((result) => {
        results[i] = result;
      });

      promises.push(taskPromise);
    }

    try {
      await Promise.all(promises); // Now we wait for all dispatched tasks to complete.
      translatedContent = results.join("\n\n");
      detailedStatusContainer.classList.add("hidden");
    } catch (error) {
      console.error("Lỗi dịch đa luồng:", error);
      showStatus(`Dịch đa luồng thất bại: ${error.message}`, false);
      retryContainer.classList.remove("hidden");
      throw error;
    }
  }

  async function handleMultiThreadEvaluation(
    threadCountValue,
    contentToEvaluate,
    commentsText
  ) {
    const keys = getApiKeys();
    let numThreads = 0;

    if (threadCountValue === "50p") {
      numThreads = Math.floor(keys.length / 2);
    } else {
      numThreads = parseInt(threadCountValue, 10);
    }

    if (keys.length < numThreads) {
      showStatus(
        `Không đủ API keys cho ${numThreads} luồng. Cần ít nhất ${numThreads} key chính.`,
        false
      );
      return;
    }

    detailedStatusContainer.classList.remove("hidden");
    detailedStatusContainer.innerHTML =
      '<h3 class="text-lg font-semibold text-center mb-2 text-slate-300">Trạng thái các luồng đánh giá</h3>';
    retryContainer.classList.add("hidden");

    const parts = splitText(contentToEvaluate, numThreads);
    const promises = [];
    const results = new Array(numThreads);

    for (let i = 0; i < numThreads; i++) {
      const part = parts[i];
      if (!part) continue;

      if (i > 0) {
        await startCountdown(10, i + 1, part.length);
      }

      const keysForThread = [keys[i], ...keys.slice(numThreads)];

      const taskPromise = evaluatePart(
        part,
        keysForThread,
        i + 1,
        evaluationPromptTemplate,
        part.length,
        commentsText
      ).then((result) => {
        results[i] = `--- ĐÁNH GIÁ PHẦN ${
          i + 1
        }/${numThreads} ---\n\n${result}`;
      });

      promises.push(taskPromise);
    }

    try {
      await Promise.all(promises);
      detailedStatusContainer.classList.add("hidden");
      return results.join("\n\n");
    } catch (error) {
      console.error("Lỗi đánh giá đa luồng:", error);
      showStatus(`Đánh giá đa luồng thất bại: ${error.message}`, false);
      retryContainer.classList.remove("hidden");
      throw error;
    }
  }

  async function handleTranslation() {
    toggleActionButtons(true);
    resultArea.classList.add("hidden");
    qualityCheckResultArea.classList.add("hidden");
    titleSuggestionArea.classList.add("hidden");
    translatedOutput.textContent = "";
    translatedContent = "";
    showStatus("Đang xử lý đầu vào...", true);
    startTimer(); // Start the timer

    try {
      let fileName = "Văn bản đã dán";
      if (inputMethod === "file") {
        const file = docFileInput.files[0];
        if (!file) throw new Error("Vui lòng chọn một file để dịch.");
        fileName = file.name;
        showStatus("Đang đọc file...", true);
        if (currentFileType === "srt") {
          originalContent = await file.text();
        } else {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          originalContent = result.value;
        }
      } else {
        originalContent = pasteInput.value;
        currentFileType = "docx"; // Assume paste is always story content
      }
      if (!originalContent.trim())
        throw new Error("Không có nội dung để dịch.");

      const threadCountValue = document.querySelector(
        'input[name="threadCount"]:checked'
      ).value;

      if (currentFileType === "srt" || threadCountValue === "1") {
        detailedStatusContainer.classList.remove("hidden");
        detailedStatusContainer.innerHTML = ""; // Clear it
        updateDetailedStatus(
          1,
          "Bắt đầu dịch...",
          false,
          originalContent.length
        );
        if (currentFileType === "srt") {
          const parsedSrt = parseSrt(originalContent);
          const textToTranslate = parsedSrt
            .map((sub) => sub.text)
            .join("\n[<->]\n");
          const rawTranslation = await translateTextAI(
            textToTranslate,
            srtPromptTemplate
          );
          const translatedLines = rawTranslation
            .split("[<->]")
            .map((line) => line.trim());
          translatedContent = reconstructSrt(parsedSrt, translatedLines);
        } else {
          translatedContent = await translateTextAI(
            originalContent,
            storyPromptTemplate
          );
        }
        updateDetailedStatus(1, "Hoàn thành!", false, originalContent.length);
        setTimeout(() => detailedStatusContainer.classList.add("hidden"), 2000);
      } else {
        // Multi-thread for DOCX only
        await handleMultiThreadTranslation(threadCountValue);
      }

      showStatus("Dịch hoàn tất!", false);
      showBrowserNotification(
        "Dịch hoàn tất!",
        "Bản dịch của bạn đã sẵn sàng để xem lại."
      );
      translatedOutput.textContent = translatedContent;
      resultArea.classList.remove("hidden");
      isFirstTranslationDone = true;
      saveToHistory(
        currentFileType,
        fileName,
        translatedContent,
        originalContent
      );
    } catch (error) {
      console.error("Lỗi trong quá trình dịch:", error);
      showStatus(`Đã xảy ra lỗi: ${error.message}`, false);
      if (
        document.querySelector('input[name="threadCount"]:checked').value !==
        "1"
      ) {
        retryContainer.classList.remove("hidden");
      }
    } finally {
      stopTimer(); // Stop the timer
      toggleActionButtons(false);
      updateTranslateButtonState();
    }
  }

  async function handleQualityCheck() {
    if (!translatedContent) return;
    toggleActionButtons(true);
    qualityCheckOutput.textContent = "";
    showStatus("Đang phân tích chất lượng bản dịch...", true);
    try {
      analysisContent = await translateTextAI(
        "", // text is unused as it's in the template
        qualityCheckPromptTemplate
          .replace("{original_text}", originalContent)
          .replace("{translated_text}", translatedContent)
      );
      qualityCheckOutput.textContent = analysisContent;
      qualityCheckResultArea.classList.remove("hidden");
      titleSuggestionArea.classList.add("hidden");
      showStatus("Phân tích hoàn tất!", false);
      showBrowserNotification(
        "Phân tích hoàn tất!",
        "Kết quả phân tích chất lượng đã có."
      );
    } catch (error) {
      console.error("Lỗi khi phân tích chất lượng:", error);
      showStatus(`Lỗi phân tích: ${error.message}`, false);
    } finally {
      toggleActionButtons(false);
    }
  }

  async function handleTitleSuggestion() {
    if (!translatedContent) return;
    toggleActionButtons(true);
    titleSuggestionOutput.textContent = "";
    showStatus("Đang nghĩ tên truyện hay...", true);
    suggestAgainBtn.disabled = true;
    try {
      const titles = await translateTextAI(
        "", // text is unused as it's in the template
        titleSuggestionPromptTemplate.replace(
          "{story_text}",
          translatedContent.substring(0, 8000)
        )
      );
      titleSuggestionOutput.textContent = titles;
      titleSuggestionArea.classList.remove("hidden");
      qualityCheckResultArea.classList.add("hidden");
      showStatus("Đã có gợi ý tên truyện!", false);
      showBrowserNotification(
        "Đã có gợi ý!",
        "Danh sách tên truyện đã được tạo."
      );
    } catch (error) {
      console.error("Lỗi khi gợi ý tên truyện:", error);
      showStatus(`Lỗi gợi ý: ${error.message}`, false);
    } finally {
      toggleActionButtons(false);
      suggestAgainBtn.disabled = false;
    }
  }

  // Publication Evaluation Handler
  async function handleEvaluation() {
    let contentToEvaluate = "";
    showStatus("Đang chuẩn bị nội dung...", true);

    try {
      if (inputMethod === "file" && docFileInput.files[0]) {
        const file = docFileInput.files[0];
        if (file.name.toLowerCase().endsWith(".docx")) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          contentToEvaluate = result.value;
        }
      } else if (inputMethod === "paste" && pasteInput.value.trim() !== "") {
        contentToEvaluate = pasteInput.value.trim();
      }

      if (!contentToEvaluate.trim()) {
        showStatus("Không có nội dung truyện để đánh giá.", false);
        return;
      }

      let commentsText = "Không có bình luận nào được cung cấp.";
      const commentElements =
        formattedCommentsOutput.querySelectorAll(".comment-item");
      if (commentElements.length > 0) {
        commentsText = Array.from(commentElements)
          .map((el) => {
            const author = el.querySelector(".font-bold").innerText || "";
            const comment = el.querySelector(".comment-text").innerText || "";
            return `${author.replace(":", "")}: ${comment}`;
          })
          .join("\n");
      }

      toggleActionButtons(true);
      evaluationOutput.textContent = "";
      resultArea.classList.add("hidden"); // Hide other main results
      showStatus("AI đang đọc và đánh giá truyện...", true);

      const threadCountValue = document.querySelector(
        'input[name="threadCount"]:checked'
      ).value;
      let evaluationResult = "";

      if (threadCountValue === "1") {
        // Single-thread evaluation
        evaluationResult = await translateTextAI(
          "", // text is unused
          evaluationPromptTemplate
            .replace("{story_text}", contentToEvaluate)
            .replace("{user_comments}", commentsText)
        );
      } else {
        // Multi-thread evaluation
        evaluationResult = await handleMultiThreadEvaluation(
          threadCountValue,
          contentToEvaluate,
          commentsText
        );
      }

      evaluationOutput.textContent = evaluationResult;
      evaluationResultArea.classList.remove("hidden");
      // Ensure output is visible and icon is correct
      evaluationOutput.classList.remove("hidden");
      toggleEvaluationBtn.querySelector("i").classList.add("fa-eye");
      toggleEvaluationBtn.querySelector("i").classList.remove("fa-eye-slash");

      showStatus("Đánh giá hoàn tất!", false);
      showBrowserNotification(
        "Đánh giá hoàn tất!",
        "Kết quả đánh giá truyện đã có."
      );
    } catch (error) {
      console.error("Lỗi khi đánh giá:", error);
      showStatus(`Lỗi đánh giá: ${error.message}`, false);
    } finally {
      toggleActionButtons(false);
    }
  }

  async function handleRegeneration() {
    if (!originalContent || !translatedContent || !analysisContent) return;
    toggleActionButtons(true);
    showStatus("Đang áp dụng phân tích và dịch lại...", true);
    try {
      const newTranslation = await translateTextAI(
        "", // text is unused as it's in the template
        regenerationPromptTemplate
          .replace("{original_text}", originalContent)
          .replace("{first_translation}", translatedContent)
          .replace("{editor_feedback}", analysisContent)
      );
      translatedContent = newTranslation;
      translatedOutput.textContent = translatedContent;
      showStatus("Dịch lại hoàn tất!", false);
      showBrowserNotification(
        "Dịch lại hoàn tất!",
        "Bản dịch đã được cập nhật dựa trên phân tích."
      );
      qualityCheckResultArea.classList.add("hidden");
      saveToHistory(
        currentFileType,
        docFileInput.files[0].name,
        translatedContent,
        originalContent
      );
    } catch (error) {
      console.error("Lỗi khi dịch lại:", error);
      showStatus(`Lỗi dịch lại: ${error.message}`, false);
    } finally {
      toggleActionButtons(false);
    }
  }

  function resetFileSelection() {
    clearFileInput();
    pasteInput.value = "";
    resultArea.classList.add("hidden");
    qualityCheckResultArea.classList.add("hidden");
    titleSuggestionArea.classList.add("hidden");
    evaluationResultArea.classList.add("hidden");
    addCommentBtn.classList.add("hidden");
    evaluateBtn.classList.add("hidden");
    commentSection.classList.add("hidden");
    commentActions.classList.add("hidden");
    translatedOutput.textContent = "";
    statusDiv.innerHTML = "";
    detailedStatusContainer.classList.add("hidden");
    retryContainer.classList.add("hidden");
    characterCountContainer.classList.add("hidden");
    totalCharCount.textContent = "0";
    originalContent = "";
    translatedContent = "";
    analysisContent = "";
    isFirstTranslationDone = false;
    currentFileType = null;
    toggleCommentsBtn.querySelector("i").classList.add("fa-eye");
    toggleCommentsBtn.querySelector("i").classList.remove("fa-eye-slash");
    // Reset evaluation toggle icon
    toggleEvaluationBtn.querySelector("i").classList.add("fa-eye");
    toggleEvaluationBtn.querySelector("i").classList.remove("fa-eye-slash");
    // ADDED: Reset timer display
    timerDisplay.classList.add("hidden");
    timerDisplay.textContent = "";
    stopTimer();
    updateTranslateButtonState();
  }

  function copyTranslatedText() {
    if (!translatedContent) return;
    const textArea = document.createElement("textarea");
    textArea.value = translatedContent;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "Đã sao chép!";
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error("Không thể sao chép", err);
      showStatus("Lỗi: không thể sao chép.", false);
    }
    document.body.removeChild(textArea);
  }

  initializeApp();
  updateTranslateButtonState();
};
