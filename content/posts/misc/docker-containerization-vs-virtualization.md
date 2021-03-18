---
title: Docker - Containerization vs. Virtualization
date: 2020-11-10
hero: /images/content/posts/misc/docker/horizontal-logo-monochromatic-white.png
categories:
- misc
tags:
- docker
- containerization
- virtualization
---

Containers and virtual machines are used all across cloud infrastructure. Cloud providers utilizes virtualization to divvy up hardware resources so that they can maximize hardware utilization on their machines. Docker is used to develop, deploy, and ship applicaiations quickly with low overhead some isolation. Both of these technologies are vital in how we interact with the web today. We are going to dive into Docker and how containers and virtual machines are different. This type of exploration allows us to be more aware of potential security issues and be able to talk about what kind of infrastructure a modern web service may be running.

## What is Docker not?

Docker is not a virtual machine. Virtual machines allow one set of hardware to run multiple operating systems by carving out resources to dedicate to each OS running. Hypervisors such as VMWare manage these virtual machines and divvy up resources. The hypervisor can run in place of the traditional operating system such that it is the only software interacting directly with the hardware (**Type 1**). In most cases, virtualization allows for complete isolation of environments so that OSs running on the same hardware cannot access each other's memory spaces at all. At a high level, this is implemented by not allowing the OS running to know that more resources are available.

For example, the hypervisor dedicates 4GB of RAM to my Windows machine and 2GB of RAM to my Linux machine. The Windows and Linux machines do not know that there exists more RAM than they are dedicated. Why? Well, that is because all the memory and storage they have access to is virtual. It is all managed by the hypervisor.

## What is Docker?

Docker is a tool, written in Go, to allow applications to run in a loosely isolated environment called a container. Simply put, a container is like OS virtualization. Whereas virtual machines are hardware virtualization, containers are like OS virtualization.

![image of container architechture](/images/content/posts/misc/docker/docker_container.png)

These containers run on top of the docker daemon, running on a host OS (ex. Ubuntu). Each container has it's own file system, processes, and system memory. A Docker container cannot access the processes running on the host OS, and it cannot access the processes running on parallel Docker containers. Containers are self-contained; everything needed to run the application inside the container is installed, except for the kernel. If you install a website, then the backend and all the required applications will be installed. Once we create a Docker container, we can pack it up and take it anywhere. It is possible to deploy it on any system that is running Docker and shares the same kernel.

## Why Docker?

Docker is fast and lightweight. Each docker container is sharing the Linux kernel on the host OS, so when an application launches, the kernel does not need to start; it is already running! Docker can also help with developing microservices. You don't need to keep developing apps repeatedly but can package and ship smaller parts of a big project. Docker also contains all its dependencies within the container. This can reduce conflicting dependencies on a machine and also makes these dependencies easy to install since they come shipped with the container. Docker containers can quickly recover from a crash and won't affect other processes on the system. In addition, there is the added benefit of security through obscurity. Since a container cannot see processes outside of its namespace, the containers are secure, at least to some extent. We will talk more about the security of containers down the road.

For example, someone wants to set up websites. They can split the store application into account services, product catalog, cart server, and an order server. With Docker, we can set up containers to perform these functions then deploy them on the different servers with our websites. If we have a store and a forum website, these both need account services. To get account services running on our forum, we need to deploy our docker container that deals with account services on our servers then we have account services set up for our websites. Another use for Docker might be to keep track of a toolset. Penetration testers often have a set of tools they prefer to use. When starting up a new system or new VM, it can be a pain to install all of these tools; with Docker, it is possible to create a container with all the tools you need at the version number you want.

## How is Docker Implemented?

Docker is built on the power of cgroups. cgroups allow the Docker Manager to allocate specific amounts of memory, network bandwidth, CPU cycles, and more to specific processes running on the system.

Equally as important as cgroups are namespaces. "When you run a container, Docker creates a set of namespaces for that container." The documentation states that when a container starts, new namespaces are created! So what are these magical namespaces then? Namespaces are what allow the containers to be isolated from one another. The documentation gives the following namespaces as an example of some that the Docker Engine uses on Linux.

* The `pid` namespace: Process isolation (PID: Process ID).
* The `net` namespace: Managing network interfaces (NET: Networking).
* The `ipc` namespace: Managing access to IPC resources (IPC: InterProcess Communication).
* The `mnt` namespace: Managing filesystem mount points (MNT: Mount).
* The `uts` namespace: Isolating kernel and version identifiers. (UTS: Unix Timesharing System).

As we can see, there are namespaces to handle most of the tasks that the OS does. Containerization is like virtualizing the OS, not the hardware. By creating these namespaces, Docker is essentially creating a virtual OS for the application to run in. However, unlike hardware virtualization, the host OS can see the processes running inside of the container. This is because the container is sharing the host kernel. Although the host OS and the Docker container share different namespaces, the Docker processes are still running inside the host OS namespace. Namespaces put the blinds on the container. The container believes that they are the only thing that exists but does not know what lies beyond itself.

