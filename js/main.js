const glow = document.querySelector(".cursor-glow");

if (glow) {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  const update = () => {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(update);
  };

  update();

  window.addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  });

  window.addEventListener("touchstart", () => {
    glow.style.display = "none";
  });
}
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  });
}

if ("caches" in window) {
  window.addEventListener("load", () => {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        caches.delete(key);
      });
    });
  });
}

const ytInput = document.getElementById("yt-input");
const ytFetchButton = document.getElementById("yt-fetch");
const localFileInput = document.getElementById("local-file");
const localTranscribeButton = document.getElementById("local-transcribe");
const transcriptOutput = document.getElementById("transcript-output");
const copyButton = document.getElementById("copy-transcript");
const downloadButton = document.getElementById("download-transcript");
const statusMessage = document.getElementById("transcript-status");
const ytDownloadInput = document.getElementById("yt-download-input");
const ytFormat = document.getElementById("yt-format");
const ytDownloadButton = document.getElementById("yt-download");
const downloadStatus = document.getElementById("download-status");
const imageInput = document.getElementById("image-input");
const imageStage = document.getElementById("image-stage");
const imagePreview = document.getElementById("image-preview");
const cropSelection = document.getElementById("crop-selection");
const cropMaskTop = document.querySelector(".crop-mask-top");
const cropMaskRight = document.querySelector(".crop-mask-right");
const cropMaskBottom = document.querySelector(".crop-mask-bottom");
const cropMaskLeft = document.querySelector(".crop-mask-left");
const resizeWidthInput = document.getElementById("resize-width");
const resizeHeightInput = document.getElementById("resize-height");
const resizeLock = document.getElementById("resize-lock");
const cropToggle = document.getElementById("crop-toggle");
const cropRatio = document.getElementById("crop-ratio");
const outputFormat = document.getElementById("output-format");
const outputQuality = document.getElementById("output-quality");
const qualityValue = document.getElementById("quality-value");
const imageDownload = document.getElementById("image-download");
const imageReset = document.getElementById("image-reset");
const imageStatus = document.getElementById("image-status");
const authTabs = document.querySelectorAll(".auth-tab");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const registerEmail = document.getElementById("register-email");
const registerPassword = document.getElementById("register-password");
const registerConfirm = document.getElementById("register-confirm");
const authStatus = document.getElementById("auth-status");
const authUser = document.getElementById("auth-user");
const logoutButton = document.getElementById("logout-button");

const SOURCE_LIST = [
  (id) => `https://youtubetranscript.com/?format=json&video_id=${id}`,
  (id) => `https://r.jina.ai/http://youtubetranscript.com/?format=json&video_id=${id}`,
];

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAO5pSel9ZJ4pOD5sGnAmNCHHAYbyObhBU",
  authDomain: "nicksonc-4b18c.firebaseapp.com",
  projectId: "nicksonc-4b18c",
  storageBucket: "nicksonc-4b18c.firebasestorage.app",
  messagingSenderId: "140532725537",
  appId: "1:140532725537:web:7f8b8afae5adceac58b060",
  measurementId: "G-YLRR56HBHY",
};

const setStatus = (message, state) => {
  if (!statusMessage) {
    return;
  }
  statusMessage.textContent = message;
  if (state) {
    statusMessage.dataset.state = state;
  } else {
    delete statusMessage.dataset.state;
  }
};

const setScopedStatus = (element, message, state) => {
  if (!element) {
    return;
  }
  element.textContent = message;
  if (state) {
    element.dataset.state = state;
  } else {
    delete element.dataset.state;
  }
};

const hasFirebaseConfig = () =>
  Object.values(FIREBASE_CONFIG).every(
    (value) => value && !String(value).startsWith("YOUR_")
  );

const setAuthStatus = (message, state) => {
  setScopedStatus(authStatus, message, state);
};

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

