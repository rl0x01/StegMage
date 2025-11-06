// StegMage Frontend JavaScript

let currentAnalysisId = null;
let pollInterval = null;

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const progressSection = document.getElementById('progress-section');
const resultsSection = document.getElementById('results-section');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const newAnalysisBtn = document.getElementById('new-analysis-btn');
const toggleAdvancedBtn = document.getElementById('toggle-advanced');
const advancedSection = document.getElementById('advanced-section');
const steghidePasswordsInput = document.getElementById('steghide-passwords');

// Toggle Advanced Options
toggleAdvancedBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (advancedSection.style.display === 'none') {
        advancedSection.style.display = 'block';
        toggleAdvancedBtn.textContent = '⚙️ Hide Advanced Options';
    } else {
        advancedSection.style.display = 'none';
        toggleAdvancedBtn.textContent = '⚙️ Advanced Options';
    }
});

// Upload Area Click Handler
uploadArea.addEventListener('click', () => fileInput.click());
browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

// File Input Change
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file);
    }
});

// Drag and Drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        uploadFile(file);
    } else {
        alert('Please upload an image file');
    }
});

// Upload File
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    // Get custom steghide passwords
    const passwordsText = steghidePasswordsInput.value.trim();
    if (passwordsText) {
        const passwords = passwordsText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
        formData.append('steghide_passwords', JSON.stringify(passwords));
    }

    // Show progress section
    uploadSection.style.display = 'none';
    progressSection.style.display = 'block';
    resultsSection.style.display = 'none';

    try {
        progressText.textContent = 'Uploading file...';
        progressFill.style.width = '10%';

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            currentAnalysisId = data.analysis_id;
            progressText.textContent = 'Analysis started...';
            progressFill.style.width = '20%';
            startPolling();
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (error) {
        alert('Error: ' + error.message);
        resetUI();
    }
}

// Start Polling for Status
function startPolling() {
    pollInterval = setInterval(checkStatus, 2000);
}

// Check Analysis Status
async function checkStatus() {
    try {
        const response = await fetch(`/api/status/${currentAnalysisId}`);
        const data = await response.json();

        if (response.ok) {
            updateProgress(data);

            if (data.status === 'completed') {
                clearInterval(pollInterval);
                loadResults();
            } else if (data.status === 'failed') {
                clearInterval(pollInterval);
                alert('Analysis failed');
                resetUI();
            }
        }
    } catch (error) {
        console.error('Error checking status:', error);
    }
}

// Update Progress
function updateProgress(data) {
    const progress = data.progress || 0;
    progressFill.style.width = progress + '%';
    progressText.textContent = `Analyzing... ${progress}%`;
}

// Load Results
async function loadResults() {
    try {
        const response = await fetch(`/api/results/${currentAnalysisId}`);
        const data = await response.json();

        if (response.ok) {
            displayResults(data);
            progressSection.style.display = 'none';
            resultsSection.style.display = 'block';
        } else {
            throw new Error('Failed to load results');
        }
    } catch (error) {
        alert('Error loading results: ' + error.message);
        resetUI();
    }
}

// Display Results
function displayResults(data) {
    const results = data.results;

    // LSB Analysis
    if (results.lsb && results.lsb.success) {
        displayLSBResults(results.lsb.data);
    }

    // Metadata
    if (results.metadata && results.metadata.success) {
        displayMetadataResults(results.metadata.data);
    }

    // Strings
    if (results.strings && results.strings.success) {
        displayStringsResults(results.strings.data);
    }

    // Zsteg
    if (results.zsteg && results.zsteg.success) {
        displayZstegResults(results.zsteg.data);
    }

    // Steghide
    if (results.steghide && results.steghide.success) {
        displaySteghideResults(results.steghide.data);
    }

    // Outguess
    if (results.outguess && results.outguess.success) {
        displayOutguessResults(results.outguess.data);
    }

    // File Carving
    if (results.file_carving && results.file_carving.success) {
        displayFileCarvingResults(results.file_carving.data);
    }
}

