FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# system deps (optional, keep minimal)
RUN pip install --no-cache-dir --upgrade pip

COPY apps/api/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# copy app source
COPY apps/api/app /app/app

# Railway public networking needs a fixed port.
EXPOSE 8080

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8080 --app-dir /app"]

