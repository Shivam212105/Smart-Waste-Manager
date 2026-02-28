// DOM elements
const drop = document.getElementById("drop");
const fileInput = document.getElementById("image");
const form = document.getElementById("classifyForm");
const resultDiv = document.getElementById("result");

// Inline SVG icons (encoding-safe)
const icons = {
  leaf: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 14c6-6 10-6 16-8-2 6-2 10-8 16-3-3-5-5-8-8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  recycle: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 7l2.2-3.8a2 2 0 0 1 3.5 0L14 5M4 13l-1.5 2.6a2 2 0 0 0 .8 2.7L5 20M20 10l1.5 2.6a2 2 0 0 1-.8 2.7L19 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 4l2 3-3 .5M20 16l-3-1 .5 3M4 14l3 1-.5-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  plug: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2v4M10 2v4M4 8h8v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  warn: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l9 16H3l9-16Z" stroke="currentColor" stroke-width="2"/><path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  trash: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16M9 3h6l1 2H8l1-2Z" stroke="currentColor" stroke-width="2"/><path d="M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12" stroke="currentColor" stroke-width="2"/></svg>',
  bottle: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2h4v3l-1 1v2a3 3 0 0 0 1 2l1 1v8a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3v-8l1-1a3 3 0 0 0 1-2V6l-1-1V2Z" stroke="currentColor" stroke-width="2"/></svg>',
  can: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="2" width="10" height="20" rx="3" stroke="currentColor" stroke-width="2"/><path d="M7 7h10" stroke="currentColor" stroke-width="2"/></svg>',
  paper: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2"/><path d="M14 2v4h4" stroke="currentColor" stroke-width="2"/></svg>',
  help: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M9.5 9a2.5 2.5 0 1 1 4.3 2 3 3 0 0 0-1.3 2.5V14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>'
};

// Category styles
const categoryConfig = {
  organic:    { color: '#48bb78', icon: icons.leaf,    name: 'Organic' },
  recyclable: { color: '#4299e1', icon: icons.recycle, name: 'Recyclable' },
  hazardous:  { color: '#ed8936', icon: icons.warn,    name: 'Hazardous' },
  landfill:   { color: '#a0aec0', icon: icons.trash,   name: 'Landfill' },
  unsure:     { color: '#9f7aea', icon: icons.help,    name: 'Unsure' },
  plastic:    { color: '#4299e1', icon: icons.bottle,  name: 'Plastic' },
  metal:      { color: '#718096', icon: icons.can,     name: 'Metal' },
  paper:      { color: '#b7791f', icon: icons.paper,   name: 'Paper' },
  ewaste:     { color: '#ed8936', icon: icons.plug,    name: 'E‑waste' }
};

// File drop functionality
drop.addEventListener("click", () => fileInput.click());

drop.addEventListener("dragover", e => {
  e.preventDefault();
  drop.classList.add("hover");
});

drop.addEventListener("dragleave", () => {
  drop.classList.remove("hover");
});

drop.addEventListener("drop", e => {
  e.preventDefault();
  drop.classList.remove("hover");
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    updateDropZone();
  }
});

fileInput.addEventListener("change", updateDropZone);

function updateDropZone() {
  const file = fileInput.files[0];
  if (file) {
    drop.classList.add("has-file");
    drop.innerHTML = `📄 ${file.name}<br><small>Click to change</small>`;
  } else {
    drop.classList.remove("has-file");
    drop.innerHTML = "Drag & drop an image here or click to choose";
  }
}

// Form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Show loading state
  showLoading();
  
  try {
    const formData = new FormData(form);
    const response = await fetch("/classify", {
      method: "POST",
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showError(data.error || data.message || "Something went wrong");
      return;
    }
    
    showResult(data);
  } catch (error) {
    showError("Network error. Please try again.");
  }
});

function showLoading() {
  resultDiv.className = "result-card";
  resultDiv.innerHTML = `
    <div class="loading">
      Analyzing your waste item...
    </div>
  `;
  resultDiv.classList.remove("hidden");
}

