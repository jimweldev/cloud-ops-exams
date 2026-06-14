# AWS CloudOps Exam 3 — Quick Reviewer

---

# EC2 Auto Scaling
## Spanning multiple AZs is the key to high availability
- Always span at minimum 3 AZs for production — ASG auto-redistributes when an AZ fails
- Auto Scaling groups **cannot span multiple regions** — only AZs within one region
- Setting max capacity = 1 means the group will never scale out
- `AZRebalance` process is suspended when `Terminate` process is also suspended

---

# Application Load Balancer (ALB)
## ELB access logs are the source for request-level data
- ELB access logs contain: client IP, latency, request path, server responses
- ALB does not produce its own CloudWatch activity logs by default — access logs must be enabled
- VPC Flow Logs show network traffic but NOT application-layer request details

---

# Amazon VPC — Security Groups and NACLs
## Stateful vs stateless is the most tested concept

- **Security Groups**: stateful, allow-only (no explicit deny rules), apply to instances
- **NACLs**: stateless, allow AND deny rules, apply to subnets
- To block a specific IP, use NACL with `/32` CIDR notation (e.g., `137.33.105.110/32`)
- Security groups cannot have explicit deny rules — only allow rules + implicit deny
- Both NACL inbound and outbound rules must be configured for two-way communication
- ICMP ping needs: SG inbound allow ICMP **and** NACL outbound allow ICMP (NACL is stateless)
- To allow internet access: attach IGW to VPC + update route table with `0.0.0.0/0 → IGW` + instance needs public IP

---

# Amazon S3 — Bucket Policies and Resource ARNs
## Know the ARN format differences between buckets and objects

- `s3:GetObject` requires the resource ARN to include `/*` (e.g., `arn:aws:s3:::bucket/*`)
- `s3:ListBucket` uses the bucket ARN without `/*` (e.g., `arn:aws:s3:::bucket`)
- Using `s3:GetObject` with a bucket-only ARN (no `/*`) returns: **"Action does not apply to any resource(s) in statement"** error
- S3 server-side encryption options: SSE-S3 (AWS managed keys), SSE-KMS, SSE-C (customer-provided keys)
- HTTP 503 throttle on a versioned S3 bucket = likely millions of versions on one or more objects; use S3 Inventory to identify them

---

# AWS Budgets
## Cost alerts with simple setup
- Set alert thresholds for monthly spending — sends notifications when threshold is hit
- AWS Budgets **cannot** directly terminate EC2 instances
- Budget actions can stop/terminate resources, but direct termination is a customer responsibility

---

# AWS Elastic Beanstalk
## Managed application deployment
- Error "instance profile does not exist": caused by (1) IAM role lacking permission to create roles, or (2) existing IAM role has insufficient permissions
- The EB CLI creates the instance profile automatically if your IAM user has the right permissions

---

# Amazon Aurora
## MySQL/PostgreSQL-compatible managed database with unique recovery options
- **Backtracking** = rewinds the cluster to a specific point in time **in-place** — no new DB instance needed
- **Point-in-time recovery** = restores to a **new DB cluster** from backup data — a new instance IS created
- Backtracking must be enabled at cluster creation time — cannot be enabled after
- Use backtracking when you need fast recovery on the same DB (e.g., accidental DELETE without WHERE)

---

# AWS CloudFormation — Stack Policies
## Stack policies prevent accidental updates to protected resources
- A CloudFormation stack policy controls **what update actions** are allowed on resources during a stack update
- It does NOT provide IAM-style access control — users still need IAM permissions to call CloudFormation
- A stack policy that denies `Update:*` on a specific resource protects it from any stack update
- By default (no stack policy), all resources can be updated

---

# Amazon Route 53 Resolver
## Hybrid DNS resolution between on-premises and AWS
- **Inbound endpoint** = on-premises DNS forwards queries to AWS → Route 53 Resolver resolves AWS private hostnames
- **Outbound endpoint** = AWS forwards queries to on-premises DNS → resolves on-premises hostnames from within VPC
- For on-premises to resolve AWS private hostnames: configure an **inbound endpoint** + update on-premises DNS to forward those queries there

---

