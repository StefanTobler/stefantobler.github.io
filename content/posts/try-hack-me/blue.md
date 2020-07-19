---
title: Blue
date: 2020-05-26
hero: /images/posts/try-hack-me/blue.gif
categories:
- "try-hack-me"
---

## Tools

* metasploit
* nmap

## Walkthrough

First things first. Let's conduct a scan on the box using the command `nmap -sS -sV -A $IP` and pipe the output to the file `nmap_out.txt`. You can review the scan results there. Looking at the results the machine is running Windows 7 Professional 7601. If we google this version number we can find out that this version might be vulnerable to the "EternalBlue" (MS17-010) vulnerability. You can read more about it [here](https://www.exploit-db.com/exploits/42315). Now that we are done with recon, we can begin to try and gain access.

To gain access we are going to be using `metasploit`. To start `metasploit` use the command `msfconsole`. Then let's ping the server just to be sure that we can connect. `ping $IP`. In the `metasploit` console we can use the command `search MS17-010` to see exploits we can use. Next we can see payload 3 that has the title `exploit/windows/smb/ms17_010_eternalblue`. This is the code will will use to run against the machine. Now that these payloads are found we can use the command `use 3` to load the payload. Now that we have our payload set we can the options. Use the command `show options` to see which options we need to set in order to use our attack. We can see that the only field that is required but not set is the `RHOSTS`. To set this field we can use the command `set RHOSTS 10.10.100.140`. Now when we do `show options` again we should be able to see our target IP address. Now that all the options are set run the command `exploit` to launch our payload.

Now that we have access to the machine that we want, we can upgrade our shell to a `meterpreter` shell. The easy way to do this, given that we have already put the shell in the background using CTRL-Z. We can use the command `sessions` to see the sessions. In my instance the session we are interested in has the ID 1. So I will use the command `sessions -u 1`. But you can also use the module `post/multi/manage/shell_to_meterpreter`, then use the command `use post/multi/manage/shell_to_meterpreter`. Now that we are using the post exploit module we can set the SESSION option to the session ID. Use the command `set SESSION 1`. Now that the session is set, let's fire up the meterpreter. Now let's `run`. Once execution is complete press enter and select the new meterpreter session from our available sessions. Use the command `sessions 2`. Now that we are in the meterpreter shell we can use the command `shell` then `whoami` to verify that we are the `nt authority\system` user. Now let's take a look at the processes using the command `ps`. Write down a process id towards the bottom of the list to migrate to. This might be unstable and not work the first time. If it fails try again (this is what tryhackme says). I used the `LiteAgent.exe` process and it worked. Now that we have bigrated the process let's get the user's hashes. Use the command `hashdump` and if the privileges were escalated correctly we should see all the users and their hashes. We can also see that there is a user named 'Jon'. Now to crack his password. I used the website [CrackStation](https://crackstation.net/). To crack the password. Turns out this user's password is `alqfna22`.

The first flag can be found in the root directory in the file `flag1.txt`. The third flag is in the user Jon's documents. The second flag is found in the directory `C:/Windows/system32/config`. This is also the directory where windows passwords are stored. Interesting stuff.

This was a fun box and I feel like I have a better understanding of navigating through Windows directories and using the metasploit.
