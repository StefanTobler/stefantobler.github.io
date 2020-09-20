---
title: Shodan.io
date: 2020-03-23
hero: /images/content/posts/try-hack-me/shodan.io.png
categories:
- try-hack-me
tags:
- iot
- osint
- shodan
---

Shodan.io is a great tool that is constantly scanning the whole internet for open devices and can be very useful in the recon stages of pentesting. This room walks through how to use filters on Shodan.io and how to find specific information about your target.

## Tools

* Shodan.io
* [Ultratools ASN Search](https://www.ultratools.com/tools/asnInfo)

## Walkthrough

### [Task 2] Getting Started

To solve task 2 read `task_1_introduction.md`, it is the article that was provided by THM and outlines how to search for ASNs using ultratools then using the `ASN:[asn]` filter on Shodan.io.

First things first. In order to find out google.com's ip address we can use the `ping` command. This command just sends a little packet of data to google.com and sees if anything is returned. You can see the output of my ping in `google_ping.txt`. Ping also gives us the IP address, which we see is `173.194.219.102`. When we throw this IP into ultratools we see that google's ASN is `AS15169`. Right below that, in the details we see that this ASN was allocated `2000-03-30` giving us the answer to the second question.

Next, we do an ASN search on Shodan.io. Sign-in or create an account and then search `ASN:AS15169`. This will show us the devices on that ASN. If we take a look on the left side of the page, we can sea a map of where most of those devices are located. And based on the map, and the table underneath it most of the devices are located in the United States. If we continue to look at the left size we see a section called `Top Products`. Here we see that the biggest product is OpenSSH. So the most popular service is SSH and then the type they are using is OpenSSH. Finally we look at the `Top Organizations` section and see that google's biggest service on this ASN is Google Cloud.

### [Task 4] Google & Filtering

After reading `task_3_filters.md` these questions should be a breeze. Again we are using Shodan.io and combining filters to have a better range of search results.

First off THM wants us to find out what the most popular OS running MySQL is on Google's ASN, to do this we need to combine an ASN filter with a product filter. The search query becomes `product:MySQL ASN:AS15169`. Then the results come up and there it is, `Linux 3.x` is the top operating system! The next few answers we can find by going back to just an ASN filter. When we check out the results we see that the third most popular location of machines on Google's ASN is in the EU. The next part kinda stumped me for a second. It asks which of the following three services is most popular on Google's ASN: nginx, HTTP or HTTPs. Well if you take a look at the search results under the `Top Products` section, for me nginx is obviously the most popular with HTTP and HTTPs not even making the list, but given that the answer prompt is more than 5 characters wrong I went to looking else where. If you take a look under the ports you can see that the three most popular ports are 20, 443 and 80. 20 being FTP, 443 being TCP and 80 being HTTP. So based on this information, and based on the length of the answer prompt I went with Hypertext Transfer Protocol (HTTP).

In order to figure out what city that most of Google's machines are in, we need to narrow down our search to search a country. Since the US has the most machines it makes sense to look there. So we can create a new search for filtering the ASN and the Country like so: `ASN:AS15169 country:US`. Once this returns the results we see that Mountain View has the most machines. Shocker right? It makes sense that the city home to Google's largest campus also houses most of its machines. What I found even more interesting is that according to this ASN the second most machines are in Cumming. I really hope they don't mean Cumming, Georgia, because that place seems to small to house the second most Google machines in the US on this ASN, but who knows. Maybe it could be where they are located for the Atlanta campus. On to the next question! Next we narrow down our search by city, specifically Oakland. We use the following filters `ASN:AS15169 city:Oakland`. Then scroll down to where it says `Operating Systems` and there we go, Windows Server 2008. Well after trying to submit the Windows Server 2008 flag, it doesn't look like that right, however in my search results it is obviously the top OS. After a really good guess, I put 2010 instead and there we go, thats what they are looking for.

For the last question we can navigate to https://shodan.io/explore and take a look at the webcams section. Then using our handy dandy ASN filter, search for google devices. When we hit search, no results pop up. Good for Google! Nay is the answer.
