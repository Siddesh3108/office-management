FROM python:3.9-slim

WORKDIR /app

# Install system dependencies (needed for some python packages)
RUN apt-get update && apt-get install -y build-essential libpq-dev

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Default command for Render (starts the API)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]