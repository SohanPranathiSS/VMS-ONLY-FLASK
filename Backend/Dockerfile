FROM python:3.11-slim
WORKDIR /app/
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app
EXPOSE 4000
CMD ["python3", "run.py", "runserver", "0.0.0.0:4000"]
