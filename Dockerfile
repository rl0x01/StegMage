FROM python:3.11-slim

# Install system dependencies and steganography tools
RUN apt-get update && apt-get install -y \
    steghide \
    outguess \
    exiftool \
    binwalk \
    foremost \
    binutils \
    ruby \
    ruby-dev \
    build-essential \
    && gem install zsteg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads results

# Expose port (8080 for macOS compatibility - port 5000 is used by AirPlay)
EXPOSE 8080

# Run the application
CMD ["python", "app.py"]
