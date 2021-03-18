---
title: Nahamcon 2021 CTF
date: 2021-03-13
hero: /images/content/posts/ctf/nahamcon_2021.png
categories:
  - ctf
tags:
  - cryptography
  - web-security
  - osint
---

This is my second time competing in the Nahamcon CTF. It is very well managed and has some good challenges. This year I didn't have as much time to compete due to some overlapping assignments, but here are the write ups I threw together.

## Read The Rules

This is a super simple challenge, really a warm up. Navigate to the rules page of the ctf, then view the page source. From here we can just `ctrl+f` for `flag{` and there it is!

![source of the rules page](/images/content/posts/ctf/nahamcon_2021/source.png)

## Shoelaces

What do we have here? Images are pretty cool challenges, sometimes they can be super tough and other times they can be as easy as looking at the meta data.

![shoelaces](/images/content/posts/ctf/nahamcon_2021/shoelaces.jpg)

In this case it is the latter, the first thing I do whenever I get an image file in a challenge is run the `strings` command on it. In this case if we `grep` for `flag`, it shoots right out to us! Go ahead try it for yourself!

## esab64

Again, let's check to see what kind of file this is with the `file` command. Still just a text file. Open it up and we see the following:

`mxWYntnZiVjMxEjY0kDOhZWZ4cjYxIGZwQmY2ATMxEzNlFjNl13X`

Now let's do some research on esab64. What exactly could that mean? Well did you do your research? What did it tell you? Before you answer that, did you notice anything strange about the title of this challenge? Look closely. Yep you are almost there. Read it backwards! **BASE64!**. Throw it into a converter and see what happens! Wait? That doesn't look right. Ahh, maybe try reversing it. `_}e61e711106bd0db1b78efa894b1125bf{galf` Well that better, but not exactly what we want, let's try reversing it again, there we go! `flag{fb5211b498afe87b1bd0db601117e16e}`.

## Car Keys

Okay so we are given the encrypted flag `ygqa{6y980e0101e8qq361977eqe06508q3rt}` and the key `QWERTY`. Right off the bat I wanted to try a repeating Vigenère cipher, but this didn't seem to do it, next I tried seeing what would happen if I used the key and `XOR`ed it with the encrypted flag, again just a mess. I am going to keep researching car key encryption since the titles seem to have a strong correlation to how to approach the problem.

So, it doesn't look like this has to do with my car research, but that was interesting, I might need to see if I can hack my own car. However, I did manage to fumble around Rumkin.com and find the keyed caesar cipher. Turns out this caesar cipher uses the key as the first elements in the alphabet, then shifts the rest down by some shift amount. This is how the flag was encrypted. I just threw in the key, 0 shift and I saw the tell take `flag` keyword! `flag{6f980c0101c8aa361977cac06508a3de}`

## Buzz

Like always I first run the `file` command to see what I am dealing with. In this case `buzz` is a `compress'd data 16 bits`. I was like "hmm what is this", so I googled it and found out that it is a compression with the ending `.z` and it can be decompressed using the `uncompress` command. So I changed the file from `buzz` to `buzz.z` and ran `uncompress buzz.z`. This gave me the flag!

`flag{b3a33db7ba04c4c9052ea06d9ff17869}`

## Chicken Wings

Alright, just like the other files, let's see what kind of file this is. Running the command `file chicken_wings` tells us that this is a UTF-8 formatted text file, and upon catting it out, there is a lot of characters that I do not understand. `♐●♋♑❀♏📁🖮🖲📂♍♏⌛🖰♐🖮📂🖰📂🖰🖰♍📁🗏🖮🖰♌📂♍📁♋🗏♌♎♍🖲♏❝`, most of them won't even show up here. I am not too sure how to approach this problem to be honest. I am going to do some google searching and see what I can find.

So it turns out that a lot of these characters are emojis and there are definitely enough characters to be the flag. Like I mean exactly enough, 40.

Well, after some chatter with another one of the guys in the club, and some more google searching, it turns out that this is actually a font pack called "Wingdings", after throwing it into a decoder, the flag appeared!

`flag{e0791ce68f718188c0378b1c0a3bdc9e}`

## Pollex

