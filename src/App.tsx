// mdu/src/App.tsx
import { HashRouter as Router, Routes, Route } from "react-router-dom"; // Change this line
import { useEffect } from "react";
import Layout from "./components/windowed/layouts";
import Downloads from "./components/downloads/download";
import Converter from "./components/converter/converter";
import { WelcomeTour } from "./components/tour/welcome";
import { useLocalStorageBoolean } from "./hooks/uselocalstorage";
import "./utils/i18n";
import { ThemeProvider } from "@/components/themeprovider"
import StemExtractor from "./components/stemextractor/stemextract";
import DonatePage from "./components/donate";
import { preloadFonts } from "./utils/preloadfonts";

function App() {
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorageBoolean('has-seen-welcome', false);
  const [showWelcome, setShowWelcome] = useLocalStorageBoolean('show-welcome', true);

  useEffect(() => {
    if (!hasSeenWelcome && showWelcome) {
      setShowWelcome(true);
    }
  }, [hasSeenWelcome]);

  useEffect(() => {
    preloadFonts();
  }, []);

  const handleCloseWelcome = () => {
    setHasSeenWelcome(true);
    setShowWelcome(false);
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Downloads />} />
            <Route path="/converter" element={<Converter />} />
            <Route path="/stem-extractor" element={<StemExtractor />} />
            <Route path="/donate" element={<DonatePage />} />
            <Route
              path="*"
              element={
                <div className="p-4 text-center text-gray-400">
                  Page not found
                </div>
              }
            />
          </Routes>

          <WelcomeTour
            isOpen={showWelcome}
            onClose={handleCloseWelcome}
          />
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;