---
title: Fuzzy
date: 2020-05-13
categories:
- hack-the-box
tags:
- fuzzing
- enumeration
---

Fuzzy challenged the user on the basics of fuzzing and taught me how to use wfuzz and other techniques to learn information about my target machine. I suggest anyone who would like to learn about fuzzing take on this challenge.

## Tools

* gobuster
* wfuzz

## Walkthrough

First thing I am going to try and do is navigate to `robots.txt`, but it looks like it is not there. Next we are going to run `gobuster` to figure out if there are any other server urls that we can navigate to and exploit. Dirbuster found a directory called `/api/`.

Next we are going to do another scan in the api directory using the command `gobuster dir -u http://docker.hackthebox.eu:31883/api -w /usr/share/wordlists/dirb/common.txt -x .php,.html,.htm,.js`. I used the `-x` argument so specify the extensions I wanted to search for. You can see the results in `dirb_file_out.txt`. We found the file `action.php` and when we try to visit it in the browser it says that there needs to be a parameter.

To find the hidden parameter we can use `wfuzz` to fuzz the parameter name and find out what the request returns. Let's run the command `wfuzz -c  -w /usr/share/dirb/wordlists/big.txt http://docker.hackthebox.eu:31883/api/action.php?FUZZ=test` to start fuzzing the parameter names. Most of our responses are returning 4 words. If we user `grep -v` we can filter out all the responses that contain 4 words and maybe find the parameter name that returns something else. Run the command `cat paramfinder_out.txt | grep -v "4 W"` and we see that `reset` returns something with 5 words. Let's navigate to the web browser and see what is being returned. If you take a look at the web browser it seems that we are entering the wrong account ID. Well that is something. It looks like we found the parameter for this `action.php` file. Now to find our user.

In order to find the user we are going to use another `wfuzz` scan. Who would have thought that a challenge named "fuzzy" would require this much fuzzing. We can fuzz the user ID by using the `range` argument for `wfuzz`. You can read about it [here](https://wfuzz.readthedocs.io/en/latest/user/basicusage.html). Let's use the command `wfuzz -z range,0-100 http://docker.hackthebox.eu:31883/api/action.php?reset=FUZZ > digitfuzz.txt`. These results can be found in `digitfuzz.txt`. Again we notice that most of the parameter values return 5 words so let's try an `grep -v` again to filter out all the 5 word returns. Using the command `cat digitfuzz.txt | grep -v "5 W"` returns to us the user ID of the user who's reset was successful. Now if we go to the web browser and navigate to `http://docker.hackthebox.eu:31883/api/action.php?reset=[ID]` replacing `[ID]` with the ID that was found by our `wfuzz` scan you should be able to see the flag.
