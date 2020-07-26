---
title: Vulnversity
date: 2020-05-13
hero: /images/content/posts/try-hack-me/vulnversity.png
categories:
- try-hack-me
tags:
- video
- webappsec
- privesc
- recon
---
## Tools

* nmap
* gobuster

## Walkthrough

```
export IP=10.10.22.134
```

### [Task 2]

This task is centered around using `nmap`. A port scanner that can give us information from what ports are open on a host, to the software running on those open ports. For this box we are using the IP `10.10.22.134`, and to conduct our `nmap` scan we can use the command `nmap -sV -A -v  10.10.22.134`. I am using the flags `-sV` to tell us the version of services running on each port, `-A` to enable OS detection and `-V` to enable verbose mode. You can checkout the output of my scan in `nmap_out.txt`. When analyzing out scan results we can see that there are 6 ports open: `21`, `22`, `139`, `445`, `3128`, and `3333`. We see a squid proxy running on port `3128`, version 3.5.12 to be exact. If we use the flag `-p-400` we will scan all the ports up to 400. The flag `-n` will not do DNS resolution, and the machine is probably running `Ubuntu` because it is what ports `22`, `445`, and `3333` are all running on. The web server (Apache) is running on port `3333`.

### [Task 3]

For this task we are going to run `dirbuster` to find the url path that has an upload form page. We can use the command `gobuster dir -u http://$IP:3333 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt`. The output will be located in the file `gobuster_out.txt`. If we take a look in here we can notice that there is a path called `/internal/` if we navigate to this path in the web browser we can see that it is indeed a form upload page.

### [Task 4]

After figuring out that the form does not want us to upload `.php` files we can make a custom wordlist to include the `.php` extensions. You can check out the wordlist in the `phpext.txt` file. Now we are going to try and find out what kind of file we are allowed to upload. Let's use Burp to intercept a form upload then user the Intruder function to preform a sniper attack on the form using the wordlist we created earlier. After running the attack we find that the server will allow us to upload a `.phtml` file. This gives us the opportunity to maybe use a reverse PHP shell. We can download the reverse shell from [here](https://github.com/pentestmonkey/php-reverse-shell/blob/master/php-reverse-shell.php).

Now to upload our reverse shell. First open the `php-reverse-shell.php` file and change the IP to your tun0 IP. Now rename the file to have the `.phtml` extension. Open the port with netcat so we can listen for incoming connections on our machine. Use the command `nc -lvnp 1234`. Upload the file to the webpage, then navigate to `http://$IP:3333/internal/uploads/php-reverse-shell.phtml`. This will execute the payload and you should see a connection on your netcat session. Once we get the reverse shell we can interact with the machine that the server is being hosted on.

For the next part I am not sure how to figure out what user was running the web server. I tried `ps aux` to get a list of all the processes and users and the only user that it says is running any apache instance is `root`, but that is not the correct answer. So I went to take a look at all the users. To do this I used the command `cat /etc/passwd` and found the user `bill`. Now we need to find his flag. If we navigate to his directory in `/home/` the only file he has is one called `user.txt` which contains the flag.

### [Task 5]

Now to escalate our privileges to become the root user! If we run the command `find / -user root -perm -4000 -exec ls -ldb {} \;` we can find a files that we have permissions for. When running this the file `/bin/systemctl` stands out, because it allows us to user services we might not be able to execute otherwise. When `systemctl` runs it runs with root permission.

Now we navigate to the `/bin` directory and spawn a shell using `sh`. Next we copy this modified script from [GTFObins](https://gtfobins.github.io/gtfobins/systemctl/), using the SUID version.

```
TF=$(mktemp).service
echo '[Service]
Type=oneshot
ExecStart=/bin/sh -c "cat /root/root.txt > /tmp/output"
[Install]
WantedBy=multi-user.target' > $TF
./systemctl link $TF
./systemctl enable --now $TF
```

Now use `cat /tmp/output` and the flag should be there! All done!