For this challenge we are given a file called `pollex`, after running the `file` command it tells us that this is a `jpeg` image. I am going to try and see if I can open it. Yep, it can be opened.

![challenge image](/images/content/posts/ctf/nahamcon_2021/pollex.jpg)

Now let's check to see if it has any usefil metadata. The command `exiftool` allows me to see any metadata attached to this photo, including the time it was taken, the camera it was taken on, aspect ratio, and a ton more if the image supports it.

```
ExifTool Version Number         : 12.16
File Name                       : pollex
Directory                       : .
File Size                       : 37 KiB
File Modification Date/Time     : 2021:03:13 12:17:08-05:00
File Access Date/Time           : 2021:03:13 12:17:08-05:00
File Inode Change Date/Time     : 2021:03:13 12:17:19-05:00
File Permissions                : rw-r--r--
File Type                       : JPEG
File Type Extension             : jpg
MIME Type                       : image/jpeg
JFIF Version                    : 1.01
Resolution Unit                 : None
X Resolution                    : 1
Y Resolution                    : 1
Exif Byte Order                 : Little-endian (Intel, II)
Image Description               : Man giving thumb up on dark black background.
Software                        : Google
Artist                          : Stevanovic Igor
Copyright                       : (C)2013 Stevanovic Igor, all rights reserved
Exif Version                    : 0220
Color Space                     : sRGB
Interoperability Index          : R98 - DCF basic file (sRGB)
Interoperability Version        : 0100
Compression                     : JPEG (old-style)
Thumbnail Offset                : 334
Thumbnail Length                : 26693
XMP Toolkit                     : XMP Core 4.4.0-Exiv2
Creator Tool                    : Google
Description                     : Man giving thumb up on dark black background.
Rights                          : (C)2013 Stevanovic Igor, all rights reserved
Creator                         : Stevanovic Igor
Current IPTC Digest             : c7c2ff906c74de09234ddcb2c831803b
Envelope Record Version         : 4
Coded Character Set             : UTF8
Application Record Version      : 4
By-line                         : Stevanovic Igor
Credit                          : igor - Fotolia
Copyright Notice                : (C)2013 Stevanovic Igor, all rights reserved
Caption-Abstract                : Man giving thumb up on dark black background.
IPTC Digest                     : c7c2ff906c74de09234ddcb2c831803b
Image Width                     : 424
Image Height                    : 283
Encoding Process                : Baseline DCT, Huffman coding
Bits Per Sample                 : 8
Color Components                : 3
Y Cb Cr Sub Sampling            : YCbCr4:2:0 (2 2)
Image Size                      : 424x283
Megapixels                      : 0.120
Thumbnail Image                 : (Binary data 26693 bytes, use -b option to extract)
```

This file has a ton of data attached to it. No flag, but still useful none the less. If my initial approaches don't work I will definitely be searching `Stevanovic Igor` and see how he relates to this photo besides the rights.

Next, I am going to try a `strings` to see if there is any sign of life in the image like that, and nothing. This is to be expected since we already had a challenge that used the `strings` command in it's solution. My next approach is going to be changing the contrast, the image is mostly black, so there could definitely be something hidden in the darkness, playing around with some of the colors might reveal something to us. Again, a bust. However, when I turned up the exposure I did notice some artifacts in the background, particularly the part right above my mouse.

![artifacts](/images/content/posts/ctf/nahamcon_2021/artifacts.png)

Time to start doing some research. What is "pollex" and who is "Stevanovic Igor". Well, honestly it looks on the surface that both of those things are just there, I mean "pollex" just means thumb, and "Stevanovic Igor" is really the author of the original photo.

Something did come to mind tho when considering this problem further, why are thumbs referenced everywhere in this challenge, then I recalled the last line of the `exif` data. "Thumbnail Image : (Binary data 26693 bytes, use -b option to extract)", what if the flag is embedded in the thumbnail of the image? I always thought that the thumbnail for an image is just a resized version of the image itself, but it looks like it is actually a meta data attribute that can be changed. I mean this makes sense, videos have thumbnails that can be anything, why can't this principal apply to images. I am going to play with this idea a bit more.

