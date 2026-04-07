# k8s 相关问题解决

## k8s 重启导致的etcd损坏

### 问题现象

```shell
The connection to the server 192.168.10.100:6443 was refused - did you specify the right host or port?
```

### 解决思路

步骤一：该端口为api-server的端口，检查api-server和etcd的pod状态

```shell
docker ps -a
```

> CONTAINER ID   IMAGE                                               COMMAND                  CREATED          STATUS                      PORTS     NAMES
> 6fab1cc3e247   25f8c7f3da61                                        "etcd --advertise-cl…"   2 minutes ago    Exited (1) 2 minutes ago              k8s_etcd_etcd-k8s
> -master_kube-system_d1153b953f9c33f7dad88760ea6113ff_629
> e0d768c4229b   8fa62c12256d                                        "kube-apiserver --ad…"   3 minutes ago    Exited (1) 3 minutes ago              k8s_kube-apiserve
> r_kube-apiserver-k8s-master_kube-system_f2848e32e2ec809155cd02e29b3a9f84_616

步骤二：检查apiserver docker

```shell
docker ps -a | grep -i apiserver
```

>  [core] grpc: addrConn.createTransport failed to connect to {127.0.0.1:2379 127.0.0.1 <nil> 0 <nil>}. Err: connecti
> on error: desc = "transport: Error while dialing dial tcp 127.0.0.1:2379: connect: connection refused". Reconnecting...

步骤二：检查etc的失败原因

```shell
docker ps -a | grep -i etcd
```

> {"level":"info","ts":"2024-11-30T07:56:49.956Z","caller":"etcdmain/etcd.go:72","msg":"Running: ","args":["etcd","--advertise-client-urls=https://192.168.10.100:2379
> ","--cert-file=/etc/kubernetes/pki/etcd/server.crt","--client-cert-auth=true","--data-dir=/var/lib/etcd","--initial-advertise-peer-urls=https://192.168.10.100:2380"
> ,"--initial-cluster=k8s-master=https://192.168.10.100:2380","--key-file=/etc/kubernetes/pki/etcd/server.key","--listen-client-urls=https://127.0.0.1:2379,https://19
> 2.168.10.100:2379","--listen-metrics-urls=http://127.0.0.1:2381","--listen-peer-urls=https://192.168.10.100:2380","--name=k8s-master","--peer-cert-file=/etc/kuberne
> tes/pki/etcd/peer.crt","--peer-client-cert-auth=true","--peer-key-file=/etc/kubernetes/pki/etcd/peer.key","--peer-trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt","
> --snapshot-count=10000","--trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt"]}
> {"level":"info","ts":"2024-11-30T07:56:49.957Z","caller":"etcdmain/etcd.go:115","msg":"server has been already initialized","data-dir":"/var/lib/etcd","dir-type":"m
> ember"}
> {"level":"info","ts":"2024-11-30T07:56:49.957Z","caller":"embed/etcd.go:131","msg":"configuring peer listeners","listen-peer-urls":["https://192.168.10.100:2380"]} 
> {"level":"info","ts":"2024-11-30T07:56:49.957Z","caller":"embed/etcd.go:478","msg":"starting with peer TLS","tls-info":"cert = /etc/kubernetes/pki/etcd/peer.crt, ke
> y = /etc/kubernetes/pki/etcd/peer.key, client-cert=, client-key=, trusted-ca = /etc/kubernetes/pki/etcd/ca.crt, client-cert-auth = true, crl-file = ","cipher-suites
> ":[]}
> {"level":"info","ts":"2024-11-30T07:56:49.959Z","caller":"embed/etcd.go:139","msg":"configuring client listeners","listen-client-urls":["https://127.0.0.1:2379","ht
> tps://192.168.10.100:2379"]}
> {"level":"info","ts":"2024-11-30T07:56:49.959Z","caller":"embed/etcd.go:307","msg":"starting an etcd server","etcd-version":"3.5.1","git-sha":"e8732fb5f","go-versio
> n":"go1.16.3","go-os":"linux","go-arch":"amd64","max-cpu-set":4,"max-cpu-available":4,"member-initialized":true,"name":"k8s-master","data-dir":"/var/lib/etcd","wal-
> dir":"","wal-dir-dedicated":"","member-dir":"/var/lib/etcd/member","force-new-cluster":false,"heartbeat-interval":"100ms","election-timeout":"1s","initial-election-
> tick-advance":true,"snapshot-count":10000,"snapshot-catchup-entries":5000,"initial-advertise-peer-urls":["https://192.168.10.100:2380"],"listen-peer-urls":["https:/
> /192.168.10.100:2380"],"advertise-client-urls":["https://192.168.10.100:2379"],"listen-client-urls":["https://127.0.0.1:2379","https://192.168.10.100:2379"],"listen
> -metrics-urls":["http://127.0.0.1:2381"],"cors":["*"],"host-whitelist":["*"],"initial-cluster":"","initial-cluster-state":"new","initial-cluster-token":"","quota-si
> ze-bytes":2147483648,"pre-vote":true,"initial-corrupt-check":false,"corrupt-check-time-interval":"0s","auto-compaction-mode":"periodic","auto-compaction-retention":
> "0s","auto-compaction-interval":"0s","discovery-url":"","discovery-proxy":"","downgrade-check-interval":"5s"}
> {"level":"info","ts":"2024-11-30T07:56:49.967Z","caller":"etcdserver/backend.go:81","msg":"opened backend db","path":"/var/lib/etcd/member/snap/db","took":"7.561698
> ms"}
> {"level":"info","ts":"2024-11-30T07:56:51.396Z","caller":"embed/etcd.go:367","msg":"closing etcd server","name":"k8s-master","data-dir":"/var/lib/etcd","advertise-p
> eer-urls":["https://192.168.10.100:2380"],"advertise-client-urls":["https://192.168.10.100:2379"]}
> {"level":"info","ts":"2024-11-30T07:56:51.397Z","caller":"embed/etcd.go:369","msg":"closed etcd server","name":"k8s-master","data-dir":"/var/lib/etcd","advertise-pe
> er-urls":["https://192.168.10.100:2380"],"advertise-client-urls":["https://192.168.10.100:2379"]}
>
> 
>
> {"level":"fatal","ts":"2024-11-30T07:56:51.397Z","caller":"etcdmain/etcd.go:203","msg":"discovery failed","error":"walpb: crc mismatch","stacktrace":"go.etcd.io/etc
> d/server/v3/etcdmain.startEtcdOrProxyV2\n\t/tmp/etcd-release-3.5.1/etcd/release/etcd/server/etcdmain/etcd.go:203\ngo.etcd.io/etcd/server/v3/etcdmain.Main\n\t/tmp/et
> cd-release-3.5.1/etcd/release/etcd/server/etcdmain/main.go:40\nmain.main\n\t/tmp/etcd-release-3.5.1/etcd/release/etcd/server/main.go:32\nruntime.main\n\t/home/remot
> e/sbatsche/.gvm/gos/go1.16.3/src/runtime/proc.go:225"}

 步骤三：清除/var/lib/etcd/下的所有数据，然后进行恢复

## docker配置镜像源不起效果

