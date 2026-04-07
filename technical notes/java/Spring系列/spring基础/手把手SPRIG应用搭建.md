# 保姆级手把手SPRING应用搭建

Spring Boot是目前流行的微服务框架，倡导“约定优先于配置”，其设计目的是用来简化新Spring应用的初始化搭建以及开发过程。Spring Boot提供了很多核心的功能，比如自动化配置、提供starter简化Maven配置、内嵌Servlet容器、应用监控等功能，让我们可以快速构建企业级应用程序。

## Spring Boot开发环境准备
在开始学习Spring Boot之前，我们需要准备好开发环境。本节将以Windows操作系统为例，介绍如何安装JDK、Intellij IDEA及Apache Maven。

### 安装JDK
JDK（Java SE Development Kit）建议使用1.8及以上的版本，其官方下载路径为：https://www.oracle.com/java/technologies/downloads/#java8。大家可以根据自己Windows操作系统的配置选择合适的JDK1.8安装包，这里就不过多描述。

![drag-img](.\oracle.png)

软件下载完成之后，双击下载软件，出现安装界面，如图所示。一路单击【下一步】按钮即可完成安装。本文我把JDK安装在C:\Program Files\Java\jdk1.8.0_50下。

![drag-img](.\安装.png)

### 系统变量修改

在【变量名】和【变量值】中分别输入JAVA_HOME和C:\Program Files\Java\jdk1.8.0_50，单击【确定】按钮。

JAVA_HOME配置好之后，将%JAVA_HOME%\bin加入到【系统变量】的path中。完成后，打开命令行窗口，输入命令java-version，如出现图所示的提示，即表示安装成功。

![drag-img](.\配置系统变量.png)

![drag-img](.\java提示符.png)

### IDE - IDEA环境准备

安装Intellij IDEA
在Intellij IDEA的官方网站 http://www.jetbrains.com/idea/上可以免费下载IDEA。下载完IDEA后，运行安装程序，按提示安装即可。本书使用Intellij IDEA 2021.2.2版本，当然大家也可以使用其他版本的IDEA，只要版本不要过低即可。安装成功之后，打开软件界面如图所示。企业版需要破解，教程私信

![drag-img](.\idea.png)s

### Apache Maven 项目管理及包管理工具

Apache Maven是目前流行的项目管理和构建自动化工具。虽然IDEA已经包含了Maven插件，但是笔者还是希望大家在工作中能够安装自己的Maven插件，方便以后项目配置需要。大家可以通过Maven的官方网站http://maven.apache.org/download.cgi下载最新版的Maven，本文的Maven版本为apache-maven-3.8.1。
下载完成后解压缩即可，例如，解压到D：盘上，然后将Maven的安装路径D:\apache-maven-3.8.1\bin加入到Windows的环境变量path中。安装完成后，在命令行窗口执行命令：mvn-v，如果输出如图所示的页面，表示Maven安装成功。

![drag-img](.\maven.png)

在Maven安装目录，即D:\apache-maven-3.5.0下新建文件夹repository，用来作为本地仓库。　
在Intellij IDEA界面中，选择【File】→【Settings】，在出现的窗口中找到Maven选项，分别把【Maven home directory】【User settings file】【Local repository】，设置为我们自己Maven的相关目录，如图1-6所示。
设置完成后，单击【Apply】→【OK】。至此，Maven在Intellij IDEA的配置完成。
这里需要注意的是，之所以把Maven默认仓库（C:${user.home}.m2\respository）的路径改为我们自己的目录（D:\apache-maven-3.5.0\repository），是因为respository仓库到时候会存放很多的jar包，放在C盘影响电脑的性能，所以才会修改默认仓库的位置。

## springboot项目搭建

1.2.1　使用Spring Initializr新建项目
使用Intellij IDEA创建Spring Boot项目有多种，比如Maven和Spring Initializr方式。这里只介绍Spring Initializr这种方式，因为这种方式不但可为我们生成完整的目录结构，还可为我们生成一个默认的主程序，节省时间。我们的目的是掌握Spring Boot知识，而不是学一堆花样。具体步骤如下：　在Intellij IDEA界面中，单击【File】→【New】→【Project】，在弹出的窗口中选择【Spring Initializr】选项，填上项目名字和路径，这里默认。在【Project SDK】选择JDK的安装路径，如果没有则新建一个，单击【Next】按钮，如图所示

![drag-img](.\initializer.png)

选择【Spring Boot Version】，这里按默认版本。。勾选【web】→【Spring Web】选项，然后单击【FINISH】按钮，如图所示。

![drag-img](.\选择组件.png)

单击【New Window】表示在新的窗口打开项目，单击【This Window】表示在当前窗口打开项目，我们选择【New Window】按钮即可。

在IDEA开发工具上，找到刷新依赖的按钮，下载相关的依赖包，这时开发工具开始下载Spring Boot项目所需的依赖包，如图

![drag-img](.\界面.png)

### 测试

Spring Boot项目创建完成之后，找到入口类DemoApplication中的main方法并运行。

![drag-img](.\查看项目.png)

当看到如图所示，表示项目启动成功。同时还可以看出项目启动的端口（8080）及启动时间。

![drag-img](.\main.png)
