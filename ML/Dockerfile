FROM python:3.11-slim
WORKDIR /app/
COPY requirements.txt /app/
RUN pip install -r requirements.txt
COPY . /app
EXPOSE 5000
CMD ["python3", "run.py", "runserver", "0.0.0.0:5000"]
