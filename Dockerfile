FROM mcr.microsoft.com/playwright:v1.48.0-noble

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

RUN playwright install chromium

COPY . .

RUN mkdir -p screenshots && \
    chown -R pwuser:pwuser /app

USER pwuser

EXPOSE 8000

CMD ["python3", "app.py"]
