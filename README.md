# Dithering App

A web-based application for applying ordered Bayer dithering to images.

## Summary

This application allows users to upload images, apply dithering effects, and adjust various image parameters such as contrast, brightness, and pixelation. The app uses WebGL and the Three.js library for rendering and processing images.

## Dependencies

- [Three.js](https://threejs.org/)
- [Tweakpane](https://tweakpane.github.io/docs/)
- [Tweakpane Plugin File Import](https://github.com/LuchoTurtle/tweakpane-plugin-file-import)

## Features

- [x] Drag and drop to load images
- [x] Save image into PNG or JPG
- [x] Choose threshold map
- [x] Adjust contrast and brightness
- [ ] Adjust hue (for colored palettes)
- [ ] Choose from palettes
  - [ ] Black and white
  - [ ] Custom

## TODO

- [x] UI reset params
- [x] UI clean up
- [ ] UI styling consistent with entire page
- [ ] Disable/enable dither
- [ ] Decouple editor from actual image processing
- [ ] Add some information with logging
- [ ] Create output filename from uploaded filename
- [ ] Output size choice: original, pixelated. Show resolution in gui
- [ ] Pixelate should be part of "general params" ?

## License

This project is licensed under the MIT License.
