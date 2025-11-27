# ORBITS Demo Development - Setup Instructions

## Required Dependencies Installation

Since PowerShell execution policy is blocking npm, please run the following command in **Command Prompt** or **Git Bash**:

### Using Command Prompt:
```cmd
cd "F:\University\year 4\EE475\EE475-ORBITS\DemoDevelopment"
npm install
```

### Or using Git Bash:
```bash
cd "/f/University/year 4/EE475/EE475-ORBITS/DemoDevelopment"
npm install
```

This will install the following new packages:
- `react-router-dom` - For navigation between pages
- `blockly` - For drag-and-drop code generation
- `@mui/icons-material` - For the menu icon

## Running the Application

After installing dependencies, start the dev server:

```cmd
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

## Features

### Navigation
- **Menu Button** (top-left): Opens a collapsible drawer
- **Dashboard**: Home page with rotating cube, sine waves, and telemetry table
- **Code Builder**: Blockly page with drag-and-drop code generation

### Code Builder Page
- **Left Side**: Blockly workspace with draggable blocks
- **Right Side**: Real-time JavaScript code output
- Drag blocks from the toolbox to build logic
- Code updates automatically as you drag and connect blocks

## Troubleshooting

If you get execution policy errors in PowerShell, either:
1. Use Command Prompt instead
2. Or temporarily allow scripts: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