// Display LSB Results
function displayLSBResults(data) {
    const container = document.getElementById('tab-lsb');

    // Group by channel
    const channels = { R: [], G: [], B: [] };
    data.bit_planes.forEach(bp => {
        channels[bp.channel].push(bp);
    });

    let channelsHTML = '';
    for (const [channel, planes] of Object.entries(channels)) {
        const channelColor = channel === 'R' ? '#ff0000' : channel === 'G' ? '#00ff00' : '#0000ff';
        channelsHTML += `
            <div class="result-item">
                <h3 style="color: ${channelColor}">${channel} Channel - Colored Bit Planes</h3>
                <div class="image-grid">
                    ${planes.map(bp => `
                        <div class="image-item" style="border: 2px solid ${channelColor}">
                            <img src="/api/download/${currentAnalysisId}/${bp.filename}"
                                 alt="${bp.channel}${bp.bit}"
                                 title="Bit ${bp.bit} of ${bp.channel} channel">
                            <p style="color: ${channelColor}; font-weight: bold;">${bp.channel} Bit ${bp.bit}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Add composite views
    let compositesHTML = '';
    if (data.composite_planes && data.composite_planes.length > 0) {
        compositesHTML = `
            <div class="result-item">
                <h3 style="background: linear-gradient(90deg, #ff0000, #00ff00, #0000ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    RGB Composite Bit Planes
                </h3>
                <p>Combined RGB channels for each bit plane</p>
                <div class="image-grid">
                    ${data.composite_planes.map(cp => `
                        <div class="image-item" style="border: 2px solid #6366f1">
                            <img src="/api/download/${currentAnalysisId}/${cp.filename}"
                                 alt="Composite Bit ${cp.bit}"
                                 title="RGB Composite of Bit ${cp.bit}">
                            <p style="color: #6366f1; font-weight: bold;">Composite Bit ${cp.bit}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="result-item">
            <h3>📊 Image Information</h3>
            <p><strong>Dimensions:</strong> ${data.width} x ${data.height} pixels</p>
            <p><strong>Color Mode:</strong> ${data.mode}</p>
            <p><strong>Total Bit Planes Generated:</strong> ${data.bit_planes.length} colored + ${data.composite_planes ? data.composite_planes.length : 0} composites</p>
        </div>
        ${compositesHTML}
        ${channelsHTML}
    `;
}

// Display Metadata Results
function displayMetadataResults(data) {
    const container = document.getElementById('tab-metadata');
    const metadata = data.metadata || {};

    container.innerHTML = `
        <div class="result-item">
            <h3>Metadata</h3>
            <pre>${JSON.stringify(metadata, null, 2)}</pre>
        </div>
    `;
}

// Display Strings Results
function displayStringsResults(data) {
    const container = document.getElementById('tab-strings');

    if (data.error) {
        container.innerHTML = `<p>Error: ${data.error}</p>`;
        return;
    }

    container.innerHTML = `
        <div class="result-item">
            <h3>Found ${data.count} strings (showing first 100)</h3>
            <pre>${data.strings.join('\n')}</pre>
        </div>
    `;
}

// Display Zsteg Results
function displayZstegResults(data) {
    const container = document.getElementById('tab-zsteg');

    if (data.error) {
        container.innerHTML = `<p>${data.error}</p>`;
        return;
    }

    container.innerHTML = `
        <div class="result-item">
            <h3>Zsteg Analysis</h3>
            <pre>${data.findings.join('\n') || 'No findings'}</pre>
        </div>
    `;
}

// Display Steghide Results
function displaySteghideResults(data) {
    const container = document.getElementById('tab-steghide');

    if (data.error) {
        container.innerHTML = `<p>${data.error}</p>`;
        return;
    }

    const passwordSource = data.using_custom_passwords ?
        '<p style="color: var(--success-color); font-weight: bold;">🔐 Using your custom passwords</p>' :
        '<p style="color: var(--text-muted);">Using default passwords (empty, password, 123456, admin, root)</p>';

    const successfulAttempts = data.attempts.filter(a => a.success);
    const failedAttempts = data.attempts.filter(a => !a.success);

    let resultsHTML = '';

    if (successfulAttempts.length > 0) {
        resultsHTML += `
            <div class="result-item" style="border-left: 4px solid var(--success-color);">
                <h3 style="color: var(--success-color);">✅ Extraction Successful!</h3>
                ${successfulAttempts.map(attempt => `
                    <p><strong>Password used:</strong> <code style="background: var(--darker-bg); padding: 0.25rem 0.5rem; border-radius: 4px;">${attempt.password}</code></p>
                    <p><strong>Message:</strong> ${attempt.message}</p>
                    ${attempt.output_file ? `<p><strong>Extracted file:</strong> ${attempt.output_file}</p>` : ''}
                `).join('')}
            </div>
        `;
    }

    if (failedAttempts.length > 0) {
        resultsHTML += `
            <div class="result-item">
                <h3>❌ Failed Attempts (${failedAttempts.length})</h3>
                <details>
                    <summary style="cursor: pointer; color: var(--primary-color);">Click to view details</summary>
                    <div style="margin-top: 1rem;">
                        ${failedAttempts.map(attempt => `
                            <div style="padding: 0.5rem; margin: 0.5rem 0; background: var(--darker-bg); border-radius: 4px;">
                                <p><strong>Password:</strong> <code>${attempt.password}</code></p>
                                <p style="font-size: 0.85rem; color: var(--text-muted);">${attempt.message}</p>
                            </div>
                        `).join('')}
                    </div>
                </details>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="result-item">
            <h3>🔐 Steghide Password Extraction</h3>
            ${passwordSource}
            <p><strong>Total attempts:</strong> ${data.attempts.length}</p>
        </div>
        ${resultsHTML || '<div class="result-item"><p>No extraction attempts were made.</p></div>'}
    `;
}

// Display Outguess Results
function displayOutguessResults(data) {
    const container = document.getElementById('tab-outguess');

    if (data.error) {
        container.innerHTML = `<p>${data.error}</p>`;
        return;
    }

    if (data.success) {
        container.innerHTML = `
            <div class="result-item">
                <h3>✅ Hidden Data Found!</h3>
                <p>Size: ${data.size} bytes</p>
                <h4>Preview:</h4>
                <pre>${data.preview}</pre>
            </div>
        `;
    } else {
        container.innerHTML = `<p>${data.message}</p>`;
    }
}

// Display File Carving Results
function displayFileCarvingResults(data) {
    const container = document.getElementById('tab-file_carving');

    let html = '';

    if (data.binwalk) {
        html += `
            <div class="result-item">
                <h3>Binwalk Results</h3>
                ${data.binwalk.error ? `<p>${data.binwalk.error}</p>` : `
                    <p>Found ${data.binwalk.extracted_files.length} files</p>
                    <pre>${data.binwalk.output}</pre>
                `}
            </div>
        `;
    }

    if (data.foremost) {
        html += `
            <div class="result-item">
                <h3>Foremost Results</h3>
                ${data.foremost.error ? `<p>${data.foremost.error}</p>` : `
                    <p>Found ${data.foremost.extracted_files.length} files</p>
                    <ul>
                        ${data.foremost.extracted_files.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                `}
            </div>
        `;
    }

    container.innerHTML = html || '<p>No embedded files found</p>';
}

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update panes
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
    });
});

// New Analysis Button
newAnalysisBtn.addEventListener('click', resetUI);

// Reset UI
function resetUI() {
    currentAnalysisId = null;
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
    uploadSection.style.display = 'block';
    progressSection.style.display = 'none';
    resultsSection.style.display = 'none';
    fileInput.value = '';
    progressFill.style.width = '0%';

    // Reset advanced options
    steghidePasswordsInput.value = '';
    advancedSection.style.display = 'none';
    toggleAdvancedBtn.textContent = '⚙️ Advanced Options';
}
