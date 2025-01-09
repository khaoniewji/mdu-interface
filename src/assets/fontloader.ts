// fontloader.ts
// This script dynamically loads fonts from the src/assets/fonts directory.

export class FontLoader {
    private static readonly fontPaths = {
        "MonaSans": "src/assets/fonts/monasans/Mona-Sans.ttf",
        "Sarabun": {
            "Bold": "src/assets/fonts/sarabun/Sarabun-Bold.ttf",
            "BoldItalic": "src/assets/fonts/sarabun/Sarabun-BoldItalic.ttf",
            "ExtraBold": "src/assets/fonts/sarabun/Sarabun-ExtraBold.ttf",
            "ExtraBoldItalic": "src/assets/fonts/sarabun/Sarabun-ExtraBoldItalic.ttf",
            "ExtraLight": "src/assets/fonts/sarabun/Sarabun-ExtraLight.ttf",
            "ExtraLightItalic": "src/assets/fonts/sarabun/Sarabun-ExtraLightItalic.ttf",
            "Italic": "src/assets/fonts/sarabun/Sarabun-Italic.ttf",
            "Light": "src/assets/fonts/sarabun/Sarabun-Light.ttf",
            "LightItalic": "src/assets/fonts/sarabun/Sarabun-LightItalic.ttf",
            "Medium": "src/assets/fonts/sarabun/Sarabun-Medium.ttf",
            "MediumItalic": "src/assets/fonts/sarabun/Sarabun-MediumItalic.ttf",
            "Regular": "src/assets/fonts/sarabun/Sarabun-Regular.ttf",
            "SemiBold": "src/assets/fonts/sarabun/Sarabun-SemiBold.ttf",
            "SemiBoldItalic": "src/assets/fonts/sarabun/Sarabun-SemiBoldItalic.ttf",
            "Thin": "src/assets/fonts/sarabun/Sarabun-Thin.ttf",
            "ThinItalic": "src/assets/fonts/sarabun/Sarabun-ThinItalic.ttf"
        }
    };

    static loadFonts(): void {
        const fontFaces: FontFace[] = [];

        // Load MonaSans
        fontFaces.push(new FontFace("MonaSans", `url(${this.fontPaths.MonaSans})`));

        // Load Sarabun fonts
        for (const [style, path] of Object.entries(this.fontPaths.Sarabun)) {
            fontFaces.push(new FontFace(`Sarabun-${style}`, `url(${path})`));
        }

        // Add each font to the document
        fontFaces.forEach(async (fontFace) => {
            try {
                const loadedFont = await fontFace.load();
                document.fonts.add(loadedFont);
                console.log(`Font ${fontFace.family} loaded successfully.`);
            } catch (error) {
                console.error(`Failed to load font ${fontFace.family}:`, error);
            }
        });
    }
}

// Exporting FontLoader for usage in other files
export default FontLoader;