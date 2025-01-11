
from PIL import Image

# Open the PNG image
png_image = Image.open('./app.png')

# Convert to ICO format
png_image.save('./app.ico', format='ICO')

# Convert to ICNS format (macOS only)
png_image.save('./app.icns', format='ICNS')