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
- **Audio Processing:** Web Audio API
- **Backend Integration:** FastAPI (Python)

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

## ⚙️ Configuration

### Bun Configuration

```toml
# bunfig.toml
[bundle]
entry = "./src/index.tsx"
outdir = "./dist"
minify = true
sourcemap = true

[dev]
port = 3000
hot = true

[test]
coverage = true
```

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=MDU Interface
VITE_DEBUG=true
```

Load environment variables in Bun:
```typescript
const env = Bun.env;
```

## 🧪 Testing

Bun comes with a built-in test runner:

```bash
# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Watch mode
bun test --watch
```

Example test:
```typescript
import { expect, test } from "bun:test";

test("component renders correctly", () => {
  // Test logic
});
```

## 🚀 Development

### Hot Module Replacement

Bun supports HMR out of the box:

```bash
bun --hot src/index.tsx
```

### TypeScript

Bun includes TypeScript support by default:

```typescript
import { type BunFile } from "bun";
```

### Using Bun.serve

```typescript
const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Welcome to MDU Interface!");
  },
});

console.log(`Listening on http://localhost:${server.port}`);
```

## 📦 Building for Production

```bash
# Build the application
bun build ./src/index.tsx --outdir ./dist

# Run the production build
bun run dist/index.js
```

## 🔧 Performance Optimization

Bun provides several performance advantages:

- Native TypeScript/JSX support
- Built-in bundler
- Fast dependency installation
- Efficient hot reloading
- Quick test execution

## 🔌 API Integration

Using Bun's fetch:

```typescript
const response = await fetch(`${env.VITE_API_URL}/extraction/start`, {
  method: 'POST',
  body: formData,
});
```

## 🚀 Deployment

1. Build the project:
```bash
bun build
```

2. Run in production:
```bash
NODE_ENV=production bun start
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

## 🐛 Debugging

Bun provides built-in debugging capabilities:

```bash
bun --inspect src/index.tsx
```

## 📈 Performance Monitoring

```bash
bun run --profile
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- Lead Developer: [Name]
- UI/UX Designer: [Name]
- Project Manager: [Name]

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
