# Hey Folks!

A friend of mine asked me if I could do this, and I've spent the past week and change putting it all together. After getting it into a more or less polished state, I've done a bit of research and figured out someone else has had the same idea, and came up with some of the same solution. But, since I spent so much time on it, I thought I'd share it. Perhaps the wonderful folks who made [Optical Breacher](https://govizlora.github.io/optical-breacher) can use some of what I've put together to their advantage.

# Where to get it
You can get it here: [https://github.com/foxbird/jackbreacher](https://github.com/foxbird/jackbreacher).

# Background

This is a brute force solver. It calculates all the possible paths available to you at the provided memory size. It then walks through each of those possibilities applying the breach protocol rules and scores each of them that finds at least one solution. You can specify any memory/buffer size you like, but make sure that the provided matrix can generate possibilities that will use that buffer. On a buffer size of 8, it takes about 2 seconds to do the work.

The program will also OCR and apply some logic fixes to the results to try and get the best possible matrix values for you. It doesn't process or read in the sequences from the screen. This was to keep from having to provide overlays on the camera and to make the user line it all up. That's probably a better 'next step' for it.

This is written in C# on the backend using .Net Core, uses some custom Javascript for making things pretty, handling camera and image pasting, and so on. And it also uses Croppie for image cropping, and Tesseract for OCR handling. It could probably all be done in JS directly, but I'm not sure how well Tesseract support is in the JS only variety. And I really wanted to make sure I get Tesseract's legacy mode since I didn't think an AI trained on english would be great at just simple character recognition as opposed to word-based recognition.

Yes, the name is a pun. The original solver I wrote earlier to test the algorithm was just 'CPBreacher' for 'Cyberpunk Breacher'. I wanted something catchier, and 'Jack Breacher' popped into my head. So it stuck. 'Optical Breacher' (the other project) is better sounding, but I like my awful pun.

# Capturing an Image

This uses two options to get the image. The first is your camera. It'll first open your default camera to get the list of devices (which will prompt a camera permissions check). It'll then enumerate them so you can choose which camera you want to use. You pick your camera, snap the photo, and move on to the next step. The other option is to use your clipboard. It's been tested with chrome on windows and on my android device (galaxy s9+). It works fine on both.

# Cropping the Image

This uses the Croppie JS library to let the user crop the image from their camera. Just zoom it in and out, fit it in the square as close to the edges as possible without going over. When you're done, press the button and it'll submit it the server for processing.
OCR

First, the image is converted to greyscale and then the color inverted. This gets black on white text, which seems to work better generally. It then applies a threshold calculation to try and get rid of any background colors, lines, etc that seem to confuse Tesseract. The value is experimental and likely could use some tweaking. But this seems to work with my TV and with screenshots as well. Your mileage may vary. The formula I use is to find the highest concentration of grey colors, make the assumption that it's the grey bar at the top, and then hop back about 100-130 pixels to find a good threshold. Another option is to average the first 10x10 pixels in the upper left corner and take any value above that. Lots of options to fiddle with.

The OCR process uses tesseract (since that really seems to be the only free OCR package, and I wasn't going to pay amazon to do it). It uses the legacy and AI assisted modes, which seems to work fairly well. And it also uses SingleBlock mode for paging. It's slightly better than sparse mode. Everything else doesn't produce nearly as good results.

The result from OCR is then filtered down and some guesses are applied. Characters that don't make sense, aren't allowed, etc are all replaced. Since it seems there are only 6 actual 'values' for each of those cells in the matrix, it tries to apply some guesses in case the OCR was off. This seems to bring up the accuracy a good bit, but it can get it wrong.

Since it's all an informed guess, a user should probably verify it before we spend all the effort solving it. So we do that.

# Sequence Entering and Matrix Verification

The results from the OCR are returned to the web application and shown to the user. The user can then change any cells that were missed or fix up anything that may not look just right. You can also skip directly there and enter the matrix yourself. No reason to use cameras or images if you don't want to.

Since the OCR and image capture doesn't handle the sequences (to keep things easy to find and avoid having to do my own magic on the image parts), the user will need to enter them manually.

The entering and updating cells parts has some Quality of Life additions to make it easier to enter and adjust items. You can also weight things differently (the V column). So if you want it to solve one thing more than another, you can adjust the weights. It defaults to 1, 2, 3, and 4 for each sequence.

# Solving

After pressing solve, it'll submit it to the backend and brute for its way through the algorithm. When it's done, it returns the 'best' solution given your weight. It'll return a message like so:

```
Best solution:
  Solved: 3, 1, 2 for 6 total
  Start Chain: 4
  Solution:
    1C (1,B)
    55 (2,B)
    1C (2,E)
    55 (6,E)
    7A (6,B)
    55 (5,B)
    E9 (5,D)
    55 (3,D)
```

This basically tells you what to click on in the matrix and the best solution. The first line tells you that it solved a 3 point, then a 1 point, and a 2 point, for 6 total points. The 'chain' is 4, meaning it got to use 4 characters before it either jumped to a new sequence or ran out of matches (in this case it consumed the whole 4-length sequence). The reason it does this is so that it tries to avoid wasting characters at the beginning of a solve (which is sometimes needed).

A 'faster' solution is to just stop when it has a 'best' full-value solution. This would indeed save some CPU cycles.

# Running It

Basically you need to download the code there (clone it or just download the zip). Once you have it downloaded you need to make sure you have the .NET CORE SDK 3.1 installed. Once you have it checked out, these commands will get it up and running:

```
dotnet restore
dotnet run
```

Then just point your browser at [https://127.0.0.1:5001](https://127.0.0.1:5001) and give it a go. You may need to allow/permit the developer certificate for it to work. Otherwise you won't get camera or clipboard support. Then just following it along. This also listens on 'all ips' as well, so if your desktop and your phone are on the same network, you can change `127.0.0.1` for your desktop IP.

# Screenshot
And here's a screenshot of the solver in it's solved state (the other tabs aren't much to look at it).

![Matric Solve Screenshot](docs/breacher.png?raw=true "Matrix Solve Page")

# Improvements
It's good enough for me at the moment, so I'm happy with it. But, it could obviously use a fancy UI for its various features. It could probably also do with a capture mode that grabs the sequences as well. And certainly a nice graphical way to show the solution. It's probably also worth combining it with the other project as well, or finding ways to share. I like the idea of training it instead of using english. That'd hopefully improve it a lot. I'm open to some collaboration if anyone wants to talk about it.

Feel free to let me know if anyone finds any value in it! I don't plan on 'supporting' it really, but I do expect to give it updates on occasion as I find ways to improve it.

# Debugging
It will write out images into a ProcessedImages folder. If you use it a lot, I suggest cleaning out these files every so often. This gives you a quick look at what it's doing to the source image to process it for Tesseract. If you get a lot of black where you should see numbers, look for the Threshold value in the OcrHandler.cs file. Adjust it around until you find something that matches you lighting and TV to see if it improves it for you.
