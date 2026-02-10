```shell
helm install bichon-mysql-cluster bitnami/mysql --set global.storageClass=cfsauto --set architecture=replication --set secondary.replicaCount=1 --set secondary.persistence.size=100G --set primary.persistence.size=100G
```

NAME: bichon-mysql-cluster
LAST DEPLOYED: Wed Oct 22 17:08:41 2025
NAMESPACE: bichon
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
CHART NAME: mysql
CHART VERSION: 14.0.4
APP VERSION: 9.4.0

⚠ WARNING: Since August 28th, 2025, only a limited subset of images/charts are available for free.
    Subscribe to Bitnami Secure Images to receive continued support and security updates.
    More info at https://bitnami.com and https://github.com/bitnami/containers/issues/83267

** Please be patient while the chart is being deployed **

Tip:

  Watch the deployment status using the command: kubectl get pods -w --namespace bichon

Services:

  echo Primary: bichon-mysql-cluster-primary.bichon.svc.cluster.local:3306
  echo Secondary: bichon-mysql-cluster-secondary.bichon.svc.cluster.local:3306

Execute the following to get the administrator credentials:

  echo Username: root
  MYSQL_ROOT_PASSWORD=$(kubectl get secret --namespace bichon bichon-mysql-cluster -o jsonpath="{.data.mysql-root-password}" | base64 -d)

To connect to your database:

  1. Run a pod that you can use as a client:

      kubectl run bichon-mysql-cluster-client --rm --tty -i --restart='Never' --image  docker.io/bitnami/mysql:9.4.0-debian-12-r1 --namespace bichon --env MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD --command -- bash

  2. To connect to primary service (read/write):

      mysql -h bichon-mysql-cluster-primary.bichon.svc.cluster.local -uroot -p"$MYSQL_ROOT_PASSWORD"

  3. To connect to secondary service (read-only):

      mysql -h bichon-mysql-cluster-secondary.bichon.svc.cluster.local -uroot -p"$MYSQL_ROOT_PASSWORD"