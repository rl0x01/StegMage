// StegMage Frontend JavaScript

let currentAnalysisId = null;
let pollInterval = null;

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const progressSection = document.getElementById('progress-section');
const resultsSection = document.getElementById('results-section');
const historySection = document.getElementById('history-section');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const newAnalysisBtn = document.getElementById('new-analysis-btn');
const toggleAdvancedBtn = document.getElementById('toggle-advanced');
const advancedSection = document.getElementById('advanced-section');
const steghidePasswordsInput = document.getElementById('steghide-passwords');
const toggleHistoryBtn = document.getElementById('toggle-history-btn');
const deleteAllBtn = document.getElementById('delete-all-btn');
const historyList = document.getElementById('history-list');

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

    // Create Dashboard
    displayDashboard(results, data);

    // Load Reverse Image Search
    loadReverseSearchResults();

    // Metadata
    if (results.metadata && results.metadata.success) {
        displayMetadataResults(results.metadata.data);
    }

    // Color Analysis
    if (results.color_analysis && results.color_analysis.success) {
        displayColorAnalysisResults(results.color_analysis.data);
    }

    // LSB Analysis
    if (results.lsb && results.lsb.success) {
        displayLSBResults(results.lsb.data);
    }

    // Steghide
    if (results.steghide && results.steghide.success) {
        displaySteghideResults(results.steghide.data);
    }

    // Outguess
    if (results.outguess && results.outguess.success) {
        displayOutguessResults(results.outguess.data);
    }

    // Zsteg
    if (results.zsteg && results.zsteg.success) {
        displayZstegResults(results.zsteg.data);
    }

    // Entropy
    if (results.entropy && results.entropy.success) {
        displayEntropyResults(results.entropy.data);
    }

    // Forensics
    if (results.forensics && results.forensics.success) {
        displayForensicsResults(results.forensics.data);
    }

    // Strings
    if (results.strings && results.strings.success) {
        displayStringsResults(results.strings.data);
    }

    // File Carving
    if (results.file_carving && results.file_carving.success) {
        displayFileCarvingResults(results.file_carving.data);
    }
}

// Load and Display Reverse Image Search
async function loadReverseSearchResults() {
    const container = document.getElementById('tab-reverse');
    container.innerHTML = '<div class="result-item"><p>Loading reverse search options...</p></div>';

    try {
        const response = await fetch(`/api/reverse-search/${currentAnalysisId}`);
        const data = await response.json();

        if (response.ok) {
            displayReverseSearchResults(data);
        } else {
            container.innerHTML = '<div class="result-item"><p>Error loading reverse search options</p></div>';
        }
    } catch (error) {
        console.error('Error loading reverse search:', error);
        container.innerHTML = '<div class="result-item"><p>Error loading reverse search options</p></div>';
    }
}

