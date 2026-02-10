# wsl-window subsystem linux



## 什么是wsl

wsl需要使用wsl2使用一种虚拟化的技术在windows上虚拟linux系统,确定自己使用的wsl2

## 基础命令

```bash

# 列出在线的分发版,查看哪些版本可以安装
wsl --list --online

# 安装有效的分发版
wsl --install Ubuntu-18.04

# 列举当前的终端
wsl -l -v

# 重命名
wsl --export Ubuntu-18.04 d:/k8s-master
wsl --unregister Ubuntu-18.04
wsl --import Ubuntu-18.04 d:/k8s-master d:/k8s-master/ext4.vhdx --version 2

wsl --export Ubuntu-18.04 k8s-node1
wsl --unregister Ubuntu-18.04
```



