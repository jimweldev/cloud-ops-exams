# AWS CloudOps Exam 6 — Quick Reviewer

---

# AWS CloudFormation — DeletionPolicy
## Control what happens to resources when a stack is deleted
- `DeletionPolicy: Retain` = keeps the resource alive after stack deletion
- `DeletionPolicy: Snapshot` = creates a final snapshot before deleting the resource
- `DeletionPolicy: Delete` = deletes the resource (this is the default)
- Valid values only: `Retain`, `Snapshot`, `Delete` — no other values accepted
- Enabling termination protection prevents the stack from being deleted, but does NOT retain the resources after deletion
- Use `Exports` / `ImportValue` to share resource outputs between different CloudFormation stacks

---

# AWS Storage Gateway — Volume Types
## Cached vs Stored — know which data lives where

- **Cached Volume Gateway** = S3 is the primary storage; frequently accessed data cached locally — minimizes on-premises storage footprint
- **Stored Volume Gateway** = all data stored on-premises; periodic async backup snapshots go to S3 — full dataset always local
- **File Gateway** = NFS/SMB interface to S3 with local cache for frequently accessed files
- **Tape Gateway** = virtual tape library replacement — predictable retrieval for backup archives
- To expand a Stored Volume: add a new larger disk to the host → edit the local disk in the Storage Gateway console (do NOT resize the existing disk)

---

# Amazon RDS — AWS Responsibilities
## Know what AWS manages vs. what you manage for RDS
- AWS manages: automated backups with **5-minute point-in-time recovery**, OS security patches, underlying hardware
- AWS does NOT auto-create Read Replicas or Multi-AZ deployments — you configure these yourself
- Maximum backup retention period = **35 days** (not 1 year)
- SSL/TLS for in-transit encryption = modify the DB instance to use the SSL certificate; the cert is provided by AWS
- `FreeStorageSpace` metric = monitor available disk space on an RDS instance

---

# Amazon ElastiCache — Memcached Vertical Scaling
## Must create a new cluster to change node type
- Use `CreateCacheCluster` API + set `CacheNodeType` to the larger instance type
- `ModifyCacheCluster` API **cannot** change the node type for Memcached — only works for Redis
- For Redis, node type changes can be done online (direct resizing)
- There is no `InstanceType` parameter in `CreateCacheCluster` — it is `CacheNodeType`

---

# Amazon EventBridge — API Call Detection
## CloudTrail is the event source for API call patterns
- To alert when a specific API is called (e.g., `CreateUser`): use EventBridge rule with **CloudTrail** as the event source
- **AWS Config is NOT a valid event source for detecting API calls** — Config tracks resource configuration state, not API calls
- IAM Access Analyzer identifies externally shared resources — not API call detection
- Pair with an SNS topic (email subscription) as the EventBridge target for email notifications

---

# Amazon Macie
## Discovers sensitive data in S3 objects
- Supports **S3 as data source only** — cannot scan RDS or DynamoDB directly
- To scan RDS data: use **AWS DMS** to export data from RDS to S3 → run Macie classification job on the S3 bucket
- Macie uses ML to detect PII, financial data, and other sensitive patterns
- GuardDuty detects threats and malicious activity; Macie detects sensitive data — they are different

---

# AWS AWSTOE (Task Orchestrator and Executor)
## Orchestrates complex workflows for EC2 Image Builder
- Declarative document schema — no code required
- Runs on any cloud or on-premises infrastructure
- Built into EC2 Image Builder for defining build, validate, and test components
- CloudFormation is for provisioning infrastructure, not for orchestrating build workflows

---

# Amazon EBS — Volume Types
## Match volume type to workload

- **Provisioned IOPS SSD (io1/io2)** = mission-critical, low-latency, high-throughput databases (MongoDB, Cassandra, SQL Server) — supports >100,000 IOPS
- **General Purpose SSD (gp2/gp3)** = small to medium workloads; gp2 bursts deplete credits under sustained load; gp3 provides consistent 3,000 IOPS without burst depletion
- **Throughput Optimized HDD** = large sequential workloads (log processing, big data); not for random I/O
- **Cold HDD** = infrequently accessed data; cheapest; not for active workloads

---

# Amazon S3 MFA Delete
## MFA protects specific high-risk operations
- Requires MFA for: (1) **changing the versioning state** of a bucket, (2) **permanently deleting an object version**
- Does NOT require MFA for: renaming, moving, changing ACL on objects or buckets
- Only the **root account** can enable/disable MFA Delete, via AWS CLI (not the Console)

---

# AWS Config — Automated Remediation
## Managed rules + auto remediation = operational efficiency
- `s3-bucket-logging-enabled` = flags buckets without access logging enabled; supports auto-remediation
- `s3-bucket-public-read-prohibited` = flags publicly readable buckets; auto-remediates by removing public access
- Use Config auto-remediation instead of building EventBridge + Lambda pipelines for simple compliance checks
- Trusted Advisor can check S3 logging but cannot auto-remediate

---

# Amazon CloudFront
## CDN for both static and dynamic content
- Speeds up delivery of HTML, CSS, JS, images, and dynamic API responses globally
- CloudFront + WAF = protection against SQL injection and XSS
- **Origin Access Control (OAC)** = restricts S3 bucket access so only CloudFront can read objects
- Works as origin for ALB, EC2, S3, MediaStore

---

