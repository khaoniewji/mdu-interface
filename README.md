# Media Downloader Utility (MDU)

<div align="center">

  [![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
  [![C++](https://img.shields.io/badge/C++-20-orange.svg)](https://isocpp.org/)
  [![CEF](https://img.shields.io/badge/CEF-119-green.svg)](https://bitbucket.org/chromiumembedded/cef/)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
  [![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/project-mdu)
  [![GitHub release](https://img.shields.io/github/v/release/project-mdu/mdu?include_prereleases)](https://github.com/project-mdu/mdu/releases)

</div>

## Overview

MDU (Media Downloader Utility) is a modern, cross-platform media downloader built with C++, Chromium Embedded Framework (CEF), and React. It provides an intuitive interface for downloading media content with advanced features and customization options.

## Features

- 🎥 Support for multiple video platforms
- 🎵 High-quality audio extraction
- 📊 Real-time download progress tracking
- 🎨 Modern, customizable UI
- 📝 Advanced download configuration
- 📂 Smart file management
- 📱 Format conversion support
- 🔄 Playlist downloading
- 🎯 Quality selection
- 🔧 Advanced encoding options

## Installation

### Prerequisites
- Node.js 18 or later
- C++ development environment
- CMake 3.20 or later
- FFmpeg
- Visual Studio 2022 (Windows) or GCC/Clang (Linux/macOS)

### Windows/macOS/Linux
1. Download the latest release from [Releases](https://github.com/project-mdu/mdu/releases)
2. Install the application following your system's standard procedure
3. Ensure FFmpeg is installed and in your system PATH

### Build from Source
```bash
# Clone the repository
git clone https://github.com/project-mdu/mdu.git
cd mdu

# Install frontend dependencies
pnpm install

# Build CEF project
mkdir build && cd build
cmake ..
cmake --build . --config Release

# Development
pnpm run dev

# Build
pnpm run build
```

## Tech Stack

### Backend
- **C++20** - Systems programming language
- **CEF** - Chromium Embedded Framework
- **FFmpeg** - Media processing
- **SQLite** - Database operations
- **spdlog** - Logging library
- **nlohmann/json** - JSON handling
- **libcurl** - Network operations

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS
- **React Query** - Data fetching
- **Zustand** - State management
- **React Router** - Navigation
- **shadcn/ui** - UI components

## Project Structure

```
mdu/
├── src/                 # C++ backend & Frontend
│   ├── backend/         # C++ source code
│   │   ├── cef/        # CEF integration
│   │   ├── core/       # Core functionality
│   │   ├── handlers/   # CEF handlers
│   │   └── utils/      # Utility functions
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Frontend libraries
│   ├── pages/          # Route pages
│   ├── store/          # State management
│   └── styles/         # Global styles
├── public/             # Static assets
├── tests/              # Test files
├── CMakeLists.txt     # CMake configuration
├── package.json        # Node.js dependencies
└── vite.config.ts     # Vite configuration
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Run tests
ctest
pnpm run test

# Lint
pnpm run lint
clang-format -i src/backend/**/*.{cpp,h}

# Format code
pnpm run format
clang-format -i src/backend/**/*.{cpp,h}

# Build for production
pnpm run build
```

[Rest of the README remains the same, just update the dependencies section]

### Development Dependencies
- C++20 compiler
- CMake 3.20+
- Node.js 18+
- pnpm
- System-specific development tools

## Acknowledgments

- [CEF](https://bitbucket.org/chromiumembedded/cef/)
- [React](https://reactjs.org/)
- [Chromium](https://www.chromium.org/)
- [FFmpeg](https://ffmpeg.org/)

[Rest of the content remains the same]