## Hands-on with Docker

You can either do this on your local machine or, like I am, in an EC2 instance. An EC2 instance is a VM hosted on AWS, and the micro-instances can be spun-up with the free membership at no cost. It also gives me a clean platform to learn about Docker in. This tutorial is for a Unix based machine. Pulling the CentOS image on a Windows machine might not work unless you are inside the Windows Subsystem for Linux.

The host OS I will be using is Ubuntu; the installation commands may be different if you are on another distro.

### How to Install Docker

1. First, make sure your system has the latest packages.

``` bash
$ sudo apt-get update && sudo apt-get upgrade
```

2. Now that the system is up to date, we can install Docker.

``` bash
$ sudo apt-get docker.io
```

3. After installing Docker you need to add your current user to the Docker group so that it has permission to interact with the Docker daemon.

**The `docker` group grants privileges equivalent to the `root` user. For details on how this impacts security in your system, see [Docker Daemon Attack Surface](https://docs.docker.com/engine/security/#docker-daemon-attack-surface).**

4. Create the group.

``` bash
$ sudo groupadd docker
```

5. Add your user to the docker group

``` bash
$ sudo usermod -aG docker $USER
```

6. Logout and log back into your user to see the changes take effect.

### Using Docker

The Docker CLI uses the command `docker` to interact with the docker daemon. We can pull images, run containers, execute commands inside containers, and more with this command.

First, let's install an operating system using Docker. We will install the CentOS image to see how namespaces work within the context of a container. We can use the command `docker pull` to pull down images published on [Docker Hub](https://hub.docker.com/)

``` bash
$ docker pull centos:latest

$ docker run -d -t --name docker-tutorial centos
```

After running the container, detached and run in the background. The `-d` flag runs the container in the background and detaches from the shell where it was spawned. If the shell closes, the container will stay alive. The `-t` flag allocates a pseudo-tty inside the container so that we will be able to grab a shell inside of it. `docker ps` allows us to see the containers that are currently running. Now that the container is running let's jump inside of it.

``` bash
$ docker exec -it docker-tutorial bash
```

The `-it` command allows us to have an interactive terminal. Now we are inside the container! We can observe how the `pid` namespace changes if we use the command `watch "ps aux"` in our container then search for the process on our host machine.

#### Host OS

![image of host pid](/images/content/posts/misc/docker/docker_pid_host.png)

#### CentOS Container

![image of watch pid](/images/content/posts/misc/docker/docker_pid_container.png)

As you can see, the `pid` of the process inside and outside the container is different. Inside the container, `watch` has a `pid` of 43, but on our host OS, the same process has the `pid` of 10886. Why is this? Again, namespaces! Namespaces create an entirely new process group inside the container, and the container cannot see outside of that group. The host OS, however, can see the processes running inside of the container. This proves that containers are not virtualization. They host and the container share processes!

![best drawing of the year](/images/content/posts/misc/docker/docker_namespace_image.png)

This illustration represents the idea of `pid` namespacing. The host OS sees all the processes that it is running and that the container is running. However, the container only sees the processes running inside of it, and the container doesn't see the true `pid` of the process, only the id it is given in its namespace. Another interesting thing to note about the container's namespace is that `pid` 1 is given to `/bin/bash` in this case. Typically this `pid` is reserved for either the `init` or `systemd` process on a Linux machine because all other processes originated from it. In the container's namespace, Docker assigns the first process that is run `pid` 1.

Another way to visualize the graphic above on our machine is to use the command `pstree -p`. `pstree` allows us to see all the processes running as a tree; we can see where processes forked and who their children are. With `watch` still running in the container, let's execute this command.

#### Host OS

![pstree image](/images/content/posts/misc/docker/docker_pstree.png)

Let's take a look at the output. We can see that `watch` forked from `bash` from the `containerd-shim`, which started from `containerd`, which was created by `systemd`. `containerd` is automatically started by the Docker daemon and "manages the complete container lifecycle of its host system." You can learn more about `containerd` on its [website](https://containerd.io/) and more about how Docker uses it in the [Docker Documentation](https://docs.docker.com/engine/reference/commandline/dockerd/).

We can check the namespaces of our machine's processes by looking in the `proc` folder in the root directory.

#### Container Namespaces

![container namespace](/images/content/posts/misc/docker/docker_namespace_container.png)

The output shows us the different namespaces used by this process. If we compare this to the namespace of the shell process running on the machine, we will see a different set of namespaces.

#### Host Namespace

![host namespace](/images/content/posts/misc/docker/docker_namespace_home.png)

`$$` represents the `pid` of the shell, and `1` is the `pid` of the `systemd` process. As you can see, the namespaces that are being used by these two processes are the same. Fascinating right? Another thing to note is that not all the namespaces are different. For example, the `user` namespace and the `cgroup` namespace are the same.

### Deploying a Docker Container

Docker makes it very easy to deploy web applications. On my EC2 instance, I will deploy a vulnerable web application with a backend and front end in seconds. The image I am going to use is called OWASP Juice Shop.

If you don't know what OWASP is, it is a nonprofit foundation that provides free and open-source security tools to the world. The Open Web Application Security Project (OWASP) also has hundreds of local chapters worldwide where members can network and learn about security.

OWASP Juice Shop is a sophisticated and modern web application littered with security flaws. It is perfect for security training and those interested in web application security. The whole OWASP Top Ten has been incorporated into the website, making it a great place to learn about security flaws present in web applications today. Juice Shop is also available as a Docker container, making it perfect for this tutorial.

To get the container image, we are going to use the `docker pull` command again.

``` bash
$ docker pull bkimminich/juice-shop
```

From my AWS instance, I am going to run the container and map it to port 80. If you deploy this container on an AWS instance, make sure that you have a rule that allows inbound traffic on port 80. Traffic rules are in the security settings of your instance.

``` bash
$ docker run -d -p 80:3000 bkimminich/juice-shop
```

If you want to run the website on your local machine, the command differs just a bit.

``` bash
$ docker run --rm -p 3000:3000 bkimminich/juice-shop
```

Now navigate to the public URL of your AWS instance. If you are doing this on your local machine, visit `localhost:3000`. If it all worked correctly, you should be greeted by the Juice Shop page.

![juice shop image](/images/content/posts/misc/docker/docker_juice_shop.png)

## Containerization vs. Virtualization

Virtualization and containerization are almost omnipresent technologies in web service infrastructure. When you rent a machine on AWS, Azure, GPC, or any other cloud platform provider, you are not renting the whole server and all the hardware on it; you are typically renting some of the hardware, accessible by a virtual machine. When spinning up one of these VMs on a cloud platform, you can choose whether you want Linux, Windows, Solaris, BSD, or other kinds of operating systems. This is important because these service providers want each of their users to have a completely isolated environment all to themselves, even though there might be ten other people using the same hardware.

![Containerization and virtualization image](/images/content/posts/misc/docker/docker_container_vs_vm.png)

Containerization comes in handy when we want to deploy applications on our server. The container engine (Docker) can handle a large number of containers with ease. We could isolate different applications on our machine using virtual machines and have each application run on its operating system, but this is a very heavy process. If we choose to virtualize everything, we need to spin up different kernels, and accessing hardware is not as efficient. When using containers, we share the kernel with the host OS, and accessing hardware is quicker because we do not need to go through the guest OS, then the hypervisor, a container can jump straight from the host OS to the hardware. This reduces overhead and, in addition to sharing the kernel, makes containers a much lighter weight and faster way to isolate applications.

If an application crashes or fails inside of a container, the container can just be rebooted. Restarting a container is much less costly and much quicker than rebooting a VM because the kernel does not need to be reinitialized.

However, containerization does not come at a cost. Because of the shared kernel space, containerized applications can only run on the kernels they were built on. That being said, a container built on Windows probably might have issues running on Ubuntu. This also means that containers are vulnerable to kernel-level exploits. Once a container is broken out of the attacker has free reign on the host OS. Including all the other containers running on that system.

The security of a container highly depends on the security configuration of the host machine. For example, make sure the Docker daemon can only be controlled by trusted users and not any user on the machine. The Docker documentation also recommends that any server running Docker containers should exclusively run applications in containers, except for admin tools like SSH and logging tools.

## Attribution

I used a lot of resources to compose this post. Including the resources listed below, I am incredibly thankful for [LiveOverflow](https://www.youtube.com/channel/UClcE-kVhqyiHCcjYwcpfj9w). His video about Docker proved to be priceless resources when learning about the implementation, and the hands-on part of this post is based directly on his video about namespaces. Another invaluable resource was the [NetworkChuck](https://www.youtube.com/channel/UC9x0AN7BWHpCDHSm9NiJFJQ). His video highlighting the differences between virtualization and containerization helped me grasp many of the nuances between the two.

I ended up reading a lot of Docker documentation to come up with this, and it makes me remember how great good documentation of a tool is. It is great to see that the documents mentioned the underlying technologies, and it offered a wealth of information about where to look next.

If you are interested you can checkout the slides I prepared for this presentation [here](/files/docker_presentation.pdf).

### Works Cited

"Docker Overview." _Docker Documentation_, 6 Nov. 2020, docs.docker.com/get-started/overview/.

Kerrisk, Michael. "Namespaces in Operation, Part 1: Namespaces Overview." _LWN.net_, 4 Jan. 2013, lwn.net/Articles/531114/.

Pollock, Antonia. _Virtualization vs. Containerization_. 16 Sept. 2020, www.liquidweb.com/kb/virtualization-vs-containerization/.