// Display Reverse Image Search Results
function displayReverseSearchResults(data) {
    const container = document.getElementById('tab-reverse');
    const searchEngines = data.search_engines;

    let html = `
        <div class="result-item" style="background: linear-gradient(135deg, var(--primary-dark) 0%, var(--info-color) 100%); border: none; color: white;">
            <h3 style="color: white;"><i class="fas fa-info-circle"></i> Important Notice</h3>
            <p style="color: white; opacity: 0.95; margin-bottom: 0;">
                ${data.note}
            </p>
        </div>

        <div class="result-item">
            <h3><i class="fas fa-download"></i> Step 1: Download the Image</h3>
            <p style="color: var(--text-muted); margin-bottom: 1rem;">
                First, download the analyzed image to your computer:
            </p>
            <a href="${data.download_url}" class="btn btn-primary" download style="display: inline-flex; text-decoration: none;">
                <i class="fas fa-download"></i> Download Image
            </a>
        </div>

        <div class="result-item">
            <h3><i class="fas fa-search"></i> Step 2: Choose a Search Engine</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
                Click on a search engine below, then follow the instructions to upload your downloaded image:
            </p>
            <div class="reverse-search-grid">
    `;

    for (const [key, engine] of Object.entries(searchEngines)) {
        const color = engine.color || 'var(--primary-color)';
        html += `
            <a href="${engine.url}" target="_blank" rel="noopener noreferrer" class="reverse-search-card" style="--engine-color: ${color}">
                <div class="reverse-search-icon">${engine.icon}</div>
                <div class="reverse-search-name">${engine.name}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-top: 0.5rem;">
                    ${engine.instructions}
                </div>
                <div class="reverse-search-action" style="margin-top: 0.75rem;">
                    <i class="fas fa-external-link-alt"></i> Open ${engine.name}
                </div>
            </a>
        `;
    }

    html += `
            </div>
        </div>

        <div class="result-item" style="border-left: 3px solid var(--info-color);">
            <h4 style="color: var(--info-color); margin-bottom: 0.75rem;">
                <i class="fas fa-question-circle"></i> How to Perform Reverse Image Search
            </h4>
            <ol style="margin-left: 1.5rem; color: var(--text-muted); line-height: 1.8;">
                <li><strong>Download</strong> the image using the button above</li>
                <li><strong>Click</strong> on your preferred search engine</li>
                <li><strong>Look for</strong> the camera icon or upload button on the search engine's page</li>
                <li><strong>Upload</strong> your downloaded image</li>
                <li><strong>Review</strong> the search results</li>
            </ol>
        </div>

        <div class="result-item" style="background: var(--darker-bg); border-left: 3px solid var(--success-color);">
            <h4 style="color: var(--success-color); margin-bottom: 0.5rem;">
                <i class="fas fa-lightbulb"></i> Tips for Best Results
            </h4>
            <ul style="margin-left: 1.5rem; color: var(--text-muted);">
                <li><strong>Google Images</strong> - Best for general image search and similar images</li>
                <li><strong>Yandex</strong> - Excellent for face recognition and Eastern European content</li>
                <li><strong>TinEye</strong> - Specializes in tracking image modifications, edits, and original sources</li>
                <li><strong>Bing</strong> - Good alternative with unique results</li>
                <li><strong>Sogou</strong> - Best for Chinese and Asian content</li>
                <li>Try multiple engines for comprehensive results</li>
            </ul>
        </div>
    `;

    container.innerHTML = html;
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

    // Categorize metadata
    const categories = categorizeMetadata(metadata);

    let html = '';

    // Display each category
    for (const [categoryName, fields] of Object.entries(categories)) {
        if (fields.length === 0) continue;

        const icons = {
            'File Information': '📄',
            'Image Properties': '🖼️',
            'Camera Settings': '📷',
            'GPS Location': '📍',
            'Date & Time': '🕐',
            'Software & Tools': '💻',
            'Other Metadata': '🏷️'
        };

        html += `
            <div class="result-item metadata-category">
                <h3>${icons[categoryName] || '📋'} ${categoryName}</h3>
                <div class="metadata-grid">
                    ${fields.map(([key, value]) => `
                        <div class="metadata-field">
                            <div class="metadata-key">${formatMetadataKey(key)}</div>
                            <div class="metadata-value">${formatMetadataValue(key, value)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Add raw JSON at the end for advanced users
    html += `
        <div class="result-item">
            <details>
                <summary style="cursor: pointer; color: var(--primary-color); font-weight: bold;">
                    🔧 View Raw Metadata (JSON)
                </summary>
                <pre style="margin-top: 1rem; max-height: 500px; overflow-y: auto;">${JSON.stringify(metadata, null, 2)}</pre>
            </details>
        </div>
    `;

    container.innerHTML = html || '<div class="result-item"><p>No metadata found</p></div>';
}

// Categorize metadata into logical groups
function categorizeMetadata(metadata) {
    const categories = {
        'File Information': [],
        'Image Properties': [],
        'Camera Settings': [],
        'GPS Location': [],
        'Date & Time': [],
        'Software & Tools': [],
        'Other Metadata': []
    };

    const categoryRules = {
        'File Information': ['FileName', 'FileSize', 'FileType', 'MIMEType', 'FileModifyDate'],
        'Image Properties': ['ImageWidth', 'ImageHeight', 'ImageSize', 'BitDepth', 'ColorSpace', 'ColorType', 'Compression', 'Format', 'Width', 'Height', 'Megapixels'],
        'Camera Settings': ['Make', 'Model', 'LensModel', 'ISO', 'FNumber', 'ExposureTime', 'ShutterSpeed', 'FocalLength', 'Flash', 'WhiteBalance', 'MeteringMode', 'ExposureMode', 'Aperture'],
        'GPS Location': ['GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSPosition', 'GPSDateTime', 'GPSLatitudeRef', 'GPSLongitudeRef'],
        'Date & Time': ['CreateDate', 'ModifyDate', 'DateTimeOriginal', 'DateTime', 'TimeStamp'],
        'Software & Tools': ['Software', 'Creator', 'ProcessingSoftware', 'HostComputer', 'Artist', 'Copyright', 'UserComment']
    };

    for (const [key, value] of Object.entries(metadata)) {
        let categorized = false;

        for (const [category, keywords] of Object.entries(categoryRules)) {
            if (keywords.some(keyword => key.includes(keyword))) {
                categories[category].push([key, value]);
                categorized = true;
                break;
            }
        }

        if (!categorized) {
            categories['Other Metadata'].push([key, value]);
        }
    }

    return categories;
}

// Format metadata key for display
function formatMetadataKey(key) {
    // Add spaces before capital letters and remove special chars
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

// Format metadata value for display
function formatMetadataValue(key, value) {
    if (value === null || value === undefined || value === '') {
        return '<span style="color: var(--text-muted); font-style: italic;">N/A</span>';
    }

    // Convert to string
    let strValue = String(value);

    // Format file sizes
    if (key.toLowerCase().includes('filesize') || key.toLowerCase().includes('size')) {
        const match = strValue.match(/(\d+)/);
        if (match) {
            const bytes = parseInt(match[1]);
            return formatFileSize(bytes) + ` <span style="color: var(--text-muted); font-size: 0.85em;">(${strValue})</span>`;
        }
    }

    // Highlight GPS coordinates
    if (key.toLowerCase().includes('gps') && (key.includes('Latitude') || key.includes('Longitude'))) {
        return `<span style="color: var(--success-color); font-weight: bold;">${strValue}</span>`;
    }

    // Format dates
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
        return `<span style="color: var(--warning-color);">${strValue}</span>`;
    }

    // Limit length for very long values
    if (strValue.length > 100) {
        return strValue.substring(0, 100) + '... <span style="color: var(--text-muted); font-style: italic;">(truncated)</span>';
    }

    return strValue;
}

// Format file size in human-readable format
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

// Display Dashboard
function displayDashboard(results, data) {
    const container = document.getElementById('tab-dashboard');

    const findingsCount = {
        steganography: 0,
        forensics: 0,
        metadata: 0,
        other: 0
    };

    let findings = [];

    // Check steghide
    if (results.steghide?.success && results.steghide.data.attempts?.some(a => a.success)) {
        findingsCount.steganography++;
        findings.push({ type: 'success', icon: 'fa-lock', title: 'Steghide Data Found', desc: 'Hidden data extracted with password' });
    }

    // Check outguess
    if (results.outguess?.success && results.outguess.data.success) {
        findingsCount.steganography++;
        findings.push({ type: 'success', icon: 'fa-unlock', title: 'Outguess Data Found', desc: 'Hidden data detected' });
    }

    // Check zsteg
    if (results.zsteg?.success && results.zsteg.data.findings?.length > 0) {
        findingsCount.steganography++;
        findings.push({ type: 'info', icon: 'fa-gem', title: 'Zsteg Findings', desc: `${results.zsteg.data.findings.length} potential findings` });
    }

    // Check entropy
    if (results.entropy?.success && results.entropy.data.suspicious_blocks?.length > 0) {
        findingsCount.forensics++;
        findings.push({ type: 'warning', icon: 'fa-wave-square', title: 'Entropy Anomalies', desc: `${results.entropy.data.suspicious_blocks.length} suspicious blocks detected` });
    }

    // Check forensics
    if (results.forensics?.success && results.forensics.data.ela_findings?.length > 0) {
        findingsCount.forensics++;
        findings.push({ type: 'warning', icon: 'fa-microscope', title: 'Manipulation Detected', desc: results.forensics.data.ela_findings.join(', ') });
    }

    // Check GPS
    if (results.metadata?.success) {
        const metadata = results.metadata.data.metadata || {};
        if (Object.keys(metadata).some(k => k.toLowerCase().includes('gps'))) {
            findingsCount.metadata++;
            findings.push({ type: 'info', icon: 'fa-map-marker-alt', title: 'GPS Data Found', desc: 'Location information in metadata' });
        }
    }

    // Check file carving
    if (results.file_carving?.success) {
        const totalFiles = (results.file_carving.data.binwalk?.extracted_files?.length || 0) +
                          (results.file_carving.data.foremost?.extracted_files?.length || 0);
        if (totalFiles > 0) {
            findingsCount.other++;
            findings.push({ type: 'success', icon: 'fa-folder-open', title: 'Embedded Files Found', desc: `${totalFiles} files extracted` });
        }
    }

    const totalFindings = findingsCount.steganography + findingsCount.forensics + findingsCount.metadata + findingsCount.other;

    const summaryHTML = `
        <div class="result-item dashboard-summary">
            <h3>
                <i class="fas fa-chart-pie"></i> Analysis Summary
            </h3>
            <div class="dashboard-stats-grid">
                <div class="dashboard-stat-card">
                    <div class="dashboard-stat-value">${totalFindings}</div>
                    <div class="dashboard-stat-label">Total Findings</div>
                </div>
                <div class="dashboard-stat-card">
                    <div class="dashboard-stat-value">${findingsCount.steganography}</div>
                    <div class="dashboard-stat-label">Steganography</div>
                </div>
                <div class="dashboard-stat-card">
                    <div class="dashboard-stat-value">${findingsCount.forensics}</div>
                    <div class="dashboard-stat-label">Forensics</div>
                </div>
                <div class="dashboard-stat-card">
                    <div class="dashboard-stat-value">${findingsCount.other}</div>
                    <div class="dashboard-stat-label">Other</div>
                </div>
            </div>
        </div>
    `;

    const findingsHTML = findings.length > 0 ? `
        <div class="result-item">
            <h3><i class="fas fa-search"></i> Key Findings</h3>
            <div class="findings-grid">
                ${findings.map(f => `
                    <div class="finding-card ${f.type}">
                        <div class="finding-icon-wrapper ${f.type}">
                            <div class="finding-icon ${f.type}">
                                <i class="fas ${f.icon}"></i>
                            </div>
                        </div>
                        <div class="finding-content">
                            <div class="finding-title">${f.title}</div>
                            <div class="finding-desc">${f.desc}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : `
        <div class="result-item">
            <div class="no-findings">
                <i class="fas fa-info-circle"></i>
                <p>No significant findings detected. Explore individual analysis tabs for detailed information.</p>
            </div>
        </div>
    `;

    const analysesHTML = `
        <div class="result-item">
            <h3><i class="fas fa-list-check"></i> Analysis Methods Used</h3>
            <div class="analysis-methods-grid">
                ${Object.entries(results).map(([name, result]) => {
                    const icons = {
                        lsb: 'fa-th',
                        metadata: 'fa-tags',
                        color_analysis: 'fa-palette',
                        steghide: 'fa-lock',
                        outguess: 'fa-unlock',
                        zsteg: 'fa-gem',
                        entropy: 'fa-wave-square',
                        forensics: 'fa-microscope',
                        strings: 'fa-file-alt',
                        file_carving: 'fa-folder-open'
                    };
                    const statusIcon = result.success
                        ? '<i class="fas fa-check-circle"></i>'
                        : '<i class="fas fa-times-circle"></i>';
                    return `
                        <div class="analysis-method-item">
                            ${statusIcon}
                            <i class="fas ${icons[name] || 'fa-tools'}"></i>
                            ${name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    container.innerHTML = summaryHTML + findingsHTML + analysesHTML;
}

// Display Color Analysis Results
function displayColorAnalysisResults(data) {
    const container = document.getElementById('tab-color');

    let html = `
        <div class="result-item">
            <h3><i class="fas fa-palette"></i> Color Information</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div style="background: var(--darker-bg); padding: 1rem; border-radius: 8px;">
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.25rem;">UNIQUE COLORS</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${data.unique_colors?.toLocaleString() || 'N/A'}</div>
                </div>
                <div style="background: var(--darker-bg); padding: 1rem; border-radius: 8px;">
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.25rem;">COLOR DIVERSITY</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--success-color);">${(data.color_diversity * 100).toFixed(2)}%</div>
                </div>
                <div style="background: var(--darker-bg); padding: 1rem; border-radius: 8px;">
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.25rem;">DOMINANT COLORS</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--warning-color);">${data.dominant_colors?.length || 0}</div>
                </div>
            </div>
        </div>
    `;

    if (data.palette_file) {
        html += `
            <div class="result-item">
                <h3><i class="fas fa-swatchbook"></i> Color Palette (Top 10)</h3>
                <img src="/api/download/${currentAnalysisId}/${data.palette_file}"
                     alt="Color Palette"
                     style="width: 100%; max-width: 800px; border-radius: 8px; margin-top: 1rem;">
            </div>
        `;
    }

    if (data.histogram_files) {
        html += `
            <div class="result-item">
                <h3><i class="fas fa-chart-bar"></i> Color Channel Histograms</h3>
                <div class="image-grid">
                    ${['r', 'g', 'b'].map(ch => {
                        const file = data.histogram_files[`histogram_${ch}.png`];
                        if (file) {
                            const colors = { r: '#ff0000', g: '#00ff00', b: '#0000ff' };
                            return `
                                <div class="image-item" style="border: 2px solid ${colors[ch]}">
                                    <img src="/api/download/${currentAnalysisId}/${file}" alt="${ch.toUpperCase()} Histogram">
                                    <p style="color: ${colors[ch]}; font-weight: bold;">${ch.toUpperCase()} Channel</p>
                                </div>
                            `;
                        }
                        return '';
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (data.interpretation) {
        html += `
            <div class="result-item">
                <h3><i class="fas fa-lightbulb"></i> Interpretation</h3>
                <ul style="margin-left: 1.5rem; color: var(--text-muted);">
                    ${data.interpretation.map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Display Entropy Results
function displayEntropyResults(data) {
    const container = document.getElementById('tab-entropy');

    let html = `
        <div class="result-item">
            <h3><i class="fas fa-wave-square"></i> Entropy Analysis</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
                <div style="background: var(--darker-bg); padding: 1rem; border-radius: 8px;">
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.25rem;">OVERALL ENTROPY</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${data.overall_entropy?.toFixed(4) || 'N/A'}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Max: 8.0</div>
                </div>
            </div>
        </div>

        <div class="result-item">
            <h3><i class="fas fa-layer-group"></i> Channel Entropy</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                ${Object.entries(data.channel_entropy || {}).map(([channel, value]) => {
                    const colors = { R: '#ff0000', G: '#00ff00', B: '#0000ff' };
                    return `
                        <div style="background: var(--darker-bg); padding: 1rem; border-radius: 8px; border-left: 4px solid ${colors[channel]};">
                            <div style="color: var(--text-muted); font-size: 0.85rem;">${channel} Channel</div>
                            <div style="font-size: 1.3rem; font-weight: bold; color: ${colors[channel]};">${value?.toFixed(4)}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    if (data.block_entropy) {
        html += `
            <div class="result-item">
                <h3><i class="fas fa-border-all"></i> Block-Based Entropy (8x8 blocks)</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div style="background: var(--darker-bg); padding: 0.75rem; border-radius: 8px;">
                        <div style="color: var(--text-muted); font-size: 0.8rem;">Average</div>
                        <div style="font-weight: bold; color: var(--primary-color);">${data.block_entropy.average?.toFixed(4)}</div>
                    </div>
                    <div style="background: var(--darker-bg); padding: 0.75rem; border-radius: 8px;">
                        <div style="color: var(--text-muted); font-size: 0.8rem;">Min</div>
                        <div style="font-weight: bold;">${data.block_entropy.min?.toFixed(4)}</div>
                    </div>
                    <div style="background: var(--darker-bg); padding: 0.75rem; border-radius: 8px;">
                        <div style="color: var(--text-muted); font-size: 0.8rem;">Max</div>
                        <div style="font-weight: bold;">${data.block_entropy.max?.toFixed(4)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    if (data.suspicious_blocks && data.suspicious_blocks.length > 0) {
        html += `
            <div class="result-item" style="border-left: 4px solid var(--warning-color);">
                <h3 style="color: var(--warning-color);"><i class="fas fa-exclamation-triangle"></i> Suspicious Blocks Detected</h3>
                <p>Found ${data.suspicious_blocks.length} blocks with unusually high entropy (>20% above average)</p>
                <details style="margin-top: 1rem;">
                    <summary style="cursor: pointer; color: var(--primary-color);">View block details</summary>
                    <div style="max-height: 300px; overflow-y: auto; margin-top: 1rem;">
                        ${data.suspicious_blocks.slice(0, 20).map(block => `
                            <div style="background: var(--darker-bg); padding: 0.5rem; margin: 0.5rem 0; border-radius: 4px; font-size: 0.9rem;">
                                Position: (${block.x}, ${block.y}) | Entropy: ${block.entropy?.toFixed(4)} | Diff: +${block.difference?.toFixed(4)}
                            </div>
                        `).join('')}
                        ${data.suspicious_blocks.length > 20 ? `<p style="color: var(--text-muted); text-align: center; margin-top: 0.5rem;">... and ${data.suspicious_blocks.length - 20} more</p>` : ''}
                    </div>
                </details>
            </div>
        `;
    }

    if (data.entropy_map_file) {
        html += `
            <div class="result-item">
                <h3><i class="fas fa-map"></i> Entropy Heatmap</h3>
                <p style="color: var(--text-muted); margin-bottom: 1rem;">
                    Brighter areas indicate higher entropy (more randomness/complexity)
                </p>
                <img src="/api/download/${currentAnalysisId}/${data.entropy_map_file}"
                     alt="Entropy Map"
                     style="width: 100%; max-width: 800px; border-radius: 8px; background: #000;">
            </div>
        `;
    }

    if (data.interpretation) {
        html += `
            <div class="result-item">
                <h3><i class="fas fa-lightbulb"></i> Interpretation</h3>
                <ul style="margin-left: 1.5rem; color: var(--text-muted);">
                    ${data.interpretation.map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Display Forensics Results
function displayForensicsResults(data) {
    const container = document.getElementById('tab-forensics_ela');

    let html = '';

    if (data.ela_file) {
        html += `
            <div class="result-item">
                <h3><i class="fas fa-search-plus"></i> Error Level Analysis (ELA)</h3>
                <p style="color: var(--text-muted); margin-bottom: 1rem;">
                    ELA highlights areas that have been modified or compressed at different quality levels.
                    Bright areas may indicate manipulation.
                </p>
                <img src="/api/download/${currentAnalysisId}/${data.ela_file}"
                     alt="ELA Analysis"
                     style="width: 100%; max-width: 800px; border-radius: 8px; background: #000;">
            </div>
        `;
    }

    if (data.ela_findings && data.ela_findings.length > 0) {
        html += `
            <div class="result-item" style="border-left: 4px solid var(--warning-color);">
                <h3 style="color: var(--warning-color);"><i class="fas fa-exclamation-triangle"></i> Findings</h3>
                <ul style="margin-left: 1.5rem; color: var(--text-muted);">
                    ${data.ela_findings.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    if (data.compression_analysis) {
        const ca = data.compression_analysis;
        html += `
            <div class="result-item">
                <h3><i class="fas fa-compress"></i> JPEG Compression Analysis</h3>
                <div style="background: var(--darker-bg); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        ${ca.estimated_quality ? `
                            <div>
                                <div style="color: var(--text-muted); font-size: 0.85rem;">Estimated Quality</div>
                                <div style="font-size: 1.3rem; font-weight: bold; color: var(--primary-color);">${ca.estimated_quality}</div>
                            </div>
                        ` : ''}
                        ${ca.compression_artifacts ? `
                            <div>
                                <div style="color: var(--text-muted); font-size: 0.85rem;">Compression Artifacts</div>
                                <div style="font-size: 1.3rem; font-weight: bold; color: ${ca.compression_artifacts === 'High' ? 'var(--danger-color)' : 'var(--success-color)'};">${ca.compression_artifacts}</div>
                            </div>
                        ` : ''}
                    </div>
                    ${ca.notes ? `<p style="color: var(--text-muted); margin-top: 1rem; font-size: 0.9rem;">${ca.notes}</p>` : ''}
                </div>
            </div>
        `;
    }

    if (data.interpretation) {
        html += `
            <div class="result-item">
                <h3><i class="fas fa-lightbulb"></i> Interpretation</h3>
                <ul style="margin-left: 1.5rem; color: var(--text-muted);">
                    ${data.interpretation.map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    container.innerHTML = html || '<div class="result-item"><p>No forensic analysis data available</p></div>';
}

// Category Navigation
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const category = btn.dataset.category;

        // Update category buttons
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update category panes
        document.querySelectorAll('.analysis-category').forEach(c => c.classList.remove('active'));
        document.getElementById(`category-${category}`).classList.add('active');
    });
});

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        const parentCategory = btn.closest('.analysis-category');

        // Update buttons within the same category
        parentCategory.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update panes within the same category
        parentCategory.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
    });
});

// New Analysis Button
newAnalysisBtn.addEventListener('click', resetUI);

// Delete Results Button
const deleteResultsBtn = document.getElementById('delete-results-btn');
deleteResultsBtn.addEventListener('click', async () => {
    if (!currentAnalysisId) {
        return;
    }

    if (!confirm('Are you sure you want to delete all results for this analysis? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/results/${currentAnalysisId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            alert('Results deleted successfully');
            resetUI();
        } else {
            throw new Error(data.error || 'Failed to delete results');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

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
    historySection.style.display = 'none';
    fileInput.value = '';
    progressFill.style.width = '0%';

    // Reset advanced options
    steghidePasswordsInput.value = '';
    advancedSection.style.display = 'none';
    toggleAdvancedBtn.textContent = '⚙️ Advanced Options';
}

// Toggle History
toggleHistoryBtn.addEventListener('click', async () => {
    if (historySection.style.display === 'none') {
        await loadHistory();
        uploadSection.style.display = 'none';
        progressSection.style.display = 'none';
        resultsSection.style.display = 'none';
        historySection.style.display = 'block';
    } else {
        historySection.style.display = 'none';
        uploadSection.style.display = 'block';
    }
});

// Load History
async function loadHistory() {
    try {
        const response = await fetch('/api/results');
        const data = await response.json();

        if (response.ok) {
            displayHistory(data.results);
        } else {
            throw new Error(data.error || 'Failed to load history');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        historyList.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load history: ${error.message}</p>
            </div>
        `;
    }
}

// Display History
function displayHistory(results) {
    if (!results || results.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-history"></i>
                <p>No analysis history yet</p>
                <p style="font-size: 0.9rem; margin-top: 8px;">Upload an image to start analyzing</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = results.map(item => {
        const date = new Date(item.created_at);
        const dateStr = date.toLocaleString();
        const fileSizeKB = (item.file_size / 1024).toFixed(2);

        return `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-meta">
                        <span>
                            <i class="fas fa-clock"></i>
                            ${dateStr}
                        </span>
                        <span>
                            <i class="fas fa-image"></i>
                            ${item.image_format} - ${item.image_size}
                        </span>
                        <span>
                            <i class="fas fa-file"></i>
                            ${fileSizeKB} KB
                        </span>
                    </div>
                    <div>
                        <span class="history-badge ${item.has_findings ? 'findings' : 'no-findings'}">
                            ${item.has_findings ? '✓ Findings Detected' : 'No Findings'}
                        </span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn btn-primary btn-sm" onclick="loadHistoryResult('${item.analysis_id}')">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteHistoryItem('${item.analysis_id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Load History Result
async function loadHistoryResult(analysisId) {
    currentAnalysisId = analysisId;

    try {
        const response = await fetch(`/api/results/${analysisId}`);
        const data = await response.json();

        if (response.ok) {
            historySection.style.display = 'none';
            resultsSection.style.display = 'block';
            displayResults(data);
        } else {
            throw new Error(data.error || 'Failed to load results');
        }
    } catch (error) {
        alert('Error loading results: ' + error.message);
    }
}

// Delete History Item
async function deleteHistoryItem(analysisId) {
    if (!confirm('Are you sure you want to delete this analysis?')) {
        return;
    }

    try {
        const response = await fetch(`/api/results/${analysisId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            await loadHistory();
        } else {
            throw new Error(data.error || 'Failed to delete');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Delete All Results
deleteAllBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete ALL analysis results? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch('/api/results', {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Successfully deleted ${data.deleted_count} items`);
            await loadHistory();
        } else {
            throw new Error(data.error || 'Failed to delete all results');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});