# AWS Secrets Manager — CloudFormation Integration
## Auto-generate and rotate passwords in CloudFormation
- `AWS::SecretsManager::Secret` + `GenerateSecretString` = auto-generates a random password
- `AWS::SecretsManager::RotationSchedule` = sets up automatic rotation schedule
- SSM Parameter Store stores credentials but **cannot rotate them automatically**
- Using `SecretString` requires you to provide a password — not as secure as auto-generation

---

# Amazon SQS — Auto Scaling Metric
## Scale based on visible messages, not in-flight messages
- `ApproximateNumberOfMessages` = number of messages **available for retrieval** → use for Auto Scaling
- `ApproximateNumberOfMessagesNotVisible` = in-flight messages (sent to consumer but not deleted) → NOT for scaling
- `ApproximateNumberOfMessagesDelayed` = delayed messages not yet available → NOT for scaling
- Dead Letter Queue (DLQ) = isolates failed messages for analysis without blocking the main queue
- SQS **cannot send emails** — use SNS or Lambda for notifications

---

# AWS VPN (Managed VPN Connection)
## Cost-effective on-premises to VPC connectivity
- Cheaper than Direct Connect — uses IPsec over the public internet
- Use for hybrid architectures where consistent low latency is not critical
- AWS Direct Connect = dedicated private connection; higher cost; use when consistent bandwidth is required

---

# AWS IAM — Least Privilege and Role-Based Access
## Use IAM roles on EC2, not access keys
- EC2 applications should use **IAM roles** (not access keys embedded in code or config files)
- Use specific SQS actions: `sqs:SendMessage`, `sqs:ReceiveMessage`, `sqs:DeleteMessage` — not `sqs:*`
- Inline Policy = attached directly to one user/role (cannot be reused); use for strict one-to-one assignment
- `iam:PassRole` is required to assign an IAM role to an AWS service (e.g., pass a role to EC2 on launch)

---

# EC2 Auto Scaling Warm Pool
## Pre-initialize instances to reduce scale-out boot time
- Instances in the warm pool are pre-initialized and sit idle until needed during a scale-out event
- Reduces latency for applications with long boot or initialization times
- Drawn from when ASG scales out — eliminates cold start delay

---

# Amazon Route 53 — Geoproximity Routing
## Route traffic based on user and resource location with bias
- **Geoproximity routing** = routes based on geographic location of users AND resources; add a bias value to shift more/less traffic to a region
- Use when expanding to multiple regions and want consistent geographic routing with tunable traffic shifting
- Latency routing routes to the lowest-latency region — geographically inconsistent under certain network conditions

---

# AWS KMS — Key Deletion
## Keys in PendingDeletion state cannot encrypt or decrypt
- Scheduled deletion waiting period: 7 to 30 days (configurable)
- During this period: key is in `PendingDeletion` state — encrypt/decrypt operations fail
- You can cancel the deletion during the waiting period
- **Key policies** are the primary access control for KMS keys — without a key policy, no one can use the key

---

# AWS Trusted Advisor + Quota Monitor
## Proactive service limit monitoring
- Quota Monitor = uses Lambda + Trusted Advisor + EventBridge to check service quotas and alert
- Can send to Slack channels or email
- SQS cannot send emails — use SNS or Lambda for notifications when alerts fire
- Enhanced Monitoring increases metric frequency but does not track service limits

---

# VPC Endpoint
## Private access to AWS services without internet
- **Gateway endpoint** = S3 and DynamoDB; free; adds a route to your route table
- **Interface endpoint** = most other AWS services (KMS, SSM, etc.); uses PrivateLink; small hourly cost
- Traffic stays within the AWS network — no Internet Gateway, NAT, or VPN required
- Use when instances in private subnets need to access S3 or KMS without going through the internet

---

# Application Load Balancer — Uneven Traffic Distribution
## Common causes and fixes for uneven load
- **Sticky sessions** = one instance handles all requests from the same client → can cause uneven load
- **Fix**: disable stickiness or enable cross-zone load balancing for even distribution across AZs
- **Slow start mode** = gradually ramps up traffic to newly launched instances to prevent overload during boot
- ELB access logs = find source IP addresses of requests that triggered scaling

---

# AWS WAF
## Layer 7 protection for web applications
- Blocks SQL injection, XSS, and HTTP flood attacks
- Integrates with ALB and CloudFront — **cannot be used with NLB**
- Create IP sets in a web ACL to allow or deny specific IP ranges
- Use WAF rules to limit request rates per IP to mitigate brute-force attacks

---

# Amazon EFS
## Shared NFS file system for multiple EC2 instances
- Multiple EC2 instances in different AZs can read/write simultaneously
- NFS-based — no Windows ACL support; use FSx for Windows File Server for Windows ACL requirements
- Higher cost than S3 — use S3 + CloudFront for static file distribution instead

---

# Amazon GuardDuty
## Continuous threat detection across accounts
- Monitors S3 data plane events, CloudTrail management events, VPC Flow Logs, and DNS logs
- Use for detecting malicious activity: unauthorized API calls, compromised credentials, data exfiltration
- Works across multiple accounts using AWS Organizations

---

# AWS Security Hub
## Aggregates security findings across multiple accounts
- Deploy via **CloudFormation StackSets** to enable Security Hub across all accounts in the org
- Runs CIS AWS Foundations Benchmark checks
- Requires a delegated admin account for multi-account centralization

---

