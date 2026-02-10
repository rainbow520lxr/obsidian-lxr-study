# k8s-etcd的备份方案

## 备份(在/home/lxr/scripts)

1. 安装etcdctl工具 apt install etcdctl

```shell
ETCDCTL_API=3 \
etcdctl \
--endpoints=https://192.168.10.100:2379 \
--cacert=/etc/kubernetes/pki/etcd/ca.crt  \
--cert=/etc/kubernetes/pki/etcd/server.crt  \
--key=/etc/kubernetes/pki/etcd/server.key \
snapshot save /home/lxr/script/sn-$(date +%y-%m-%d).db
```

## 定时备份

```shell
# 进入root模式
crontab -e
4 * * * * sh /home/lxr/script/etcd_backup.sh
```

## 恢复etcd数据

```shell
ETCDCTL_API=3 etcdctl snapshot restore --data-dir /var/lib/etcd/ sn-24-08-28.db
```

