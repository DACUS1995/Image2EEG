# Image2EEG
Electron application that displays a slideshow, records EEG signals from a BCI headset and saves the captured data in a csv file with the same name as the original image.
It uses the CyKIT acquisition server.

---

Requirements:
* Node.js ^10
* [CyKit](https://github.com/CymatiCorp/CyKit)

---

Instructions:
``` bash
# install dependencies
npm install

# start the application
npm run start-electron

# build application
npm run build-osx (for OS X / macOS)
npm run build-linux (for Linux)
npm run build-win (for Windows)
```