# Amazon RDS — Security and Configuration
## Separate concerns at the security group level
- Use separate SGs for EC2 instances and the RDS database — allow only inbound traffic from the EC2 SG to the DB SG
- **Encryption must be enabled at creation** — you cannot encrypt an existing RDS instance in place
- To encrypt an existing RDS instance: take a snapshot → copy the snapshot with encryption enabled → restore from the encrypted snapshot
- Multi-AZ removes I/O suspension during automated backups (manual snapshots still suspend I/O briefly)
- RDS event notifications + SNS = email/mobile alerts for DB instance state changes

---

# Amazon CloudWatch — Custom Metrics and Memory
## Memory is NOT a built-in CloudWatch metric for EC2

- CloudWatch has no built-in memory utilization metric for EC2 instances
- Install the **CloudWatch Agent** and configure custom metrics to track memory, swap, and disk usage
- Enabling detailed monitoring only increases frequency — it does not add memory metrics
- `put-metric-data` CLI command = publish custom metrics to CloudWatch
- Basic monitoring = 5-minute intervals; Detailed monitoring = 1-minute intervals

---

# EC2 Placement Groups
## Choose based on your workload's priority

- **Spread placement group** = each instance on distinct rack with own network/power — max 7 per AZ, best for small critical workloads that must be isolated
- **Cluster placement group** = instances packed together in one AZ for low latency and up to 10 Gbps — best for tightly coupled HPC workloads
- **Partition placement group** = large distributed workloads like Hadoop, Cassandra — groups of instances share racks within a partition but not across partitions
- A spread placement group is limited to one region (spans multiple AZs within it)

---

# Amazon S3 Glacier
## Archive storage — key limitation with filenames
- Glacier assigns opaque archive IDs — you **cannot** set custom filenames/keys for archives
- To preserve filenames: store files in S3 first, then use a lifecycle policy to transition to Glacier
- Alternatively, use DataSync to move files to S3 (preserving metadata), then lifecycle to Glacier

---

# Amazon ElastiCache — Memcached vs Redis Scaling
## Scaling behavior differs between the two engines

- **Memcached** high evictions → add more nodes (horizontal scale-out)
- **Memcached** vertical scale (bigger node): create a **new cluster** using `CreateCacheCluster` with the new `CacheNodeType` — cannot use `ModifyCacheCluster` to change node type
- **Redis** → can modify node type directly without creating a new cluster (online resizing)
- Memcached does not support Multi-AZ or read replicas

---

# AWS Cost Explorer — createdBy Tag
## Track costs per IAM user
- AWS auto-generates a `createdBy` tag that links resources to the IAM user who created them
- Must activate this tag in the **Billing and Cost Management console** before it starts appearing
- After activation, use **Cost Explorer** to filter costs by `createdBy` tag to see per-developer spending

---

# VPC Peering
## Direct private connectivity between two VPCs
- VPC peering requires no overlapping IPv4 CIDRs
- **No transitive peering** — if VPC A peers with B and B peers with C, A cannot reach C through B
- Route table entries must be added on both sides of the peering connection
- For all-to-all communication between N VPCs, a full mesh of peering connections is needed

---

# AWS Organizations SCPs
## Org-wide permission guardrails
- SCPs restrict permissions across all accounts in an OU, including root users
- SCPs do not grant permissions — they only restrict what IAM policies can allow
- Use SCPs to uniformly enforce service restrictions (e.g., block certain regions or actions)

---

# IAM Credential Report
## Audit MFA and access key status for all users
- Generated from the IAM console
- Shows last used date, MFA status, and access key age for every IAM user
- Useful for security audits to identify users without MFA or with old access keys

---

# AWS Storage Gateway — Stored vs Cached Volume
## Know the difference between the two volume modes

- **Stored Volume** = primary data lives on-premises; async backup snapshots go to S3 — full dataset available locally
- **Cached Volume** = primary data lives in S3; frequently accessed data cached locally — minimizes on-premises storage

---

# Amazon Route 53 — Private Hosted Zones
## DNS for VPC-internal resources
- A private hosted zone provides custom DNS names that only resolve within associated VPCs
- Use for internal service discovery between EC2 instances and microservices
- Geoproximity routing uses a "bias" value to shift traffic between resources — not purely based on distance

---

# EC2 Reserved Instances
## Cost savings for long-running predictable workloads
- **Convertible RIs** = allow instance type, OS, or tenancy changes during the term at the cost of a slightly smaller discount
- RIs provide significant discounts vs On-Demand for workloads running continuously for 1+ years

---

