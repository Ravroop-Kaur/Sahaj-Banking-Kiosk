FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends tesseract-ocr \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 kiosk
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=kiosk:kiosk . .
# The synthetic SQLite database under /app/data is written at runtime, so the app user must own it.
RUN chown -R kiosk:kiosk /app
USER kiosk
ENV PORT=8766 TRUST_PROXY=1
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import os,urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:%s/api/health' % os.environ.get('PORT','8766'), timeout=4).status==200 else 1)"
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --proxy-headers"]