const setBusy = (isBusy) => {
  if (ytFetchButton) {
    ytFetchButton.disabled = isBusy;
  }
  if (localTranscribeButton) {
    localTranscribeButton.disabled = isBusy;
  }
};

const setAuthBusy = (isBusy) => {
  if (loginForm) {
    const button = loginForm.querySelector("button[type='submit']");
    if (button) {
      button.disabled = isBusy;
    }
  }
  if (registerForm) {
    const button = registerForm.querySelector("button[type='submit']");
    if (button) {
      button.disabled = isBusy;
    }
  }
};

const updateOutputActions = () => {
  const hasText = transcriptOutput && transcriptOutput.value.trim().length > 0;
  if (copyButton) {
    copyButton.disabled = !hasText;
  }
  if (downloadButton) {
    downloadButton.disabled = !hasText;
  }
};

const extractYouTubeId = (value) => {
  if (!value) {
    return "";
  }
  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "").slice(0, 11);
    }
    const idParam = url.searchParams.get("v");
    if (idParam) {
      return idParam;
    }
    const match = url.pathname.match(/\/(shorts|embed)\/([a-zA-Z0-9_-]{11})/);
    if (match) {
      return match[2];
    }
  } catch (error) {
    return "";
  }
  return "";
};

const normalizeTranscript = (items) =>
  items
    .map((item) => item.text || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const parseJsonFromText = (rawText) => {
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const listStart = trimmed.indexOf("[");
    const listEnd = trimmed.lastIndexOf("]");
    if (listStart !== -1 && listEnd !== -1 && listEnd > listStart) {
      try {
        return JSON.parse(trimmed.slice(listStart, listEnd + 1));
      } catch (parseError) {
        // Fall through to object parsing.
      }
    }
    const objStart = trimmed.indexOf("{");
    const objEnd = trimmed.lastIndexOf("}");
    if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
      try {
        return JSON.parse(trimmed.slice(objStart, objEnd + 1));
      } catch (parseError) {
        return null;
      }
    }
  }
  return null;
};

const parseTranscriptPayload = (rawText) => {
  const payload = parseJsonFromText(rawText);
  if (!payload) {
    return null;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.transcript)) {
    return payload.transcript;
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  if (Array.isArray(payload.items)) {
    return payload.items;
  }
  return null;
};

const proxyUrl = (url) => {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return `https://r.jina.ai/${url}`;
  }
  return url;
};

const extractJsonArrayByKey = (rawText, key) => {
  const keyIndex = rawText.indexOf(`"${key}"`);
  if (keyIndex === -1) {
    return null;
  }
  const arrayStart = rawText.indexOf("[", keyIndex);
  if (arrayStart === -1) {
    return null;
  }
  let depth = 0;
  for (let i = arrayStart; i < rawText.length; i += 1) {
    const char = rawText[i];
    if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return rawText.slice(arrayStart, i + 1);
      }
    }
  }
  return null;
};

const pickCaptionTrack = (tracks) => {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return null;
  }
  const sorted = [...tracks].sort((a, b) => {
    const aEn = a.languageCode && a.languageCode.startsWith("en") ? 0 : 1;
    const bEn = b.languageCode && b.languageCode.startsWith("en") ? 0 : 1;
    if (aEn !== bEn) {
      return aEn - bEn;
    }
    const aAuto = a.kind === "asr" ? 1 : 0;
    const bAuto = b.kind === "asr" ? 1 : 0;
    return aAuto - bAuto;
  });
  return sorted[0];
};

