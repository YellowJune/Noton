# Noton - AI Notebook

AI-powered notebook web application with S-Pen support, code execution, and multi-subject analysis.

## Features

- **Canvas Drawing** - Pen, highlighter, eraser with S-Pen pressure/tilt/hover support
- **Markdown Editor** - Write and preview markdown with live rendering
- **Code Editor** - Write and execute code (Python, JavaScript, C++, C, Java)
- **AI Chat** - Context-aware AI assistance for any subject
- **Math Solving** - Step-by-step equation solving with LaTeX output
- **Graph Generation** - Plot mathematical functions and data charts
- **Folder System** - Organize notebooks into folders and subfolders
- **Multi-language** - Korean and English UI support
- **Local Storage** - All data saved locally in browser

## Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Configuration

The API server URL can be configured in Settings. Default: `http://localhost:8000`

You can also set it via environment variable:
```
VITE_API_URL=http://your-api-server:8000
```

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Lucide Icons
- Canvas API with PointerEvent for S-Pen support

## Backend API

See [Noton-BAPI](https://github.com/YellowJune/Noton-BAPI) for the backend API server.
