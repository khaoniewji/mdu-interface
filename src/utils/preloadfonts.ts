export const preloadFonts = () => {
    const fonts = [
      { family: 'MonaSans', url: '../assets/fonts/monasans/Mona-Sans.ttf' },
      { family: 'Sarabun', url: '../assets/fonts/sarabun/Sarabun-Regular.ttf' },
      { family: 'Sarabun', url: '../assets/fonts/sarabun/Sarabun-Bold.ttf' },
      { family: 'Sarabun', url: '../assets/fonts/sarabun/Sarabun-Italic.ttf' },
      // Add other fonts here
    ];
  
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font.url;
      link.as = 'font';
      link.type = 'font/ttf';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  };