const normalizeCaptionEvents = (events) =>
  events
    .map((event) => (event.segs || []).map((seg) => seg.utf8).join(""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const fetchYouTubeTranscriptFromCaptions = async (videoId) => {
  const pageResponse = await fetch(
    proxyUrl(`https://www.youtube.com/watch?v=${videoId}`)
  );
  if (!pageResponse.ok) {
    throw new Error(`Request failed (${pageResponse.status})`);
  }
  const pageText = await pageResponse.text();
  const tracksJson = extractJsonArrayByKey(pageText, "captionTracks");
  if (!tracksJson) {
    throw new Error("Caption tracks unavailable.");
  }
  let tracks;
  try {
    tracks = JSON.parse(tracksJson);
  } catch (error) {
    throw new Error("Caption tracks parse failed.");
  }
  const track = pickCaptionTrack(tracks);
  if (!track || !track.baseUrl) {
    throw new Error("Caption track missing.");
  }
  const captionUrl = new URL(track.baseUrl);
  if (!captionUrl.searchParams.get("fmt")) {
    captionUrl.searchParams.set("fmt", "json3");
  }
  const captionResponse = await fetch(proxyUrl(captionUrl.toString()));
  if (!captionResponse.ok) {
    throw new Error(`Request failed (${captionResponse.status})`);
  }
  const captionText = await captionResponse.text();
  const captionPayload = parseJsonFromText(captionText);
  if (!captionPayload || !Array.isArray(captionPayload.events)) {
    throw new Error("Caption format unsupported.");
  }
  const transcript = normalizeCaptionEvents(captionPayload.events);
  if (!transcript) {
    throw new Error("Transcript is empty.");
  }
  return transcript;
};

const fetchYouTubeTranscript = async (videoId) => {
  let lastError;
  for (const source of SOURCE_LIST) {
    try {
      const response = await fetch(source(videoId));
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const text = await response.text();
      const parsed = parseTranscriptPayload(text);
      if (!Array.isArray(parsed)) {
        throw new Error("Unexpected transcript format.");
      }
      const transcript = normalizeTranscript(parsed);
      if (!transcript) {
        throw new Error("Transcript is empty.");
      }
      return transcript;
    } catch (error) {
      lastError = error;
    }
  }
  try {
    return await fetchYouTubeTranscriptFromCaptions(videoId);
  } catch (error) {
    lastError = error;
  }
  throw lastError || new Error("Transcript unavailable.");
};

let transcriberPromise;

const getTranscriber = async () => {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      const { pipeline, env } = await import(
        "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.0"
      );
      env.allowLocalModels = false;
      return pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-tiny.en"
      );
    })();
  }
  return transcriberPromise;
};

const resolveTranscriptText = (result) => {
  if (!result) {
    return "";
  }
  if (typeof result === "string") {
    return result;
  }
  if (typeof result.text === "string") {
    return result.text;
  }
  return "";
};