That's it! There was another image in the thumbnail! Maybe I need to spend more time in the GUI rather than in the command line hahah. I used the website `dcode` to extract the image.

![flag](/images/content/posts/ctf/nahamcon_2021/flag_pollex.png)

## Veebee

Alright, so we have a script called `veebee.vbe`. a quick google search tells us that this is a visual basic script. If we cat it out it it garbage, it must be the binary or something like that, but then again it might not be. A quick hex dump reveals that most the data is ascii printable, which is not very likely with binary data.

```
00000000: 270a 270a 2340 7e5e 4841 4141 4141 3d3d  '.'.#@~^HAAAAA==
00000010: 7e2c 507e 2c50 2c50 502c 502c 7e50 2c50  ~,P~,P,PP,P,~P,P
00000020: 7e50 2c50 7e7e 2c50 502c 7e50 6741 4d41  ~P,P~~,PP,~PgAMA
00000030: 4141 3d3d 5e23 7e40 0a23 407e 5e71 6741  AA==^#~@.#@~^qgA
00000040: 4141 413d 3d76 2c2e 6e7f 417f 2b50 5457  AAA==v,.n.A.+PTW
00000050: 7f64 5028 4522 792c 343b 222e 4026 4240  .dP(E"y,4;".@&B@
00000060: 2676 4026 742f 6f7e 4761 6072 3f4b 442e  &v@&t/o~Ga`r?KD.
00000070: 5853 7e09 574f 5044 346c 4450 6e43 6b58  XS~.WOPD4lDPnCkX
00000080: 2245 6240 2648 646f 7e47 5860 457d 336d  "Eb@&Hdo~GX`E}3m
00000090: 587e 2c6c 314f 456d 5673 5842 507a 4721  X~,l1OEmVsXBPzG!
000000a0: 4244 7f7e 4462 6f74 4420 7e71 4450 622f  BD.~DbotD ~qDPb/
000000b0: 7e59 3443 4450 6e6c 6b7a 5272 2340 265c  ~Y4CDPnlkzRr#@&\
000000c0: 6b6f 4147 6176 4a57 566d 4c50 3030 5a2a  koAGavJWVmLP00Z*
000000d0: 6c2c 2639 2c32 6630 6c63 6626 3620 4354  l,&9,2f0lcf&6 CT
000000e0: 5730 2152 2b30 5721 2139 305e 3872 2368  W0!R+0W!!90^8r#h
000000f0: 6a4d 4141 413d 3d5e 237e 4000            jMAAA==^#~@.
```

There are some `=`s which usually denotes base64 encoding, but the characters preceding the `=` are not in the base64 range, like `~`. After some more research, it seems that `.vbe` scripts are usually encrypted visual basics, but they can still be run. I have tried a few decoders, but they all end up outputting only spaces. What is going on? Okay, I think I figured it out. I am such a fool, let's take a look a the `.vbe` file we were given.

```
'
'
#@~^HAAAAA==~,P~,P,PP,P,~P,P~P,P~~,PP,~PgAMAAA==^#~@
#@~^qgAAAA==v,.nA+PTWdP(E"y,4;".@&B@&v@&t/o~Ga`r?KD.XS~	WOPD4lDPnCkX"Eb@&Hdo~GX`E}3mX~,l1OEmVsXBPzG!BD~DbotD ~qDPb/~Y4CDPnlkzRr#@&\koAGavJWVmLP00Z*l,&9,2f0lcf&6 CTW0!R+0W!!90^8r#hjMAAA==^#~@
```

Encrypted bits start with `#@~^XXXXXX==` and end with `==^#~@`, notice anything strange about this string up there? Yep, that's right, there are two encrypted portions, the first one contains nothing. The second one, yep that is what we are looking for. Make a copy of the hex file, then open it with `hexeditor -b veebee_clipped.vbe`. Once in the editor delete everything until you get to `#@~^qgAAAA==v`. The editor should look like this.

![hexeditor](/images/content/posts/ctf/nahamcon_2021/hexeditor.png)

