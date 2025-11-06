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

    // Load Reverse Image Search
    loadReverseSearchResults();

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

    const engineColors = {
        'google': '#4285f4',
        'yandex': '#fc3f1d',
        'bing': '#008373',
        'tineye': '#d81159',
        'sogou': '#fb6d3a'
    };

    let html = `
        <div class="result-item">
            <h3>🔍 Reverse Image Search</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
                Search for this image across multiple search engines to find similar images, sources, or more information.
            </p>
        </div>

        <div class="reverse-search-grid">
    `;

    for (const [key, engine] of Object.entries(searchEngines)) {
        const color = engineColors[key] || 'var(--primary-color)';
        html += `
            <a href="${engine.url}" target="_blank" rel="noopener noreferrer" class="reverse-search-card" style="--engine-color: ${color}">
                <div class="reverse-search-icon">${engine.icon}</div>
                <div class="reverse-search-name">${engine.name}</div>
                <div class="reverse-search-action">
                    Search Now →
                </div>
            </a>
        `;
    }

    html += `
        </div>

        <div class="result-item" style="margin-top: 1.5rem;">
            <details>
                <summary style="cursor: pointer; color: var(--primary-color); font-weight: bold;">
                    🔗 Direct Image URL
                </summary>
                <div style="margin-top: 1rem;">
                    <p style="color: var(--text-muted); margin-bottom: 0.5rem;">
                        Use this URL to search on other platforms:
                    </p>
                    <input
                        type="text"
                        value="${data.image_url}"
                        readonly
                        onclick="this.select()"
                        style="width: 100%; padding: 0.75rem; background: var(--darker-bg); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-color); font-family: monospace;"
                    />
                    <button
                        onclick="navigator.clipboard.writeText('${data.image_url}'); this.textContent='✅ Copied!'; setTimeout(() => this.textContent='📋 Copy URL', 2000)"
                        class="btn btn-secondary"
                        style="margin-top: 0.5rem;"
                    >
                        📋 Copy URL
                    </button>
                </div>
            </details>
        </div>

        <div class="result-item" style="margin-top: 1rem; background: var(--darker-bg); border-left: 3px solid var(--warning-color);">
            <h4 style="color: var(--warning-color); margin-bottom: 0.5rem;">💡 Tips for Best Results</h4>
            <ul style="margin-left: 1.5rem; color: var(--text-muted);">
                <li>Try multiple search engines for comprehensive results</li>
                <li>Google and Yandex usually have the largest image databases</li>
                <li>TinEye specializes in tracking image modifications and sources</li>
                <li>Bing can find visually similar images effectively</li>
                <li>Some engines may require the image to be publicly accessible</li>
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