function showError(message) {
  resultDiv.className = "result-card";
  resultDiv.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
      <h3 style="color: #e53e3e; margin-bottom: 1rem;">Error</h3>
      <p style="color: #666;">${message}</p>
    </div>
  `;
}

function showResult(data) {
  const config = categoryConfig[data.category] || categoryConfig.unsure;
  const confidence = Math.round((data.confidence || 0) * 100);
  const city = (document.getElementById('city')?.value || '').trim();
  
  // Create tips HTML
  const tipsList = (data.tips || []);
  const tipsHtml = (tipsList.length ? tipsList : ["No specific tips available. Check your local city guidelines."])
    .map(tip => `<div class="tip">${tip}</div>`)
    .join('');
  
  // Create mode badge
  const modeBadge = getModeBadge(data.mode);
  
  resultDiv.className = "result-card";
  resultDiv.innerHTML = `
    <div class="result-header">
      <div class="category-badge" style="background: ${config.color}; display:flex; align-items:center; gap:.5rem;">
        <span style="display:inline-flex; color:#fff;">${config.icon}</span>
        ${config.name}
      </div>
      <div class="confidence-bar">
        <div class="confidence-fill" style="width: ${confidence}%; background: ${config.color};"></div>
      </div>
      <div class="confidence-text" style="color: ${config.color};">
        ${confidence}%
      </div>
    </div>

    <div class="result-grid">
      <div>
        <div class="summary-card">
          <h3>This item belongs in: <span style="color:${config.color}">${config.name}</span></h3>
          <div class="summary-sub">Classification based on ${modeLabel(data.mode)} analysis${city ? ` for <strong>${escapeHtml(city)}</strong>` : ''}.</div>
          <div class="bin-card">
            <div class="bin-icon" style="background:${config.color}">${icons.trash}</div>
            <div>
              <div class="bin-text">Dispose in the <span style="color:${config.color}">${config.name}</span> stream/bin</div>
              <div class="bin-desc">Keep it clean and separate to avoid contamination.</div>
            </div>
          </div>
          <div class="meta-chips">
            ${chip(modeBadge)}
            ${city ? chip(`<span>City: ${escapeHtml(city)}</span>`) : ''}
          </div>
        </div>
      </div>

      <div>
        <div class="tips-section">
          <div class="tips-title">Disposal Tips</div>
          <div class="tips-grid">
            ${tipsHtml}
          </div>
        </div>
      </div>
    </div>

    <div class="feedback-section">
      <div class="feedback-title">Was this classification correct?</div>
      <div class="feedback-buttons">
        <button class="feedback-btn yes" onclick="sendFeedback(true, '${data.category}')">Yes, correct</button>
        <button class="feedback-btn no" onclick="sendFeedback(false, '${data.category}')">No, wrong</button>
      </div>
    </div>
  `;

  // Animate confidence bar
  setTimeout(() => {
    const bar = resultDiv.querySelector('.confidence-fill');
    if (bar) {
      bar.style.width = '0%';
      setTimeout(() => {
        bar.style.width = `${confidence}%`;
      }, 100);
    }
  }, 200);
}

function getModeBadge(mode) {
  const badges = {
    image: 'Image Analysis',
    text: 'Text Analysis',
    text_fallback: 'Text Fallback',
    image_then_text: 'Combined',
    image_uncertain: 'Uncertain'
  };
  const label = badges[mode] || 'Analysis';
  return `<span>${label}</span>`;
}

function modeLabel(mode){
  const map = { image: 'image', text: 'text', text_fallback: 'text (fallback)', image_then_text: 'image + text', image_uncertain: 'image (uncertain)' };
  return map[mode] || 'analysis';
}

function chip(innerHtml){
  return `<span class="chip">${innerHtml}</span>`;
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
}

async function sendFeedback(isCorrect, predictedCategory) {
  let correctLabel = predictedCategory;
  
  if (!isCorrect) {
    const correct = prompt(
`What is the correct category?

Options:
• organic
• recyclable
• hazardous
• landfill
• plastic
• metal
• paper
• ewaste
• unsure`
    );
    if (!correct) return;
    correctLabel = correct.toLowerCase();
  }
  
  try {
    const payload = {
      input_type: fileInput.files[0] ? "image" : "text",
      user_text: document.getElementById("text").value,
      predicted: predictedCategory,
      correct_label: correctLabel,
      city: document.getElementById("city").value || "chennai",
      notes: ""
    };
    
    await fetch("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    // Show thank you message
    const feedbackSection = document.querySelector('.feedback-section');
    if (feedbackSection) {
      feedbackSection.innerHTML = `
        <div style="text-align: center; padding: 1rem; background: #d4edda; color: #155724; border-radius: 8px;">Thank you for your feedback!</div>
      `;
    }
  } catch (error) {
    alert("Failed to send feedback. Please try again.");
  }
}

