# Playdate AntiMirror

> Stream your artwork, game content, or any application's pixels in real-time from your desktop to your Playdate. Thanks to modern browser technology, this works on macOS, Windows and Linux without any apps. All you need is a USB cable.

[![MAD](https://img.shields.io/badge/built%20at-Memfault%20hackathon-blue)](https://memfault.com)
[![Playdate](https://img.shields.io/badge/made%20for-Playdate-yellow)](https://play.date)
[![license](https://img.shields.io/github/license/hbehrens/pd_antimirror)](https://github.com/hbehrens/pd_antimirror/blob/master/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=shields)](http://makeapullrequest.com)

[![Playdate Mirror in Action](https://img.youtube.com/vi/LB0I2HmXF-8/0.jpg)](https://youtu.be/LB0I2HmXF-8?si=AZ9uoZvN4EYlC0jS&t=218)

# Why does this exist?
[Heiko Behrens](https://heikobehrens.com) built this during ["Memfault Awesome Day"](https://memfault.com), Memfault's regular internal hackathon, to experiment with browser technology.
This tool is not affiliated with Panic, the makers of Playdate.
However, the name "Playdate AntiMirror" was inspired by [Panic's official tool "Mirror"](https://play.date/mirror/) as it does exactly the opposite. 

May this tool help game designers, graphic artists, or game developers to quickly test or iterate on their ideas so we will see even more amazing content for the Playdate!

# What's next?
Right now, there are no immediate plans to work on this further.
If you want to carry this forward, here are some potential follow-up ideas:
* [ ] Documentation on how to best use the tool on various tools (Aseprite, Gimp, Rive, etc.)
* [ ] Documentation on how to use this on conjunction with the Playdate Simulator
* [ ] Ability to Pause/Throttle streaming
* [ ] Store capture region (x/y/w/h), e.g. in the URL
* [ ] Extended choice/configuration options of quantization methods
* [ ] Increased framerate by compressing pixel data (requires Playdate app)
* [ ] Improve code quality (this was a product manager attempting to write code during a hackathon 🙈)

If you find a bug, please file an issue.
If you happen to use the tool and even like it, please star this project or leave a note!

# How does it work?
This is a single-page web application written with TypeScript, React, and Vite. It…
1. …captures any window or entire screen via [Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture#browser_compatibility)
2. …scales content to Playdate's 400x240px and reduces colors to monochrome (different dithering strategies available)
3. …sends the resulting pixels via [Web Serial](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility) using Playdate's built-in `sendimage` command (via [pd-usb](https://github.com/cranksters/pd-usb))
4. …does this continuously to achieve ~10 fps

# License

This tool is published by [Heiko Behrens](https://HeikoBehrens.com) ([Memfault](https://memfault.com)) under the MIT License. Please have a look at [LICENSE](LICENSE) for more details.