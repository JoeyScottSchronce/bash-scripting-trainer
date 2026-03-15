# BashMaster AI Deployment Guide

This project is prepared for deployment using Docker and GitHub Actions.

## Prerequisites

1. A GitHub repository for this project.
2. A Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## GitHub Actions Configuration

### 1. Set up Secrets
To allow the build to include your API key (if you want it baked into the static build), or to use it in other ways, add it to your GitHub Repository Secrets:
- Go to **Settings > Secrets and variables > Actions**.
- Click **New repository secret**.
- Name: `GEMINI_API_KEY`
- Value: `your_actual_api_key_here`

### 2. Docker Deployment
The included `Dockerfile` builds the application and serves it using Nginx. You can use the `docker-image.yml` workflow to build the image automatically on every push to `main`.

To deploy this image to a service like Google Cloud Run, AWS App Runner, or a VPS:
1. Update the GitHub Action to push to a container registry (like Docker Hub or GitHub Container Registry).
2. Configure your hosting service to pull the new image.

## Local Docker Build

To test the Docker build locally:

```bash
docker build -t bashmaster-ai .
docker run -p 8080:80 bashmaster-ai
```

The app will be available at `http://localhost:8080`.
