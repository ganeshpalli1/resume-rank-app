# Resume Rank Reimagined

This application helps you to analyze job descriptions and match resumes against them.

## Features- Job description analysis using GPT-4o API- Automatic extraction of job requirements and skills- Resume shortlisting criteria generation- Resume matching against analyzed job descriptions

## Setup

### Frontend (React)

1. Install the frontend dependencies:

```bash
npm install
```

2. Start the frontend development server:

```bash
npm run dev
```

### Backend (Python FastAPI)

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Start the Python API server:

```bash
npm run start-api
```

Alternatively, you can start it directly:

```bash
python src/services/jobDescriptionAnalyzer.py
```

### Azure OpenAI Configuration

The Python backend is configured to use Azure OpenAI. You may need to update the credentials in `src/services/jobDescriptionAnalyzer.py`:

```python
# Azure OpenAI configuration
openai.api_type = "azure"
openai.api_base = "YOUR_ENDPOINT"
openai.api_version = "2024-02-15-preview"
openai.api_key = "YOUR_API_KEY"
deployment_name = "YOUR_DEPLOYMENT_NAME"
```

## How to Use

1. Enter a job title and paste a job description
2. Click "Analyze Description" to extract key requirements
3. Review the analyzed sections and requirements
4. Click "Use This Analysis" to proceed with resume matching

## Technologies Used

- Frontend: React, TypeScript, Vite, shadcn/ui
- Backend: Python, FastAPI
- AI: Azure OpenAI GPT-4o

## Starting Both Frontend and Backend

For convenience, use the provided scripts:

### Windows:
```bash
start.bat
```

### Mac/Linux:
```bash
chmod +x start.sh
./start.sh
```

## Project info

**URL**: https://lovable.dev/projects/e7db46cd-0ca9-479e-9e32-118e5b734c65

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e7db46cd-0ca9-479e-9e32-118e5b734c65) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e7db46cd-0ca9-479e-9e32-118e5b734c65) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