const transcribeLocalFile = async (file) => {
  const transcriber = await getTranscriber();
  const objectUrl = URL.createObjectURL(file);
  try {
    const result = await transcriber(objectUrl, {
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    return resolveTranscriptText(result);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const initTranscriptTool = () => {
  if (!ytFetchButton || !localTranscribeButton || !transcriptOutput) {
    return;
  }

  updateOutputActions();

  ytFetchButton.addEventListener("click", async () => {
    const videoId = extractYouTubeId(ytInput ? ytInput.value : "");
    if (!videoId) {
      setStatus("Enter a valid YouTube URL or ID.", "error");
      return;
    }
    setBusy(true);
    setStatus("Fetching transcript from YouTube...", "");
    try {
      const transcript = await fetchYouTubeTranscript(videoId);
      transcriptOutput.value = transcript;
      updateOutputActions();
      setStatus("Transcript ready.", "success");
    } catch (error) {
      setStatus(
        "Transcript failed. Video may have no captions or the request was blocked.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  });

  localTranscribeButton.addEventListener("click", async () => {
    const file = localFileInput ? localFileInput.files[0] : null;
    if (!file) {
      setStatus("Choose a local audio or video file first.", "error");
      return;
    }
    setBusy(true);
    setStatus("Loading transcription model...", "");
    try {
      const transcript = await transcribeLocalFile(file);
      if (!transcript) {
        throw new Error("Empty transcript");
      }
      transcriptOutput.value = transcript.trim();
      updateOutputActions();
      setStatus("Transcription complete.", "success");
    } catch (error) {
      setStatus(
        "Local transcription failed. Try a shorter clip or reload and try again.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  });

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const text = transcriptOutput.value.trim();
      if (!text) {
        setStatus("Nothing to copy yet.", "error");
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        setStatus("Copied to clipboard.", "success");
      } catch (error) {
        transcriptOutput.focus();
        transcriptOutput.select();
        const ok = document.execCommand("copy");
        setStatus(ok ? "Copied to clipboard." : "Copy failed.", ok ? "success" : "error");
      }
    });
  }

  if (downloadButton) {
    downloadButton.addEventListener("click", () => {
      const text = transcriptOutput.value.trim();
      if (!text) {
        setStatus("Nothing to download yet.", "error");
        return;
      }
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transcript.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("Downloaded transcript.txt.", "success");
    });
  }
};

initTranscriptTool();

const initDownloadTool = () => {
  if (!ytDownloadButton) {
    return;
  }
  ytDownloadButton.addEventListener("click", () => {
    const videoId = extractYouTubeId(ytDownloadInput ? ytDownloadInput.value : "");
    if (!videoId) {
      setScopedStatus(downloadStatus, "Enter a valid YouTube URL or ID.", "error");
      return;
    }
    const formatLabel = ytFormat ? ytFormat.value : "mp4-720";
    setScopedStatus(
      downloadStatus,
      `Format ${formatLabel.toUpperCase()} selected. Backend required to process downloads.`,
      "error"
    );
  });
};

initDownloadTool();

const initImageTool = () => {
  if (
    !imageInput ||
    !imageStage ||
    !imagePreview ||
    !resizeWidthInput ||
    !resizeHeightInput ||
    !outputFormat ||
    !outputQuality
  ) {
    return;
  }

  const MIN_CROP_SIZE = 40;
  let imageLoaded = false;
  let imageAspectRatio = 1;
  let cropRect = null;
  let dragState = null;
  let stageSize = { width: 0, height: 0 };

  const updateStageSize = () => {
    const width = imagePreview.clientWidth;
    const height = imagePreview.clientHeight;
    if (!width || !height) {
      return;
    }
    if (cropRect && stageSize.width && stageSize.height) {
      const scaleX = width / stageSize.width;
      const scaleY = height / stageSize.height;
      cropRect = {
        x: cropRect.x * scaleX,
        y: cropRect.y * scaleY,
        width: cropRect.width * scaleX,
        height: cropRect.height * scaleY,
      };
    }
    stageSize = { width, height };
    updateCropUI();
  };

  const getCropRatioValue = () => {
    if (!cropRatio) {
      return null;
    }
    const value = cropRatio.value;
    if (value === "free") {
      return null;
    }
    const ratio = Number.parseFloat(value);
    return Number.isFinite(ratio) ? ratio : null;
  };

  const setResizeInputs = (width, height) => {
    resizeWidthInput.value = width ? Math.round(width) : "";
    resizeHeightInput.value = height ? Math.round(height) : "";
  };

  const updateResizeRatio = () => {
    if (cropToggle && cropToggle.checked && cropRect) {
      imageAspectRatio = cropRect.width / cropRect.height;
      return;
    }
    imageAspectRatio = imagePreview.naturalWidth / imagePreview.naturalHeight;
  };

  const getCropAreaNatural = () => {
    if (!imageLoaded) {
      return null;
    }
    if (!cropToggle || !cropToggle.checked || !cropRect) {
      return {
        x: 0,
        y: 0,
        width: imagePreview.naturalWidth,
        height: imagePreview.naturalHeight,
      };
    }
    if (!stageSize.width || !stageSize.height) {
      return null;
    }
    const scaleX = imagePreview.naturalWidth / stageSize.width;
    const scaleY = imagePreview.naturalHeight / stageSize.height;
    return {
      x: Math.round(cropRect.x * scaleX),
      y: Math.round(cropRect.y * scaleY),
      width: Math.round(cropRect.width * scaleX),
      height: Math.round(cropRect.height * scaleY),
    };
  };

  const setCropRect = (rect) => {
    if (!rect || !stageSize.width || !stageSize.height) {
      cropRect = null;
      updateCropUI();
      return;
    }
    const width = clampValue(rect.width, MIN_CROP_SIZE, stageSize.width);
    const height = clampValue(rect.height, MIN_CROP_SIZE, stageSize.height);
    const x = clampValue(rect.x, 0, stageSize.width - width);
    const y = clampValue(rect.y, 0, stageSize.height - height);
    cropRect = { x, y, width, height };
    updateResizeRatio();
    updateCropUI();
  };

  const setCenteredCrop = (ratio) => {
    if (!stageSize.width || !stageSize.height) {
      return;
    }
    let width = stageSize.width;
    let height = stageSize.height;
    if (ratio) {
      if (width / height > ratio) {
        width = height * ratio;
      } else {
        height = width / ratio;
      }
    }
    setCropRect({
      x: (stageSize.width - width) / 2,
      y: (stageSize.height - height) / 2,
      width,
      height,
    });
  };

  const updateCropUI = () => {
    const showCrop = cropToggle && cropToggle.checked && cropRect;
    if (!showCrop) {
      cropSelection.style.display = "none";
      cropMaskTop.style.display = "none";
      cropMaskRight.style.display = "none";
      cropMaskBottom.style.display = "none";
      cropMaskLeft.style.display = "none";
      return;
    }

    cropSelection.style.display = "block";
    cropSelection.style.left = `${cropRect.x}px`;
    cropSelection.style.top = `${cropRect.y}px`;
    cropSelection.style.width = `${cropRect.width}px`;
    cropSelection.style.height = `${cropRect.height}px`;

    cropMaskTop.style.display = "block";
    cropMaskRight.style.display = "block";
    cropMaskBottom.style.display = "block";
    cropMaskLeft.style.display = "block";

    cropMaskTop.style.left = "0px";
    cropMaskTop.style.top = "0px";
    cropMaskTop.style.width = `${stageSize.width}px`;
    cropMaskTop.style.height = `${cropRect.y}px`;

    cropMaskBottom.style.left = "0px";
    cropMaskBottom.style.top = `${cropRect.y + cropRect.height}px`;
    cropMaskBottom.style.width = `${stageSize.width}px`;
    cropMaskBottom.style.height = `${stageSize.height - (cropRect.y + cropRect.height)}px`;

    cropMaskLeft.style.left = "0px";
    cropMaskLeft.style.top = `${cropRect.y}px`;
    cropMaskLeft.style.width = `${cropRect.x}px`;
    cropMaskLeft.style.height = `${cropRect.height}px`;

    cropMaskRight.style.left = `${cropRect.x + cropRect.width}px`;
    cropMaskRight.style.top = `${cropRect.y}px`;
    cropMaskRight.style.width = `${stageSize.width - (cropRect.x + cropRect.width)}px`;
    cropMaskRight.style.height = `${cropRect.height}px`;
  };

  const updateQualityLabel = () => {
    if (!qualityValue) {
      return;
    }
    qualityValue.textContent = `${outputQuality.value}%`;
  };

  const updateQualityState = () => {
    if (!outputQuality) {
      return;
    }
    const isPng = outputFormat.value === "image/png";
    outputQuality.disabled = isPng;
    updateQualityLabel();
  };

  const resetTool = () => {
    if (!imageLoaded) {
      return;
    }
    setResizeInputs(imagePreview.naturalWidth, imagePreview.naturalHeight);
    if (cropToggle) {
      cropToggle.checked = false;
    }
    cropRect = null;
    updateResizeRatio();
    updateCropUI();
    setScopedStatus(imageStatus, "Reset to original image.", "success");
  };

  const updateResizeFromInput = (source) => {
    if (!resizeLock || !resizeLock.checked) {
      return;
    }
    if (!imageLoaded) {
      return;
    }
    const widthValue = Number.parseInt(resizeWidthInput.value, 10);
    const heightValue = Number.parseInt(resizeHeightInput.value, 10);
    if (source === "width" && Number.isFinite(widthValue)) {
      resizeHeightInput.value = Math.round(widthValue / imageAspectRatio);
    }
    if (source === "height" && Number.isFinite(heightValue)) {
      resizeWidthInput.value = Math.round(heightValue * imageAspectRatio);
    }
  };

  const handlePointerDown = (event) => {
    if (!imageLoaded || !cropToggle || !cropToggle.checked) {
      return;
    }
    const rect = imageStage.getBoundingClientRect();
    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;
    if (cropRect && event.target === cropSelection) {
      dragState = {
        mode: "move",
        offsetX: startX - cropRect.x,
        offsetY: startY - cropRect.y,
      };
    } else {
      dragState = {
        mode: "new",
        startX,
        startY,
        ratio: getCropRatioValue(),
      };
      setCropRect({ x: startX, y: startY, width: MIN_CROP_SIZE, height: MIN_CROP_SIZE });
    }
    imageStage.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragState || !stageSize.width || !stageSize.height) {
      return;
    }
    const rect = imageStage.getBoundingClientRect();
    const currentX = clampValue(event.clientX - rect.left, 0, stageSize.width);
    const currentY = clampValue(event.clientY - rect.top, 0, stageSize.height);

    if (dragState.mode === "move" && cropRect) {
      const newX = clampValue(
        currentX - dragState.offsetX,
        0,
        stageSize.width - cropRect.width
      );
      const newY = clampValue(
        currentY - dragState.offsetY,
        0,
        stageSize.height - cropRect.height
      );
      setCropRect({ ...cropRect, x: newX, y: newY });
      return;
    }

    if (dragState.mode === "new") {
      let width = Math.abs(currentX - dragState.startX);
      let height = Math.abs(currentY - dragState.startY);
      const ratio = dragState.ratio;
      if (ratio) {
        if (width / height > ratio) {
          width = height * ratio;
        } else {
          height = width / ratio;
        }
      }
      width = clampValue(width, MIN_CROP_SIZE, stageSize.width);
      height = clampValue(height, MIN_CROP_SIZE, stageSize.height);
      const x = currentX < dragState.startX ? dragState.startX - width : dragState.startX;
      const y = currentY < dragState.startY ? dragState.startY - height : dragState.startY;
      setCropRect({ x, y, width, height });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragState) {
      return;
    }
    dragState = null;
    imageStage.releasePointerCapture(event.pointerId);
  };

  imageInput.addEventListener("change", () => {
    const file = imageInput.files && imageInput.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  imagePreview.addEventListener("load", () => {
    imageLoaded = true;
    imageStage.dataset.empty = "false";
    setResizeInputs(imagePreview.naturalWidth, imagePreview.naturalHeight);
    updateResizeRatio();
    updateStageSize();
    updateQualityState();
    setScopedStatus(imageStatus, "Image loaded.", "success");
  });

  window.addEventListener("resize", () => {
    if (imageLoaded) {
      updateStageSize();
    }
  });

  if (resizeWidthInput) {
    resizeWidthInput.addEventListener("input", () => updateResizeFromInput("width"));
  }

  if (resizeHeightInput) {
    resizeHeightInput.addEventListener("input", () => updateResizeFromInput("height"));
  }

  if (cropToggle) {
    cropToggle.addEventListener("change", () => {
      if (!cropToggle.checked) {
        cropRect = null;
        updateResizeRatio();
        updateCropUI();
        return;
      }
      updateStageSize();
      setCenteredCrop(getCropRatioValue());
      updateResizeRatio();
      const cropArea = getCropAreaNatural();
      if (cropArea) {
        setResizeInputs(cropArea.width, cropArea.height);
      }
    });
  }

  if (cropRatio) {
    cropRatio.addEventListener("change", () => {
      if (cropToggle && cropToggle.checked) {
        setCenteredCrop(getCropRatioValue());
      }
    });
  }

  if (outputFormat) {
    outputFormat.addEventListener("change", updateQualityState);
  }

  if (outputQuality) {
    outputQuality.addEventListener("input", updateQualityLabel);
  }

  if (imageReset) {
    imageReset.addEventListener("click", resetTool);
  }

  if (imageStage) {
    imageStage.addEventListener("pointerdown", handlePointerDown);
    imageStage.addEventListener("pointermove", handlePointerMove);
    imageStage.addEventListener("pointerup", handlePointerUp);
    imageStage.addEventListener("pointerleave", handlePointerUp);
  }

  if (imageDownload) {
    imageDownload.addEventListener("click", () => {
      if (!imageLoaded) {
        setScopedStatus(imageStatus, "Upload an image first.", "error");
        return;
      }
      const cropArea = getCropAreaNatural();
      if (!cropArea) {
        setScopedStatus(imageStatus, "Crop area not ready.", "error");
        return;
      }
      let targetWidth = Number.parseInt(resizeWidthInput.value, 10);
      let targetHeight = Number.parseInt(resizeHeightInput.value, 10);
      const ratio = cropArea.width / cropArea.height;

      if (!Number.isFinite(targetWidth) && !Number.isFinite(targetHeight)) {
        targetWidth = cropArea.width;
        targetHeight = cropArea.height;
      } else if (resizeLock && resizeLock.checked) {
        if (Number.isFinite(targetWidth) && !Number.isFinite(targetHeight)) {
          targetHeight = Math.round(targetWidth / ratio);
        }
        if (Number.isFinite(targetHeight) && !Number.isFinite(targetWidth)) {
          targetWidth = Math.round(targetHeight * ratio);
        }
      }

      if (!Number.isFinite(targetWidth)) {
        targetWidth = cropArea.width;
      }
      if (!Number.isFinite(targetHeight)) {
        targetHeight = cropArea.height;
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(targetWidth));
      canvas.height = Math.max(1, Math.round(targetHeight));
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        imagePreview,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const format = outputFormat.value;
      const quality = Number.parseInt(outputQuality.value, 10) / 100;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setScopedStatus(imageStatus, "Download failed.", "error");
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const extension = format === "image/jpeg" ? "jpg" : format.split("/")[1];
          link.download = `image-${canvas.width}x${canvas.height}.${extension}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          setScopedStatus(imageStatus, "Download ready.", "success");
        },
        format,
        format === "image/png" ? undefined : quality
      );
    });
  }
};

initImageTool();

const initAuth = async () => {
  const hasLogin = Boolean(loginForm);
  const hasRegister = Boolean(registerForm);
  if (!hasLogin && !hasRegister) {
    return;
  }
  const hasTabs = authTabs.length > 0;
  const defaultMode = hasLogin ? "login" : "register";

  const setActiveForm = (mode) => {
    if (hasTabs) {
      authTabs.forEach((tab) => {
        const isActive = tab.dataset.auth === mode;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
      });
    }
    if (loginForm) {
      const showLogin = mode === "login" || (!hasTabs && !hasRegister);
      loginForm.classList.toggle("is-active", showLogin);
    }
    if (registerForm) {
      registerForm.classList.toggle("is-active", mode === "register");
    }
  };

  const setLoggedOutState = () => {
    if (authUser) {
      authUser.textContent = "";
    }
    if (logoutButton) {
      logoutButton.style.display = "none";
    }
    setActiveForm(defaultMode);
  };

  const setLoggedInState = (user) => {
    if (authUser) {
      authUser.textContent = `Signed in as ${user.email || "user"}`;
    }
    if (logoutButton) {
      logoutButton.style.display = "inline-flex";
    }
    if (loginForm) {
      loginForm.classList.remove("is-active");
    }
    if (registerForm) {
      registerForm.classList.remove("is-active");
    }
  };

  if (hasTabs) {
    authTabs.forEach((tab) => {
      tab.addEventListener("click", () => setActiveForm(tab.dataset.auth));
    });
  }

  setLoggedOutState();

  if (!hasFirebaseConfig()) {
    setAuthStatus("Add Firebase config in js/main.js to enable login.", "error");
    setAuthBusy(true);
    return;
  }

  try {
    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
    );
    const {
      getAuth,
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      onAuthStateChanged,
      signOut,
      setPersistence,
      browserLocalPersistence,
    } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
    );

    const app = initializeApp(FIREBASE_CONFIG);
    const auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);

    const formatAuthError = (error) => {
      if (!error || !error.code) {
        return "Authentication failed. Try again.";
      }
      switch (error.code) {
        case "auth/email-already-in-use":
          return "Email already in use.";
        case "auth/invalid-email":
          return "Enter a valid email address.";
        case "auth/weak-password":
          return "Password should be at least 6 characters.";
        case "auth/user-not-found":
        case "auth/wrong-password":
          return "Incorrect email or password.";
        default:
          return "Authentication failed. Try again.";
      }
    };

    if (loginForm) {
      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!loginEmail || !loginPassword) {
          return;
        }
        setAuthBusy(true);
        setAuthStatus("Signing in...", "");
        try {
          await signInWithEmailAndPassword(
            auth,
            loginEmail.value.trim(),
            loginPassword.value
          );
          setAuthStatus("Signed in successfully.", "success");
        } catch (error) {
          setAuthStatus(formatAuthError(error), "error");
        } finally {
          setAuthBusy(false);
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!registerEmail || !registerPassword || !registerConfirm) {
          return;
        }
        if (registerPassword.value !== registerConfirm.value) {
          setAuthStatus("Passwords do not match.", "error");
          return;
        }
        setAuthBusy(true);
        setAuthStatus("Creating account...", "");
        try {
          await createUserWithEmailAndPassword(
            auth,
            registerEmail.value.trim(),
            registerPassword.value
          );
          setAuthStatus("Account created.", "success");
        } catch (error) {
          setAuthStatus(formatAuthError(error), "error");
        } finally {
          setAuthBusy(false);
        }
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener("click", async () => {
        setAuthBusy(true);
        try {
          await signOut(auth);
          setAuthStatus("Signed out.", "success");
        } catch (error) {
          setAuthStatus("Sign out failed.", "error");
        } finally {
          setAuthBusy(false);
        }
      });
    }

    onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedInState(user);
      } else {
        setLoggedOutState();
      }
    });
  } catch (error) {
    setAuthStatus("Auth failed to load. Check your connection.", "error");
  }
};

initAuth();

const initParallax = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  if (window.matchMedia("(max-width: 700px)").matches) {
    return;
  }
  const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));
  if (parallaxItems.length === 0) {
    return;
  }
  let ticking = false;

  const updateParallax = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    document.documentElement.style.setProperty("--scroll-y", `${scrollY}px`);
    parallaxItems.forEach((item) => {
      const speed = Number.parseFloat(item.dataset.parallax) || 0;
      const offset = scrollY * speed * -1;
      item.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateParallax);
    }
  };

  updateParallax();
  window.addEventListener("scroll", onScroll, { passive: true });
};

initParallax();

const initRevealOnScroll = () => {
  const revealItems = document.querySelectorAll(
    ".hero-copy, .hero-panel, .about-card, .section-head, .card, .utility-card, .now-list, .cta-card, .auth-card"
  );
  if (revealItems.length === 0) {
    return;
  }

  revealItems.forEach((item) => item.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
};

initRevealOnScroll();
