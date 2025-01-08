# this project is Work in Progress

![image](https://github.com/user-attachments/assets/8ce2bad5-2f03-4736-b171-2d2e09bf7e03)

# MDU Interface Frontend

A modern, high-performance web interface for music stem separation and audio processing built with Bun, React, and TypeScript.

## 🚀 Features

- 🎵 Professional audio stem separation
- 🎨 Modern, responsive UI with Apple/Vercel-inspired design
- 🌍 Multi-language support (EN, TH, ID, JP)
- 🎛️ Advanced audio processing settings
- 📊 Real-time processing visualization
- 💾 Batch processing capabilities
- ⚡ High-performance Bun runtime
- 🌓 Light/Dark theme support

## 🛠️ Tech Stack

- **Runtime:** [Bun](https://bun.sh)
- **Framework:** React 18
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **UI Components:** shadcn/ui
- **State Management:** React Query
- **Routing:** React Router
- **Internationalization:** i18next
- **Motion:** Framer Motion

## 📋 Requirements

- [Bun](https://bun.sh) >= 1.0.0
- Node.js >= 18.0.0 (for some dependencies)

## 📦 Installation

1. Install Bun (if not already installed):
```bash
curl -fsSL https://bun.sh/install | bash
```

2. Clone the repository:
```bash
git clone https://github.com/yourusername/mdu-interface.git
cd mdu-interface
```

3. Install dependencies:
```bash
bun install
```

4. Start the development server:
```bash
bun dev
```

## 🏃‍♂️ Scripts

```json
{
  "scripts": {
    "dev": "bun run --hot src/index.tsx",
    "build": "bun build ./src/index.tsx --outdir ./dist",
    "start": "bun run dist/index.js",
    "test": "bun test",
    "lint": "bun eslint",
    "format": "bun prettier",
    "type-check": "bun tsc --noEmit"
  }
}
```

## 🏗️ Project Structure

```
mdu-interface/
├── public/
│   └── locales/           # Translation files
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Base UI components
│   │   ├── converter/    # Audio conversion components
│   │   ├── settings/     # Settings components
│   │   └── stemextractor/# Stem extraction components
│   ├── lib/              # Utility libraries
│   ├── styles/           # Global styles
│   ├── types/            # TypeScript definitions
│   └── utils/            # Utility functions
├── tests/                # Test files
├── bunfig.toml           # Bun configuration
└── tsconfig.json         # TypeScript configuration
```
## 🚀 Development

### 1. Setup project!: clone repository

```bash
git clone https://github.com/khaoniewji/mdu
```
### 2. install depedencies with bun

```bash
bun install
```
### 3. start development

```bash
bun run electron:dev
```
## 📦 Building for Production

```bash
# Build the application
bun run electron:build
```

## 📚 Additional Resources

- [Bun Documentation](https://bun.sh/docs)
- [Bun Discord](https://bun.sh/discord)
- [Bun GitHub](https://github.com/oven-sh/bun)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- Lead Developer: Himesora Aika
- UI/UX Designer: Himesora Aika
- Project Manager: Himesora Aika
.... Yes, I do it alone. ....

## 📞 Support

For support, email support@example.com or join our Discord channel.

## 🙏 Acknowledgments

- Bun team for the amazing runtime
- shadcn/ui for the component library
- TailwindCSS team
- React team

---

Made with ❤️ by Khaoniewji Development team

![Powered by Bun](https://img.shields.io/badge/Powered%20by-Bun-orange)
