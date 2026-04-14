    # Use an official, lightweight Python image as a base
    FROM python:3.11-slim

    # Set environment variables for Python
    ENV PYTHONDONTWRITEBYTECODE 1
    ENV PYTHONUNBUFFERED 1

    # Set the working directory inside the container
    WORKDIR /app

    # Install system dependencies that might be needed
    RUN apt-get update && apt-get install -y gcc libpq-dev

    # Copy the requirements file and install Python libraries
    COPY requirements.txt /app/
    RUN pip install --no-cache-dir -r requirements.txt

    # Copy the rest of your backend code into the container
    COPY . /app/
    
