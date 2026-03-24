FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000

WORKDIR /app

# Minimal system deps for common Python packages (psycopg2-binary, pillow, etc.).
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential gcc \
    && rm -rf /var/lib/apt/lists/*

# Run the app as a dedicated non-root user.
RUN groupadd --system app \
    && useradd --system --gid app --create-home app

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend /app/backend

RUN chown -R app:app /app

WORKDIR /app/backend

USER app

EXPOSE 5000

CMD ["sh", "-c", "gunicorn -w ${GUNICORN_WORKERS:-4} --threads ${GUNICORN_THREADS:-2} -b 0.0.0.0:${PORT:-5000} --timeout ${GUNICORN_TIMEOUT:-120} --access-logfile - --error-logfile - app.main:app"]
