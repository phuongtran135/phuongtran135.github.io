document.addEventListener("DOMContentLoaded", () => {
  const DB_NAME = "proAudioPlayerDB";
  const STORE_NAME = "audioFiles";
  let db;

  // --- DOM Elements ---
  const libraryView = document.getElementById("library-view");
  const playerView = document.getElementById("player-view");
  const fileInput = document.getElementById("file-input");
  const audioList = document.getElementById("audio-list");
  const audioPlayer = document.getElementById("audio-player");
  const docEditor = document.getElementById("doc-editor");
  const copyNoteBtn = document.getElementById("copy-note-btn");
  const clearNoteBtn = document.getElementById("clear-note-btn");
  const uploadDocxBtn = document.getElementById("upload-docx-btn");
  const backToLibraryBtn = document.getElementById("back-to-library-btn");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const playPauseIcon = document.getElementById("play-pause-icon");
  const loopBtn = document.getElementById("loop-btn");
  const rewindBtn = document.getElementById("rewind-btn");
  const forwardBtn = document.getElementById("forward-btn");
  const timeline = document.getElementById("timeline");
  const timelineProgress = document.getElementById("timeline-progress");
  const seekTooltip = document.getElementById("seek-tooltip");
  const currentTimeEl = document.getElementById("current-time");
  const durationEl = document.getElementById("duration");
  const speedControl = document.getElementById("speed-control");
  const speedBtn = document.getElementById("speed-btn");
  const speedOptions = document.getElementById("speed-options");
  const playerTrackTitle = document.getElementById("player-track-title");
  const volumeBtn = document.getElementById("volume-btn");
  const volumeIcon = document.getElementById("volume-icon");
  const volumeSlider = document.getElementById("volume-slider");
  const volumePercentage = document.getElementById("volume-percentage");
  const undoBtn = document.getElementById("undo-btn");
  const redoBtn = document.getElementById("redo-btn");
  const confirmModal = document.getElementById("confirm-modal");
  const confirmModalText = document.getElementById("confirm-modal-text");
  const confirmOkBtn = document.getElementById("confirm-ok-btn");
  const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
  const toast = document.getElementById("toast");
  const resumePrompt = document.getElementById("resume-prompt");
  const resumeTime = document.getElementById("resume-time");
  const resumeContinueBtn = document.getElementById(
    "resume-continue-btn"
  );
  const resumeRestartBtn = document.getElementById("resume-restart-btn");

  // --- State Variables ---
  let currentAudioFile = null;
  let lastVolume = 1;
  let undoStack = [];
  let redoStack = [];
  let isUndoingOrRedoing = false;
  let confirmCallback = null;

  // --- All Functions are defined here ---
  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 6); // Version for timedMetadata
      request.onerror = (e) =>
        reject("Lỗi khi mở IndexedDB: " + e.target.error);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };
      request.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };
    });
  }

  function addAudio(file) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add({
        name: file.name,
        type: file.type,
        blob: file,
        docContent: "",
      });
      request.onsuccess = resolve;
      request.onerror = (e) =>
        reject("Lỗi khi thêm file: " + e.target.error);
    });
  }

  function deleteAudio(id) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = resolve;
      request.onerror = (e) =>
        reject("Lỗi khi xóa file: " + e.target.error);
    });
  }

  function updateAudioData(id, newData) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);
      getRequest.onsuccess = (e) => {
        const data = e.target.result;
        if (data) {
          Object.assign(data, newData);
          const putRequest = store.put(data);
          putRequest.onsuccess = resolve;
          putRequest.onerror = reject;
        } else {
          reject("Không tìm thấy file để cập nhật");
        }
      };
      getRequest.onerror = reject;
    });
  }

  function getAllAudios() {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) =>
        reject("Lỗi khi lấy file: " + e.target.error);
    });
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, "0");
    return `${hours > 0 ? pad(hours) + ":" : ""}${pad(minutes)}:${pad(
      secs
    )}`;
  }

  async function renderLibrary() {
    try {
      const audios = await getAllAudios();
      audioList.innerHTML = "";
      if (audios.length === 0) {
        audioList.innerHTML =
          '<p class="text-slate-400 text-center italic">Thư viện của bạn trống.</p>';
        return;
      }
      audios.forEach((audio) => {
        const item = document.createElement("div");
        item.className =
          "audio-item p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors";
        item.innerHTML = `
                    <div class="flex items-center overflow-hidden mr-4 flex-grow">
                       <i class="fas fa-music mr-4 text-violet-400 flex-shrink-0"></i>
                       <span class="truncate">${audio.name}</span>
                    </div>
                    <div class="flex items-center flex-shrink-0">
                        <i class="fas fa-play text-slate-500"></i>
                        <button class="delete-audio-btn ml-4 text-slate-500 hover:text-red-500" data-id="${
                          audio.id
                        }" title="Xóa file"><i class="fas fa-trash"></i></button>
                    </div>
                `;
        item
          .querySelector(".flex-grow")
          .addEventListener("click", () => playAudio(audio));
        audioList.appendChild(item);
      });
    } catch (error) {
      console.error(error);
      showToast("Không thể tải thư viện.", "error");
    }
  }

  function showPlayerView() {
    libraryView.classList.add("hidden");
    playerView.classList.remove("hidden");
    playerView.classList.add("flex");
  }

  function showLibraryView() {
    audioPlayer.pause();
    if (audioPlayer.src) URL.revokeObjectURL(audioPlayer.src);
    audioPlayer.removeAttribute("src");
    docEditor.value = "";
    currentAudioFile = null;
    playerView.classList.add("hidden");
    playerView.classList.remove("flex");
    libraryView.classList.remove("hidden");
    libraryView.classList.add("flex");
    renderLibrary();
  }

  function playAudio(audioFile) {
    currentAudioFile = audioFile;
    const audioURL = URL.createObjectURL(audioFile.blob);
    audioPlayer.src = audioURL;
    playerTrackTitle.textContent = audioFile.name;
    playerTrackTitle.title = audioFile.name;

    const initialContent = audioFile.docContent || "";
    docEditor.value = initialContent;

    undoStack = [initialContent];
    redoStack = [];
    updateUndoRedoButtons();
    showPlayerView();
  }

  function togglePlay() {
    if (audioPlayer.paused) audioPlayer.play();
    else audioPlayer.pause();
  }

  function debounce(func, delay) {
    let timeout;
    const debounced = function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
    debounced.cancel = function () {
      clearTimeout(timeout);
    };
    return debounced;
  }

  const handleDocSave = debounce(() => {
    if (!currentAudioFile) return;
    updateAudioData(currentAudioFile.id, {
      docContent: docEditor.value,
    }).catch((err) => console.error("Lỗi khi lưu:", err));
  }, 1500);

  const handleUndoPush = debounce(() => {
    const currentText = docEditor.value;
    const lastState = undoStack[undoStack.length - 1];
    if (currentText !== lastState) {
      undoStack.push(currentText);
      if (undoStack.length > 100) undoStack.shift();
      updateUndoRedoButtons();
    }
  }, 500);

  function updateUndoRedoButtons() {
    undoBtn.disabled = undoStack.length <= 1;
    redoBtn.disabled = redoStack.length === 0;
  }

  function setVolume(level) {
    const volumeLevel = Math.max(0, Math.min(1, parseFloat(level)));
    audioPlayer.volume = volumeLevel;
    updateVolumeUI(volumeLevel);
    localStorage.setItem("audio-volume", volumeLevel);
  }

  function updateVolumeUI(level) {
    volumeSlider.value = level;
    volumePercentage.textContent = `${Math.round(level * 100)}%`;
    if (level == 0) volumeIcon.className = "fas fa-volume-xmark";
    else if (level < 0.5) volumeIcon.className = "fas fa-volume-low";
    else volumeIcon.className = "fas fa-volume-high";
  }

  function toggleMute() {
    if (audioPlayer.volume > 0) {
      lastVolume = audioPlayer.volume;
      setVolume(0);
    } else {
      setVolume(lastVolume > 0 ? lastVolume : 1);
    }
  }

  function handleTimelineUpdate(e) {
    const rect = timeline.getBoundingClientRect();
    const clientX = e.clientX || e.touches[0].clientX;
    if (clientX === undefined) return;
    audioPlayer.currentTime =
      (Math.min(Math.max(0, clientX - rect.left), rect.width) /
        rect.width) *
      audioPlayer.duration;
  }

  function showToast(message, type = "info", duration = 3000) {
    toast.textContent = message;
    toast.className = `show ${type}`;
    setTimeout(() => {
      toast.className = toast.className.replace("show", "");
    }, duration);
  }

  function showConfirm(message, onConfirm) {
    confirmModalText.textContent = message;
    confirmModal.classList.remove("hidden");
    confirmModal.classList.add("flex");
    confirmCallback = onConfirm;
  }

  confirmCancelBtn.addEventListener("click", () => {
    confirmModal.classList.add("hidden");
    confirmModal.classList.remove("flex");
    confirmCallback = null;
  });

  confirmOkBtn.addEventListener("click", () => {
    if (confirmCallback) {
      confirmCallback();
    }
    confirmModal.classList.add("hidden");
    confirmModal.classList.remove("flex");
    confirmCallback = null;
  });

  // --- Event Listeners ---
  docEditor.addEventListener("input", () => {
    if (isUndoingOrRedoing) return;
    redoStack = [];
    handleUndoPush();
    handleDocSave();
    updateUndoRedoButtons();
  });

  window.addEventListener("beforeunload", () => {
    if (currentAudioFile) {
      handleDocSave.cancel();
      updateAudioData(currentAudioFile.id, {
        docContent: docEditor.value,
      });
    }
  });

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await addAudio(file);
        renderLibrary();
        showToast(`Đã thêm: ${file.name}`, "success");
      } catch (error) {
        console.error(error);
        showToast("Không thể lưu file audio.", "error");
      } finally {
        e.target.value = "";
      }
    }
  });

  clearNoteBtn.addEventListener("click", () => {
    if (docEditor.value.length > 0 && currentAudioFile) {
      handleDocSave.cancel();
      docEditor.value = "";
      updateAudioData(currentAudioFile.id, {
        docContent: "",
      }).catch((err) => console.error("Lỗi xóa:", err));
      undoStack.push("");
      redoStack = [];
      updateUndoRedoButtons();
    }
  });

  copyNoteBtn.addEventListener("click", () => {
    if (docEditor.value.length > 0) {
      try {
        docEditor.select();
        document.execCommand("copy");
        showToast("Đã copy vào clipboard!", "success");
      } catch (err) {
        console.error("Lỗi copy:", err);
        showToast("Lỗi khi copy.", "error");
      }
    }
  });

  uploadDocxBtn.addEventListener("click", () => {
    if (!currentAudioFile) {
      showToast("Vui lòng chọn một file audio trước.", "info");
      return;
    }

    const docxInput = document.createElement("input");
    docxInput.type = "file";
    docxInput.accept = ".docx";
    docxInput.onchange = async (e) => {
      const docxFile = e.target.files[0];
      if (!docxFile) return;

      try {
        const arrayBuffer = await docxFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const newContent = result.value.replace(/\n\s*\n/g, "\n").trim();

        docEditor.value = newContent;

        // Save the new content
        handleDocSave.cancel(); // Cancel any pending save
        await updateAudioData(currentAudioFile.id, {
          docContent: newContent,
        });

        // Update undo stack
        undoStack.push(newContent);
        redoStack = [];
        updateUndoRedoButtons();

        showToast("Đã tải ghi chú từ file Docx thành công.", "success");
      } catch (error) {
        console.error("Lỗi khi đọc file docx:", error);
        showToast("Không thể đọc file .docx.", "error");
      }
    };
    docxInput.click();
  });

  undoBtn.addEventListener("click", () => {
    if (undoStack.length <= 1) return;
    isUndoingOrRedoing = true;
    redoStack.push(undoStack.pop());
    docEditor.value = undoStack[undoStack.length - 1];
    updateUndoRedoButtons();
    handleDocSave();
    isUndoingOrRedoing = false;
  });
  redoBtn.addEventListener("click", () => {
    if (redoStack.length === 0) return;
    isUndoingOrRedoing = true;
    const state = redoStack.pop();
    undoStack.push(state);
    docEditor.value = state;
    updateUndoRedoButtons();
    handleDocSave();
    isUndoingOrRedoing = false;
  });

  backToLibraryBtn.addEventListener("click", showLibraryView);
  playPauseBtn.addEventListener("click", togglePlay);
  rewindBtn.addEventListener(
    "click",
    () => (audioPlayer.currentTime -= 10)
  );
  forwardBtn.addEventListener(
    "click",
    () => (audioPlayer.currentTime += 10)
  );
  loopBtn.addEventListener("click", () => {
    audioPlayer.loop = !audioPlayer.loop;
    loopBtn.classList.toggle("active", audioPlayer.loop);
  });
  speedBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    speedOptions.classList.toggle("hidden");
    speedOptions.classList.toggle("flex");
  });
  speedOptions.querySelectorAll(".speed-option").forEach((option) => {
    option.addEventListener("click", () => {
      const speed = parseFloat(option.dataset.speed);
      audioPlayer.playbackRate = speed;
      speedBtn.textContent = `${speed.toFixed(speed % 1 === 0 ? 1 : 2)}x`;
      speedOptions
        .querySelectorAll(".speed-option")
        .forEach((el) => el.classList.remove("active"));
      option.classList.add("active");
      speedOptions.classList.add("hidden");
    });
  });
  document.addEventListener("click", (e) => {
    if (!speedControl.contains(e.target)) {
      speedOptions.classList.add("hidden");
    }
  });
  volumeSlider.addEventListener("input", (e) =>
    setVolume(e.target.value)
  );
  volumeBtn.addEventListener("click", toggleMute);
  audioPlayer.addEventListener("play", () =>
    playPauseIcon.classList.replace("fa-play", "fa-pause")
  );
  audioPlayer.addEventListener("pause", () =>
    playPauseIcon.classList.replace("fa-pause", "fa-play")
  );
  audioPlayer.addEventListener("ended", () => {
    if (currentAudioFile)
      localStorage.removeItem(`audio-progress-${currentAudioFile.id}`);
  });
  audioPlayer.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audioPlayer.duration);
    const savedTime = localStorage.getItem(
      `audio-progress-${currentAudioFile.id}`
    );
    if (
      savedTime &&
      parseFloat(savedTime) > 5 &&
      parseFloat(savedTime) < audioPlayer.duration - 5
    ) {
      resumeTime.textContent = formatTime(parseFloat(savedTime));
      resumePrompt.classList.remove("hidden");
      resumePrompt.classList.add("flex");
    } else {
      audioPlayer.play();
    }
  });

  resumeContinueBtn.addEventListener("click", () => {
    const savedTime = localStorage.getItem(
      `audio-progress-${currentAudioFile.id}`
    );
    if (savedTime) audioPlayer.currentTime = parseFloat(savedTime);
    resumePrompt.classList.add("hidden");
    resumePrompt.classList.remove("flex");
    audioPlayer.play();
  });

  resumeRestartBtn.addEventListener("click", () => {
    audioPlayer.currentTime = 0;
    resumePrompt.classList.add("hidden");
    resumePrompt.classList.remove("flex");
    audioPlayer.play();
  });

  audioPlayer.addEventListener("timeupdate", () => {
    if (audioPlayer.duration) {
      timelineProgress.style.width = `${
        (audioPlayer.currentTime / audioPlayer.duration) * 100
      }%`;
      currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
      if (currentAudioFile) {
        localStorage.setItem(
          `audio-progress-${currentAudioFile.id}`,
          audioPlayer.currentTime
        );
      }
    }
  });

  let isScrubbing = false;
  timeline.addEventListener("mousedown", (e) => {
    isScrubbing = true;
    handleTimelineUpdate(e);
  });
  document.addEventListener("mousemove", (e) => {
    if (isScrubbing) handleTimelineUpdate(e);
  });
  document.addEventListener("mouseup", () => (isScrubbing = false));
  timeline.addEventListener("mousemove", (e) => {
    if (!isScrubbing && audioPlayer.duration) {
      const rect = timeline.getBoundingClientRect();
      const position = e.clientX - rect.left;
      seekTooltip.style.left = `${position}px`;
      seekTooltip.textContent = formatTime(
        (position / rect.width) * audioPlayer.duration
      );
      seekTooltip.style.display = "block";
    }
  });
  timeline.addEventListener(
    "mouseleave",
    () => (seekTooltip.style.display = "none")
  );

  audioList.addEventListener("click", async (e) => {
    const deleteBtn = e.target.closest(".delete-audio-btn");
    if (deleteBtn) {
      const audioId = parseInt(deleteBtn.dataset.id, 10);
      showConfirm(
        "Bạn có chắc chắn muốn xóa file âm thanh này không?",
        async () => {
          try {
            await deleteAudio(audioId);
            showToast("Đã xóa file thành công.", "success");
            renderLibrary();
          } catch (error) {
            console.error(error);
            showToast("Không thể xóa file.", "error");
          }
        }
      );
    }
  });

  // --- App Init ---
  async function main() {
    try {
      await initDB();
      renderLibrary();
      setVolume(localStorage.getItem("audio-volume") || 1);
    } catch (error) {
      console.error(error);
      document.body.innerHTML = `<div class="text-center text-red-400 p-4">Lỗi nghiêm trọng: Không thể khởi tạo. Vui lòng thử lại trong trình duyệt khác hoặc không dùng chế độ ẩn danh.</div>`;
    }
  }

  main();
});