Once you have removed the first encrypted bit, save the file and use the site [https://master.ayra.ch/vbs/vbs.aspx](https://master.ayra.ch/vbs/vbs.aspx) to decrypt the script. Save it and just cat it out!

![flag](/images/content/posts/ctf/nahamcon_2021/flag_vbe.png)
`flag{f805593d933f5433f2a04f082f400d8c}`

## Eight Circle

After downloading the file, the first thing I wanted to do what see what type it was. I used the command `file eighth_circle`, which returned that it was just an `ascii` file (text file). Let's open it up and see what is inside.

```
D'`r#LK\[}{{EUUTet,r*qo'nmlk5ihVB0S!>w<<)9xqYonsrqj0hPlkdcb(`Hd]#a`_A@VzZY;Qu8NMRQJn1MLKJCg*)ED=a$:?>7[;:981w/4-,P*p(L,%*)"!~}CB"!~}_uzs9wpotsrqj0Qmfkdcba'H^]\[Z~^W?[TSRWPt7MLKo2NMFj-IHG@dD&<;@?>76Z{9276/.R21q/.-&J*j(!E%$d"y?`_{ts9qpon4lTjohg-eMihg`&^cb[!_X@VzZ<RWVOTSLpP2HMFEDhBAFE>=BA:^8=6;:981Uvu-,10/(Lm%*)(!~D1
```

That looks like a whole lot of garbage. I am gonna throw it into `cyberchef` and see if the `magic` function can make anything of it. Nothing. Time to look into some of the verbiage used in the challenge.

Upon a quick google search of `eighth circle`, I got a few references to Dante's Inferno and the circles in hell. The eighth circle is where people who have committed fraud and are corrupt are sentenced to burn for the rest of eternity. The phrase "abandon all hope ye who enter here" is also a reference to Dante's inferno. It is the supposed inscription at the gate of hell. Interesting, maybe the title of the challenge is trying to let us know that this file is corrupted? How exactly do we go about fixing an encrypted file anyways? I am going to start by taking a look at it's dump.

```
00000000: 4427 6072 234c 4b5c 5b7d 7b7b 4555 5554  D'`r#LK\[}{{EUUT
00000010: 6574 2c72 2a71 6f27 6e6d 6c6b 3569 6856  et,r*qo'nmlk5ihV
00000020: 4230 5321 3e77 3c3c 2939 7871 596f 6e73  B0S!>w<<)9xqYons
00000030: 7271 6a30 6850 6c6b 6463 6228 6048 645d  rqj0hPlkdcb(`Hd]
00000040: 2361 605f 4140 567a 5a59 3b51 7538 4e4d  #a`_A@VzZY;Qu8NM
00000050: 5251 4a6e 314d 4c4b 4a43 672a 2945 443d  RQJn1MLKJCg*)ED=
00000060: 6124 3a3f 3e37 5b3b 3a39 3831 772f 342d  a$:?>7[;:981w/4-
00000070: 2c50 2a70 284c 2c25 2a29 2221 7e7d 4342  ,P*p(L,%*)"!~}CB
00000080: 2221 7e7d 5f75 7a73 3977 706f 7473 7271  "!~}_uzs9wpotsrq
00000090: 6a30 516d 666b 6463 6261 2748 5e5d 5c5b  j0Qmfkdcba'H^]\[
000000a0: 5a7e 5e57 3f5b 5453 5257 5074 374d 4c4b  Z~^W?[TSRWPt7MLK
000000b0: 6f32 4e4d 466a 2d49 4847 4064 4426 3c3b  o2NMFj-IHG@dD&<;
000000c0: 403f 3e37 365a 7b39 3237 362f 2e52 3231  @?>76Z{9276/.R21
000000d0: 712f 2e2d 264a 2a6a 2821 4525 2464 2279  q/.-&J*j(!E%$d"y
000000e0: 3f60 5f7b 7473 3971 706f 6e34 6c54 6a6f  ?`_{ts9qpon4lTjo
000000f0: 6867 2d65 4d69 6867 6026 5e63 625b 215f  hg-eMihg`&^cb[!_
00000100: 5840 567a 5a3c 5257 564f 5453 4c70 5032  X@VzZ<RWVOTSLpP2
00000110: 484d 4645 4468 4241 4645 3e3d 4241 3a5e  HMFEDhBAFE>=BA:^
00000120: 383d 363b 3a39 3831 5576 752d 2c31 302f  8=6;:981Uvu-,10/
00000130: 284c 6d25 2a29 2821 7e44 31              (Lm%*)(!~D1
```

Nothing really looks out of place, at least on my first examination. A thought that comes to mind, is "what if the endianess is backwards?". This doesn't seem like the right approach, but I am going to try it anyways. Okay, so that didn't work, but I have figured it out. After reading more about the eight circle of hell, it turns out it has another name "Malebolge", and when you visit this wikipedia page, guess what is at the top.

> _For the programming language, see Malbolge._

If we visit that page, the code example for "Hello World" looks like this.

```
 (=<`#9]~6ZY32Vx/4Rs+0No-&Jk)"Fh}|Bcy?`=*z]Kw%oG4UUS0/@-ejc(:'8dc
```

Similar? Ya I think so to. Let's figure out how to run this "counter-intuitive 'crazy operation', base-three arithmetic, and self-altering code.", and get that flag.

I found a compiler online and ran the provided hell code. The flag popped right out! `flag{bf201f669b8c4adf8b91f09165ec8c5c}`

## $Echo Methodology

For this challenge we are greeted with a page that has a prompt to send information to the back end, and it will send it back to us.

![hello world test](/images/content/posts/ctf/nahamcon_2021/hello_world.png)

I am going to try and embed the `ls` command into the echo command to see if we can breakout of the `echo` command.

![ls command](/images/content/posts/ctf/nahamcon_2021/ls.png)

Uhh oh, looks like they are filtering input into this program. Hmm let's research other ways to run commands inside of `echo`. I found an interesting way of running commands with backticks. This sounds like something new, let's try that.

![ls with backtick](/images/content/posts/ctf/nahamcon_2021/backtick.png)

Okay great! We got our code to execute and we see that there is a file called `index.php` inside this directory, I am going to cat it out to see what is in it.

![index.php](/images/content/posts/ctf/nahamcon_2021/index.png)

It is a bit lacking in the image, but if we inspect the element with the chrome browser tool we get the following `php` code.

```php
<?php
  $to_echo = $_REQUEST['echo'];
  $cmd = "bash -c 'echo " . $to_echo . "'";
  if(isset($to_echo)) {
    if($to_echo=="") {
        print "Please don't be lame, I can't just say nothing.";
    } elseif (preg_match('/[#!@%^&*()$_+=\-\[\]\';,{}|":-->?~\\\\]/', $to_echo)) {
        print "Hey mate, you seem to be using some characters that makes me wanna throw it back in your face >:(";
    } elseif ($to_echo=="cat") {
        print "Meowwww... Well you asked for a cat didn't you? That's the best impression you're gonna get :/";
    } elseif (strlen($to_echo) > 15) {
      print "Man that's a mouthful to echo, what even?";
    } else {
      system($cmd);
    }
  } else {
    print "Alright, what would you have me say?";
  }
?>
```

Okay, so the script does not allow the characters `[#!@%^&*()$_+=\-\[\]\';,{}|":-->?~\\\\]`. But where is the flag? Try traversing some directories and see what you can find.

![directory traversal](/images/content/posts/ctf/nahamcon_2021/back_dir.png)

Look at that! It is in the previous directory. Now to cat it out and we are done!

![catting out the flag fail](/images/content/posts/ctf/nahamcon_2021/cat_flag.png)

Dang it, too many characters really?? We've got to think of another way to do this? How else can we make the flag appear on screen? What if we utilize redirection in our command injection? Let's try this.

![this is the flag](/images/content/posts/ctf/nahamcon_2021/flag_echo.png)

Look at that it works! This was a pretty interesting web exploit challenge that really took some understanding of unix, but the great thing is that all of this stuff can be found on StackOverflow with some half decent googling skills.

`flag{1beadaf44586ea4aba2ea9a00c5b6d91}`

## Closing Thoughts

Whether you read all the challenges, or just one I hope you learned a thing or two from it! CTFs are a great way to learn how to think about problems and learn to approach problems in new ways! Just remember, keep learning and searching for the next challenge.
