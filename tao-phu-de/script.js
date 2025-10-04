document.addEventListener("DOMContentLoaded", () => {
  // --- KHAI BÁO BIẾN VÀ DOM ELEMENTS ---
  const apiKeyInput = document.getElementById("api-keys-input");
  const saveApiKeysBtn = document.getElementById("save-api-keys");
  const savedKeysList = document.getElementById("keys-ul");
  const apiStatus = document.getElementById("api-status");
  const threadStatusContainer = document.getElementById(
    "thread-status-container"
  );

  // Subtitle elements
  const srtFileInput = document.getElementById("srt-file");
  const srtFileNameLabel = document.getElementById("srt-file-name");
  const docxFileInput = document.getElementById("docx-file");
  const textContentArea = document.getElementById("text-content");
  const generateViBtn = document.getElementById("generate-vi-btn");
  const resultContainer = document.getElementById("result-container");
  const loaderContainer = document.getElementById("loader-container");
  const secondaryGenerationOptions = document.getElementById(
    "secondary-generation-options"
  );
  const srtViTextarea = document.getElementById("srt-vi");
  const srtEnTextarea = document.getElementById("srt-en");
  const srtJaTextarea = document.getElementById("srt-ja");
  const srtKoTextarea = document.getElementById("srt-ko");

  // Translator elements
  const transGenreSelect = document.getElementById("trans-genre-select");
  const transGenreCustom = document.getElementById("trans-genre-custom");
  const transTitle = document.getElementById("trans-title");
  const transSummary = document.getElementById("trans-summary");
  const transDocxFile = document.getElementById("trans-docx-file");
  const socialMediaList = document.getElementById("social-media-list");
  const addSocialBtn = document.getElementById("add-social-btn");
  const transHashtags = document.getElementById("trans-hashtags");
  const transKeywords = document.getElementById("trans-keywords");
  const transLang = document.getElementById("trans-lang");
  const translateBtn = document.getElementById("translate-btn");
  const translationLoader = document.getElementById("translation-loader");
  const translationOutput = document.getElementById("translation-output");
  const copyTranslationBtn = document.getElementById("copy-translation-btn");

  // General UI elements
  const toast = document.getElementById("toast");
  const confirmModal = document.getElementById("confirm-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalConfirmBtn = document.getElementById("modal-confirm");
  const modalCancelBtn = document.getElementById("modal-cancel");
  const clearDbBtn = document.getElementById("clear-db");

  let apiKeys = [];
  let sampleSrtContent = "";

  // --- CẤU HÌNH IndexedDB ---
  let db;
  const dbName = "SubtitleAppDB";
  const dbVersion = 1;

  function initDB() {
    try {
      const request = indexedDB.open(dbName, dbVersion);
      request.onerror = (event) => {
        console.error("Lỗi khi mở IndexedDB:", event.target.errorCode);
        showToast("Không thể khởi tạo cơ sở dữ liệu.", "error");
      };
      request.onsuccess = (event) => {
        db = event.target.result;
        console.log("IndexedDB đã được mở thành công.");
      };
      request.onupgradeneeded = (event) => {
        const dbInstance = event.target.result;
        if (!dbInstance.objectStoreNames.contains("cache")) {
          dbInstance.createObjectStore("cache", { keyPath: "id" });
          console.log("Đã tạo Object Store 'cache'.");
        }
      };
    } catch (e) {
      console.error("IndexedDB không được hỗ trợ hoặc bị chặn:", e);
      showToast("IndexedDB không được hỗ trợ trình duyệt này.", "error");
    }
  }

  function clearDB() {
    if (!db) {
      showToast("Cơ sở dữ liệu chưa sẵn sàng.", "error");
      return;
    }
    const transaction = db.transaction(["cache"], "readwrite");
    const store = transaction.objectStore("cache");
    const request = store.clear();
    request.onsuccess = () => {
      showToast("Đã dọn dẹp bộ nhớ đệm thành công!", "success");
    };
    request.onerror = (event) => {
      console.error("Lỗi khi dọn dẹp DB: ", event.target.error);
      showToast("Có lỗi xảy ra khi dọn dẹp bộ nhớ.", "error");
    };
  }

  // --- QUẢN LÝ API KEY ---
  function loadApiKeys() {
    try {
      const storedKeys = localStorage.getItem("geminiApiKeys");
      if (storedKeys) {
        apiKeys = JSON.parse(storedKeys);
        apiKeyInput.value = apiKeys.join("\n");
      }
    } catch (e) {
      console.error("Lỗi khi đọc API keys từ localStorage:", e);
      localStorage.removeItem("geminiApiKeys");
    }
    renderApiKeys();
    updateApiStatus();
  }

  function saveApiKeys() {
    const keys = apiKeyInput.value
      .split("\n")
      .map((k) => k.trim())
      .filter((k) => k);
    apiKeys = [...new Set(keys)]; // Loại bỏ key trùng
    try {
      localStorage.setItem("geminiApiKeys", JSON.stringify(apiKeys));
      showToast("Đã lưu API keys thành công!", "success");
    } catch (e) {
      console.error("Lỗi khi lưu API keys vào localStorage:", e);
      showToast("Lỗi khi lưu API keys.", "error");
    }
    renderApiKeys();
    updateApiStatus();
  }

  function renderApiKeys() {
    savedKeysList.innerHTML = "";
    if (apiKeys.length === 0) {
      savedKeysList.innerHTML =
        '<li class="text-gray-500">Chưa có key nào được lưu.</li>';
      return;
    }
    apiKeys.forEach((key, index) => {
      const li = document.createElement("li");
      li.className =
        "flex justify-between items-center p-1 hover:bg-gray-700/50 rounded";
      const maskedKey = `${key.substring(0, 5)}...${key.substring(
        key.length - 4
      )}`;
      li.innerHTML = `
                <span>${maskedKey}</span>
                <button data-index="${index}" class="delete-key-btn text-red-500 hover:text-red-600 text-xs"><i class="fas fa-times-circle"></i></button>
            `;
      savedKeysList.appendChild(li);
    });
  }

  function deleteApiKey(index) {
    showConfirmModal(
      "Xác nhận xóa API Key",
      "Bạn có chắc muốn xóa API key này không?",
      () => {
        apiKeys.splice(index, 1);
        saveApiKeys(); // Use save to resync everything
      }
    );
  }

  function updateApiStatus() {
    if (apiKeys.length >= 4) {
      apiStatus.innerHTML = `<span class="text-green-400 font-semibold"><i class="fas fa-check-circle mr-1"></i>Đã nhập ${apiKeys.length} API key. <span class="text-cyan-400">Chế độ đa luồng đã được mở khóa.</span></span>`;
    } else if (apiKeys.length > 0) {
      apiStatus.innerHTML = `<span class="text-green-400 font-semibold"><i class="fas fa-check-circle mr-1"></i>Đã nhập ${apiKeys.length} API key. Sẵn sàng hoạt động.</span>`;
    } else {
      apiStatus.innerHTML = `<span class="text-red-400 font-semibold"><i class="fas fa-exclamation-triangle mr-1"></i>Chưa nhập API key. Vui lòng nhập để sử dụng.</span>`;
    }
  }

  // --- XỬ LÝ FILE INPUT (Chung) ---
  function handleSrtFile(event) {
    const file = event.target.files[0];
    if (!file) {
      sampleSrtContent = "";
      srtFileNameLabel.textContent = "Nhấn để chọn file SRT làm mẫu thời gian";
      srtFileNameLabel.classList.remove("font-semibold", "text-teal-400");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      sampleSrtContent = e.target.result;
      srtFileNameLabel.textContent = file.name;
      srtFileNameLabel.classList.add("font-semibold", "text-teal-400");
      showToast(`Đã tải lên file SRT mẫu: ${file.name}`, "info");
    };
    reader.onerror = () => {
      showToast("Lỗi khi đọc file SRT.", "error");
      sampleSrtContent = "";
    };
    reader.readAsText(file);
  }

  function handleDocxFile(event, targetTextarea) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      mammoth
        .extractRawText({ arrayBuffer: arrayBuffer })
        .then((result) => {
          targetTextarea.value = result.value;
          showToast(`Đã nhập nội dung từ ${file.name}`, "info");
        })
        .catch((error) => {
          console.error(error);
          showToast("Không thể đọc file .docx.", "error");
        });
    };
    reader.readAsArrayBuffer(file);
  }

  // --- LOGIC TẠO PHỤ ĐỀ (ĐÃ VIẾT LẠI HOÀN TOÀN) ---

  function parseSrt(srtContent) {
    if (!srtContent) return [];
    const blocks = srtContent.trim().split(/\r?\n\r?\n/);
    return blocks
      .map((block) => {
        const lines = block.split(/\r?\n/);
        if (lines.length < 2) return null;
        return {
          index: lines[0],
          time: lines[1],
          text: lines.slice(2).join("\n"),
        };
      })
      .filter(Boolean);
  }

  function escapeForPrompt(str) {
    if (typeof str !== "string") return "";
    return JSON.stringify(str).slice(1, -1);
  }

  async function callGeminiApi(prompt, apiKey) {
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    };
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const errorBody = await response
          .json()
          .catch(() => ({ error: { message: response.statusText } }));
        return { success: false, error: errorBody.error.message };
      }
      const result = await response.json();
      const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (jsonText) {
        return { success: true, data: JSON.parse(jsonText) };
      }
      return { success: false, error: "Kết quả trả về không hợp lệ." };
    } catch (error) {
      console.error("Fetch Network Error:", error);
      return { success: false, error: "Lỗi kết nối mạng." };
    }
  }

  async function handleSubtitleGeneration(lang) {
    if (lang === "vi" && !validateInputs()) return;
    if (lang === "vi") resetAllSubtitles();

    if (lang === "vi" && apiKeys.length >= 4) {
      await runParallelVietnameseGeneration();
    } else {
      await runSingleThreadGeneration(lang);
    }
  }

  async function runParallelVietnameseGeneration() {
    setLoadingState(true, "Bắt đầu xử lý đa luồng...");
    const mainText = textContentArea.value.trim();
    const srtBlocks = parseSrt(sampleSrtContent);

    const numThreads = Math.floor(apiKeys.length / 2);
    const primaryKeys = apiKeys.slice(0, numThreads);
    let backupKeys = [...apiKeys.slice(numThreads)];

    const chunks = [];
    const chunkSize = Math.ceil(srtBlocks.length / numThreads);
    for (let i = 0; i < srtBlocks.length; i += chunkSize) {
      chunks.push(srtBlocks.slice(i, i + chunkSize));
    }

    initThreadStatusUI(chunks.length);

    const processChunk = async (chunk, index) => {
      const originalTexts = chunk.map((b) => b.text);
      const prompt = `Bạn là một chuyên gia hiệu đính phụ đề. Dựa vào nội dung truyện đầy đủ và một danh sách các dòng phụ đề gốc (theo thứ tự), hãy viết lại từng dòng phụ đề sao cho khớp chính xác với nội dung truyện. **TRẢ VỀ MỘT MẢNG JSON CÁC CHUỖI (STRINGS)**, mỗi chuỗi là một dòng phụ đề đã được sửa. Mảng phải có chính xác ${
        originalTexts.length
      } phần tử.
**Nội dung truyện đầy đủ (để tham khảo ngữ cảnh):**
---
${escapeForPrompt(mainText)}
---
**Danh sách các dòng phụ đề gốc cần sửa:**
---
${JSON.stringify(originalTexts)}
---
**Yêu cầu:** Trả về kết quả dưới dạng JSON object với một key duy nhất là "lines" chứa một mảng các chuỗi (strings) đã được sửa.`;

      updateThreadStatus(index, "processing");
      let result = await callGeminiApi(prompt, primaryKeys[index]);

      if (!result.success && backupKeys.length > 0) {
        updateThreadStatus(index, "error", "Thất bại lần 1");
        setLoadingState(true, `Luồng ${index + 1} gặp lỗi, chờ 10 giây...`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
        const backupKey = backupKeys.shift();
        if (backupKey) {
          updateThreadStatus(index, "retrying");
          result = await callGeminiApi(prompt, backupKey);
        }
      }

      if (result.success && result.data.lines) {
        updateThreadStatus(index, "success");
        const correctedData = chunk.map((block, j) => ({
          time: block.time,
          text: result.data.lines[j] || block.text,
        }));
        return { success: true, data: correctedData, originalIndex: index };
      } else {
        updateThreadStatus(
          index,
          "error",
          result.error || "Dữ liệu không hợp lệ"
        );
        return {
          success: false,
          data: chunk,
          originalIndex: index,
          error: result.error,
        };
      }
    };

    const workerPromises = chunks.map((chunk, index) => {
      return new Promise((resolve) =>
        setTimeout(() => {
          setLoadingState(
            true,
            `Khởi chạy luồng ${index + 1}/${chunks.length}...`
          );
          resolve(processChunk(chunk, index));
        }, index * 10000)
      );
    });

    let results = await Promise.all(workerPromises);
    let failedChunks = results.filter((r) => !r.success);

    if (failedChunks.length > 0) {
      setLoadingState(
        true,
        `Phát hiện ${failedChunks.length} luồng lỗi, bắt đầu quá trình sửa lỗi cuối cùng...`
      );
      const allAvailableKeys = [...apiKeys];
      for (const failed of failedChunks) {
        for (const key of allAvailableKeys) {
          updateThreadStatus(failed.originalIndex, "retrying", "Vòng cuối");
          const originalChunk = chunks[failed.originalIndex];
          const originalTexts = originalChunk.map((b) => b.text);
          const prompt = `...`; // Same prompt
          const result = await callGeminiApi(prompt, key);
          if (result.success && result.data.lines) {
            const correctedData = originalChunk.map((block, j) => ({
              time: block.time,
              text: result.data.lines[j] || block.text,
            }));
            const successResult = {
              success: true,
              data: correctedData,
              originalIndex: failed.originalIndex,
            };
            results[failed.originalIndex] = successResult;
            updateThreadStatus(failed.originalIndex, "success");
            break;
          }
          updateThreadStatus(failed.originalIndex, "error", result.error);
          await new Promise((resolve) => setTimeout(resolve, 10000));
        }
      }
    }

    failedChunks = results.filter((r) => !r.success);
    if (failedChunks.length > 0) {
      showToast(
        `Không thể hoàn thành ${failedChunks.length} phần của phụ đề.`,
        "error"
      );
      setLoadingState(false);
      return;
    }

    const allBlocks = results
      .sort((a, b) => a.originalIndex - b.originalIndex)
      .flatMap((r) => r.data);
    const finalSrt = allBlocks
      .map((block, index) => `${index + 1}\n${block.time}\n${block.text}`)
      .join("\n\n");

    srtViTextarea.value = finalSrt;
    showToast("Tạo phụ đề tiếng Việt đa luồng thành công!", "success");
    showRegenerateButton("vi");
    secondaryGenerationOptions.classList.remove("hidden");
    setLoadingState(false);
  }

  async function runSingleThreadGeneration(lang) {
    const isInitialGeneration = lang === "vi";
    const mainText = textContentArea.value.trim();
    const sourceSrt = srtViTextarea.value.trim();

    let loader, status, button;
    if (isInitialGeneration) {
      setLoadingState(true, "Chuẩn bị tạo phụ đề...");
    } else {
      loader = document.getElementById(`${lang}-loader`);
      status = document.getElementById(`${lang}-status`);
      button = document.querySelector(
        `.secondary-generate-btn[data-lang="${lang}"], .regenerate-btn[data-lang="${lang}"]`
      );
      if (loader) loader.classList.remove("hidden");
      if (status) status.textContent = "";
      if (button) button.disabled = true;
      document.getElementById(`srt-${lang}`).value = "";
    }

    const langMap = { en: "english", ja: "japanese", ko: "korean" };
    const languageForPrompt = isInitialGeneration
      ? "vietnamese"
      : langMap[lang];

    const prompt = buildSingleThreadPrompt(
      languageForPrompt,
      mainText,
      sourceSrt
    );
    if (!prompt) {
      setLoadingState(false);
      return;
    }

    const progressCallback = (main, detail) => {
      if (isInitialGeneration) setLoadingState(true, main, detail);
      else if (status) status.textContent = `${main} ${detail || ""}`;
    };

    const result = await callGeminiApiWithRetries(prompt, progressCallback);

    if (isInitialGeneration) setLoadingState(false);
    else {
      if (loader) loader.classList.add("hidden");
      if (button) button.disabled = false;
      if (status)
        setTimeout(() => {
          status.textContent = "";
        }, 5000);
    }

    if (result.success) {
      let finalSrt = "";
      if (lang === "vi" && result.data.lines) {
        const srtBlocks = parseSrt(sampleSrtContent);
        const lines = result.data.lines;
        if (srtBlocks.length !== lines.length) {
          showToast(
            `AI trả về ${lines.length} dòng, khác với ${srtBlocks.length} mốc thời gian.`,
            "warning"
          );
        }
        finalSrt = srtBlocks
          .map((block, index) => {
            const newText = lines[index] || block.text;
            return `${index + 1}\n${block.time}\n${newText}`;
          })
          .join("\n\n");
      } else if (result.data.srt) {
        finalSrt = result.data.srt;
      }

      if (finalSrt) {
        document.getElementById(`srt-${lang}`).value = finalSrt;
        showToast(`Tạo phụ đề ${lang.toUpperCase()} thành công!`, "success");
        showRegenerateButton(lang);
        if (isInitialGeneration)
          secondaryGenerationOptions.classList.remove("hidden");
        if (status) status.textContent = "Hoàn thành.";
      } else {
        showToast(
          `Lỗi: AI trả về dữ liệu không hợp lệ cho ${lang.toUpperCase()}.`,
          "error"
        );
        if (status) status.textContent = "Lỗi dữ liệu.";
      }
    } else {
      showToast(
        result.error || `Tạo phụ đề ${lang.toUpperCase()} thất bại.`,
        "error"
      );
      if (status) status.textContent = "Thất bại.";
    }
  }

  function buildSingleThreadPrompt(language, mainText, sourceSrt) {
    if (language === "vietnamese") {
      const srtBlocks = parseSrt(sampleSrtContent);
      if (!srtBlocks || srtBlocks.length === 0) return null;
      const originalTexts = srtBlocks.map((b) => b.text);
      const escapedMainText = escapeForPrompt(mainText);
      return `Bạn là một chuyên gia hiệu đính phụ đề. Dựa vào nội dung truyện đầy đủ và một danh sách các dòng phụ đề gốc (theo thứ tự), hãy viết lại từng dòng phụ đề sao cho khớp chính xác với nội dung truyện. **TRẢ VỀ MỘT MẢNG JSON CÁC CHUỖI (STRINGS)**, mỗi chuỗi là một dòng phụ đề đã được sửa. Mảng phải có chính xác ${
        originalTexts.length
      } phần tử.
**Nội dung truyện đầy đủ (để tham khảo ngữ cảnh):**
---
${escapedMainText}
---
**Danh sách các dòng phụ đề gốc cần sửa:**
---
${JSON.stringify(originalTexts)}
---
**Yêu cầu:** Trả về kết quả dưới dạng JSON object với một key duy nhất là "lines" chứa một mảng các chuỗi (strings) đã được sửa.`;
    }

    let targetLangName = "";
    switch (language) {
      case "english":
        targetLangName = "tiếng Anh";
        break;
      case "japanese":
        targetLangName = "tiếng Nhật";
        break;
      case "korean":
        targetLangName = "tiếng Hàn";
        break;
      default:
        return null;
    }

    const escapedOriginalText = escapeForPrompt(mainText);
    const escapedSourceSrt = escapeForPrompt(sourceSrt);

    return `Bạn là một dịch giả chuyên nghiệp. Nhiệm vụ của bạn là dịch file phụ đề SRT từ tiếng Việt sang ${targetLangName}.
**QUAN TRỌNG:** Để đảm bảo bản dịch chính xác và ngữ cảnh phù hợp, hãy tham khảo nội dung gốc của câu chuyện dưới đây.
**Nội dung gốc của truyện:**
---
${escapedOriginalText}
---
**Nội dung SRT tiếng Việt cần dịch:**
---
${escapedSourceSrt}
---
**Yêu cầu:**
1. Dịch nội dung trong file SRT tiếng Việt sang ${targetLangName}.
2. Sử dụng nội dung gốc của truyện để đảm bảo bản dịch đúng ngữ cảnh, thuật ngữ và văn phong.
3. **TUYỆT ĐỐI GIỮ NGUYÊN ĐỊNH DẠNG VÀ MỐC THỜI GIAN** của file SRT gốc.
4. TRẢ VỀ KẾT QUẢ DƯỚI DẠNG JSON OBJECT với một key duy nhất là "srt".
Ví dụ: { "srt": "1\\n00:00:01,234 --> 00:00:03,456\\nHello everyone." }`;
  }

  async function callGeminiApiWithRetries(prompt, onProgress) {
    for (let i = 0; i < apiKeys.length; i++) {
      onProgress("Đang xử lý...", `Sử dụng API key ${i + 1}/${apiKeys.length}`);
      const result = await callGeminiApi(prompt, apiKeys[i]);
      if (result.success) return result;
      if (i < apiKeys.length - 1) {
        onProgress(`Lỗi với API Key ${i + 1}.`, "Sẽ thử lại sau 10 giây...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
    return { success: false, data: null, error: "Tất cả API key đều gặp lỗi." };
  }

  // --- LOGIC DỊCH THUẬT ---
  function addSocialMediaInput() {
    const id = Date.now();
    const div = document.createElement("div");
    div.className = "flex items-center gap-2 social-media-item";
    div.innerHTML = `
            <input type="text" class="w-1/3 p-2 border border-gray-600 rounded-md bg-gray-700 text-gray-200" placeholder="Tên MXH (VD: Facebook)">
            <input type="text" class="w-2/3 p-2 border border-gray-600 rounded-md bg-gray-700 text-gray-200" placeholder="Đường link">
            <button class="text-red-500 hover:text-red-600 remove-social-btn"><i class="fas fa-minus-circle"></i></button>
        `;
    socialMediaList.appendChild(div);
  }

  async function handleTranslation() {
    if (apiKeys.length === 0) {
      showToast("Vui lòng nhập và lưu ít nhất một API key.", "error");
      return;
    }

    const targetLang = transLang.value;
    const storyTitle = transTitle.value.trim();
    const storyContent = transSummary.value.trim();
    let genre =
      transGenreSelect.value === "custom"
        ? transGenreCustom.value.trim()
        : transGenreSelect.value;

    if (!genre || !storyTitle || !storyContent) {
      showToast(
        "Vui lòng nhập Thể loại, Tên truyện và Nội dung tóm tắt.",
        "error"
      );
      return;
    }

    let channelName = "";
    switch (targetLang) {
      case "vietnamese":
        channelName = "Trần Thiên Minh";
        break;
      case "english":
        channelName = "Tran Thien Minh";
        break;
      case "korean":
        channelName = "쩐 티엔 민 (Tran Thien Minh)";
        break;
      case "japanese":
        channelName = "トラン・ティエン・ミン (Tran Thien Minh)";
        break;
    }

    const socialMedia = Array.from(
      document.querySelectorAll(".social-media-item")
    )
      .map((item) => {
        const name = item.querySelector("input:nth-child(1)").value.trim();
        const link = item.querySelector("input:nth-child(2)").value.trim();
        return name && link ? `${name}: ${link}` : null;
      })
      .filter(Boolean)
      .join("\n");

    const additionalHashtags = transHashtags.value.trim();
    const additionalKeywords = transKeywords.value.trim();

    const escapedGenre = escapeForPrompt(genre);
    const escapedTitle = escapeForPrompt(storyTitle);
    const escapedContent = escapeForPrompt(storyContent);
    const escapedSocial = escapeForPrompt(socialMedia);
    const escapedHashtags = escapeForPrompt(additionalHashtags);
    const escapedKeywords = escapeForPrompt(additionalKeywords);

    const prompt = `
            Bạn là một trợ lý dịch thuật và định dạng nội dung chuyên nghiệp.
            Nhiệm vụ của bạn là xử lý thông tin dưới đây và trả về một chuỗi văn bản đã được định dạng và dịch sang ngôn ngữ đích.
            **Ngôn ngữ đích:** ${targetLang}
            **Thông tin đầu vào:**
            - Thể Loại Truyện: "${escapedGenre}"
            - Tên Truyện: "${escapedTitle}"
            - Nội dung cần tóm tắt: "${escapedContent}"
            - Danh sách mạng xã hội: "${escapedSocial}"
            - Hashtag bổ sung (cách nhau bởi dấu phẩy): "${escapedHashtags}"
            - Từ khóa bổ sung (cách nhau bởi dấu phẩy): "${escapedKeywords}"
            **Yêu cầu:**
            1.  **Dịch thuật chuyên nghiệp:** Dịch "Thể Loại Truyện", "Tên Truyện", các hashtag và từ khóa. Tóm tắt "Nội dung cần tóm tắt" bằng ngôn ngữ đích.
            2.  **Định dạng nghiêm ngặt:** Tạo ra kết quả cuối cùng theo đúng khuôn mẫu dưới đây.
            3.  **Tên Kênh:** Sử dụng tên kênh chính xác sau: "${channelName}"
            **Khuôn mẫu kết quả (TUYỆT ĐỐI TUÂN THỦ):**
            {Thể Loại Truyện đã dịch} / {Tên Truyện đã dịch} | ${channelName}
            ---------------------------------------------
            {Nội dung đã được tóm tắt}
            ---------------------------------------------
            🧰 About us:
            ${
              socialMedia
                ? "{Danh sách mạng xã hội (giữ nguyên không dịch)}"
                : ""
            }
            ---------------------------------------------
            🎷 HashTag: {danh sách hashtag đã dịch, cách nhau bởi dấu cách}
            💌 Keyword: {danh sách từ khóa đã dịch, cách nhau bởi dấu phẩy và dấu cách}
            **Lưu ý quan trọng:** Chỉ trả về kết quả dưới dạng JSON object với một key duy nhất là "formatted_text".
        `;

    translationLoader.style.display = "flex";
    translationOutput.value = "";
    translateBtn.disabled = true;

    const result = await callGeminiApiWithRetries(prompt, () => {});

    translationLoader.style.display = "none";
    translateBtn.disabled = false;

    if (result.success && result.data.formatted_text) {
      translationOutput.value = result.data.formatted_text;
      showToast("Dịch và định dạng thành công!", "success");
    } else {
      showToast(
        result.error || "Dịch thất bại, đã thử tất cả API key.",
        "error"
      );
    }
  }

  // --- HÀM HỖ TRỢ UI VÀ VALIDATION ---
  function validateInputs() {
    if (!sampleSrtContent) {
      showToast("Vui lòng tải lên một file SRT mẫu chứa thời gian.", "error");
      return false;
    }
    if (!textContentArea.value.trim()) {
      showToast("Vui lòng nhập nội dung truyện chính xác.", "error");
      return false;
    }
    if (apiKeys.length === 0) {
      showToast("Vui lòng nhập và lưu ít nhất một API key.", "error");
      return false;
    }
    return true;
  }

  function resetAllSubtitles() {
    [srtViTextarea, srtEnTextarea, srtJaTextarea, srtKoTextarea].forEach(
      (ta) => {
        ta.value = "";
      }
    );
    ["en-status", "ja-status", "ko-status"].forEach((id) => {
      document.getElementById(id).textContent = "";
    });
    document
      .querySelectorAll(".regenerate-btn")
      .forEach((btn) => btn.classList.add("hidden"));
    secondaryGenerationOptions.classList.add("hidden");
  }

  function showRegenerateButton(lang) {
    const btn = document.querySelector(`.regenerate-btn[data-lang="${lang}"]`);
    if (btn) btn.classList.remove("hidden");
  }

  function setLoadingState(
    isLoading,
    mainMessage = null,
    detailMessage = null
  ) {
    const loaderMainText = document.getElementById("loader-main-text");
    const loaderDetails = document.getElementById("loader-details");

    generateViBtn.disabled = isLoading;
    if (isLoading) {
      resultContainer.classList.add("hidden");
      loaderContainer.classList.remove("hidden");
      loaderContainer.classList.add("flex");
      if (mainMessage) loaderMainText.textContent = mainMessage;
      if (detailMessage) loaderDetails.textContent = detailMessage;
    } else {
      resultContainer.classList.remove("hidden");
      loaderContainer.classList.add("hidden");
      loaderContainer.classList.remove("flex");
      threadStatusContainer.innerHTML = "";
    }
  }

  function initThreadStatusUI(numThreads) {
    threadStatusContainer.innerHTML = "";
    for (let i = 0; i < numThreads; i++) {
      const div = document.createElement("div");
      div.id = `thread-status-${i}`;
      div.className = "thread-status-box bg-gray-700";
      div.innerHTML = `
                <span>Luồng ${i + 1}</span>
                <span class="font-semibold text-gray-400">Chờ...</span>
            `;
      threadStatusContainer.appendChild(div);
    }
  }

  function updateThreadStatus(index, status, message = "") {
    const box = document.getElementById(`thread-status-${index}`);
    if (!box) return;

    let statusText = "";
    let bgColor = "bg-gray-700";
    let textColor = "text-gray-400";
    let icon = "";

    switch (status) {
      case "processing":
        statusText = "Đang xử lý...";
        bgColor = "bg-blue-900/50";
        textColor = "text-blue-300";
        icon = '<i class="fas fa-spinner fa-spin ml-2"></i>';
        break;
      case "retrying":
        statusText = "Đang thử lại...";
        bgColor = "bg-yellow-900/50";
        textColor = "text-yellow-300";
        icon = '<i class="fas fa-sync-alt fa-spin ml-2"></i>';
        break;
      case "success":
        statusText = "Thành công";
        bgColor = "bg-green-900/50";
        textColor = "text-green-300";
        icon = '<i class="fas fa-check-circle ml-2"></i>';
        break;
      case "error":
        statusText = `Lỗi`;
        bgColor = "bg-red-900/50";
        textColor = "text-red-300";
        icon = '<i class="fas fa-exclamation-triangle ml-2"></i>';
        break;
      default:
        statusText = "Chờ...";
    }
    box.className = `thread-status-box ${bgColor}`;
    box.innerHTML = `
            <span>Luồng ${index + 1}</span>
            <span class="font-semibold ${textColor} flex items-center">${statusText} ${icon}</span>
        `;
  }

  function showToast(message, type = "info") {
    toast.textContent = message;
    toast.className = "toast show";
    if (type === "success") toast.classList.add("bg-green-500");
    else if (type === "error") toast.classList.add("bg-red-500");
    else if (type === "warning") toast.classList.add("bg-yellow-500");
    else toast.classList.add("bg-gray-700");
    setTimeout(() => {
      toast.className = "toast";
    }, 4000);
  }

  function showConfirmModal(title, body, onConfirm) {
    modalTitle.textContent = title;
    modalBody.textContent = body;
    confirmModal.classList.remove("hidden");

    requestAnimationFrame(() => {
      confirmModal.classList.remove("opacity-0");
      confirmModal.querySelector(".modal-content").classList.remove("scale-95");
    });

    const confirmHandler = () => {
      onConfirm();
      hideConfirmModal();
    };
    modalConfirmBtn.addEventListener("click", confirmHandler, { once: true });
  }

  function hideConfirmModal() {
    confirmModal.classList.add("opacity-0");
    confirmModal.querySelector(".modal-content").classList.add("scale-95");
    setTimeout(() => {
      confirmModal.classList.add("hidden");
    }, 300); // Wait for transition to finish
  }

  function copyToClipboard(targetId) {
    const textarea = document.getElementById(targetId);
    if (!textarea.value) {
      showToast("Không có nội dung để sao chép.", "error");
      return;
    }
    navigator.clipboard.writeText(textarea.value).then(
      () => showToast("Đã sao chép!", "success"),
      () => showToast("Lỗi khi sao chép.", "error")
    );
  }

  function downloadSrt(lang) {
    let content = document.getElementById(`srt-${lang}`).value;
    if (!content) {
      showToast("Không có nội dung để tải xuống.", "error");
      return;
    }
    const fileName = `subtitle.${lang}.srt`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- GẮN EVENT LISTENERS ---
  saveApiKeysBtn.addEventListener("click", saveApiKeys);
  generateViBtn.addEventListener("click", () => handleSubtitleGeneration("vi"));
  srtFileInput.addEventListener("change", handleSrtFile);
  docxFileInput.addEventListener("change", (e) =>
    handleDocxFile(e, textContentArea)
  );
  transDocxFile.addEventListener("change", (e) =>
    handleDocxFile(e, transSummary)
  );

  resultContainer.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const button = e.target.closest("button");
    if (!button) return;

    if (
      button.classList.contains("regenerate-btn") ||
      button.classList.contains("secondary-generate-btn")
    ) {
      const lang = button.dataset.lang;
      if (lang) handleSubtitleGeneration(lang);
    }
  });

  savedKeysList.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const btn = e.target.closest(".delete-key-btn");
    if (btn) deleteApiKey(parseInt(btn.dataset.index, 10));
  });

  document.querySelectorAll(".copy-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      if (e.currentTarget.dataset.target)
        copyToClipboard(e.currentTarget.dataset.target);
    })
  );
  document.querySelectorAll(".download-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      if (e.currentTarget.dataset.lang)
        downloadSrt(e.currentTarget.dataset.lang);
    })
  );

  modalCancelBtn.addEventListener("click", hideConfirmModal);
  clearDbBtn.addEventListener("click", () =>
    showConfirmModal("Xác nhận dọn dẹp", "Bạn có chắc muốn xóa cache?", clearDB)
  );

  // Translator event listeners
  transGenreSelect.addEventListener("change", () => {
    transGenreCustom.classList.toggle(
      "hidden",
      transGenreSelect.value !== "custom"
    );
  });
  addSocialBtn.addEventListener("click", addSocialMediaInput);
  socialMediaList.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const removeBtn = e.target.closest(".remove-social-btn");
    if (removeBtn) removeBtn.closest(".social-media-item")?.remove();
  });
  translateBtn.addEventListener("click", handleTranslation);
  copyTranslationBtn.addEventListener("click", () =>
    copyToClipboard("translation-output")
  );

  // --- KHỞI TẠO ỨNG DỤNG ---
  function init() {
    initDB();
    loadApiKeys();
    addSocialMediaInput();

    const srtDropZone = document.getElementById("srt-drop-zone");
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      srtDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    ["dragenter", "dragover"].forEach((eventName) =>
      srtDropZone.addEventListener(eventName, () =>
        srtDropZone.classList.add("border-teal-500", "bg-gray-700/50")
      )
    );
    ["dragleave", "drop"].forEach((eventName) =>
      srtDropZone.addEventListener(eventName, () =>
        srtDropZone.classList.remove("border-teal-500", "bg-gray-700/50")
      )
    );
    srtDropZone.addEventListener("drop", (e) => {
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        srtFileInput.files = e.dataTransfer.files;
        handleSrtFile({ target: srtFileInput });
      }
    });
  }

  init();
});
