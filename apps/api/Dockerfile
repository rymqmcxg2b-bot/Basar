FROM python:3.11-slim

WORKDIR /app
COPY apps/api /app/apps/api
RUN pip install --no-cache-dir -e /app/apps/api
CMD ["sh", "-c", "uvicorn hacker_librarian_api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
