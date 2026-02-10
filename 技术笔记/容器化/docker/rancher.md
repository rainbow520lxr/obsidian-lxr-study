docker run -d –privileged –network=my-network -p 20080:80 -p 443:443 -v /home/ubuntu/rancher:/var/lib/rancher/ -e CATTLE_SYSTEM_DEFAULT_REGISTRY=registry.cn-hangzhou.aliyuncs.com –restart=unless-stopped –name rancher rancher/rancher





docker run -d
–privilege
–network=my-network
-p 80:80 -p 443:443
-v /opt/data/rancher-2.7.5_data:/var/lib/rancher/
-e CATTLE_SYSTEM_DEFAULT_REGISTRY=[registry.cn-hangzhou.aliyuncs.com 3](http://registry.cn-hangzhou.aliyuncs.com/)
–restart=unless-stopped
–name rancher-v2.7.5
rancher/rancher:v2.7.5

```shell
docker run -itd -p 20080:80 -p 443:443 \
–-privileged \
-v /home/ubuntu/rancher:/var/lib/rancher \
--restart=unless-stopped \
-e CATTLE_AGENT_IMAGE="registry.cn-hangzhou.aliyuncs.com/rancher/rancher-agent:v2.7.10" \
--name=rancher \
registry.cn-hangzhou.aliyuncs.com/rancher/rancher:v2.7.10


docker run -d \
  --privileged \
  -p 20080:80 \
  -p 8443:443 \
  -v /home/ubuntu/rancher:/var/lib/rancher \
  --restart=unless-stopped \
  --name=rancher/rancher \
  -e CATTLE_AGENT_IMAGE="registry.cn-hangzhou.aliyuncs.com/rancher/rancher-agent:v2.7.10" \
  registry.cn-hangzhou.aliyuncs.com/rancher/rancher:v2.7.10
```

