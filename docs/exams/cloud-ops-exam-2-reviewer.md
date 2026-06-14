# AWS CloudOps Exam 2 — Quick Reviewer

---

# Application Load Balancer (ALB)
## ALB access logs capture client IP, latency, request path, and server responses
- Must enable access logging and store logs in a **standard S3 bucket in the same region** as the ALB
- ALB supports WebSockets, host-based routing, path-based routing, and containers
- Use ALB for layer 7 features; use NLB for raw TCP at millions of requests/second
- CloudFront forwards **User-Agent** header to enable device-type detection at origin

---

# AWS Trusted Advisor
## Provides real-time best practice guidance: cost, performance, security
- Use Trusted Advisor for architectural recommendations
- Does NOT provide threshold-based cost alerts — use AWS Budgets for that
- Trusted Advisor service quota metrics can be published to EventBridge for limit alerts

---

# AWS Config
## Continuously monitors and evaluates resource configurations
- `restricted-ssh` managed rule = detects security groups allowing public SSH (0.0.0.0/0)
- Remediation actions use **SSM Automation documents**, not Lambda directly
- `require-tags` managed rule = finds resources with non-compliant or missing tags

---

# AWS Systems Manager
## Fleet management, patching, remote execution, and config management
- **Run Command** = remotely execute shell scripts on managed instances
- **Patch Manager** = apply OS security patches fleet-wide immediately (don't wait for maintenance windows)
- **Parameter Store** = store and reference latest AMI IDs in CloudFormation templates
- **State Manager** = keeps instances in a defined state over time

---

# Amazon EFS
## Shared NFS file system accessible from multiple EC2 instances across AZs
- Supports file/directory-level permissions (POSIX-style)
- You **cannot change the performance mode** of an existing EFS file system
- To upgrade to Max I/O mode: create a new EFS file system + migrate with DataSync

---

# Amazon EBS
## Block storage for EC2 — know RAID types and default encryption

- **RAID 0** = best performance (striped), no redundancy — use for max I/O on temporary data
- **RAID 1** = mirrors data for redundancy — no performance gain
- RAID 5/6 are **NOT recommended** on EBS — parity writes consume 20-30% of IOPS
- Enable **default EBS encryption** in the EC2 Console per region to auto-encrypt all new volumes
- `AutoEnableIO` = automatically enables I/O on a volume after a consistency check

---

# AWS Certificate Manager (ACM)
## Manages SSL/TLS certificates for AWS services
- ACM **automatically renews** certificates it issues (Amazon-issued certs only)
- Certificates **imported** from third-party CAs are NOT auto-renewed — you must renew manually
- No extra configuration needed after associating an ACM cert with ELB

---

# Amazon Route 53
## DNS routing with health checks

- **Weighted routing** = split traffic across multiple resources by percentage — best for canary deployments
- **Geoproximity routing** = route based on geographic location of users AND resources with optional bias value
- **Latency routing** = route to the region with lowest latency
- **Failover routing** = active-passive — route to secondary when primary health check fails
- Health check types: endpoint health check, CloudWatch alarm health check
- Route 53 health checks **cannot** monitor EC2 CPU, CloudTrail alarms, or the Service Health Dashboard

---

# Amazon FSx for Windows File Server
## Fully managed Windows-native file system with SMB protocol and Windows ACLs
- Use for Windows workloads needing Active Directory integration
- Multi-AZ = synchronous replication + automatic failover to standby
- Amazon RDS does **NOT** support Oracle RAC — use EC2 instances instead

---

# Amazon CloudFront
## Global CDN — improving cache hit ratio

- **Increase TTL** (Cache-Control max-age) = objects stay cached longer → higher hit ratio
- **Forward only necessary query strings** = don't forward all params; only the ones that create unique responses
- **Origin Shield** = extra caching layer between edge and origin — reduces duplicate origin hits
- When S3 is a website endpoint origin, CloudFront can only use **HTTP** to communicate with it
- Use **User-Agent header** in origin custom headers to enable device-type detection

---

# AWS Organizations
## Multi-account management and billing
- **RI discount sharing** can only be disabled by the **management account** — not member accounts
- To disable RI sharing: go to Billing Preferences in the management account
- To give individual member accounts RI discounts, purchase RIs from each member account after disabling sharing
- A single IAM login URL for multiple accounts is **not possible** — each account has its own alias

---

# NAT Gateway
## Outbound-only internet access for private subnets (IPv4)
- Must be placed in a **public subnet**
- Does NOT support IPv6 — use Egress-Only Internet Gateway for IPv6
- Managed service — no scaling or patching needed (unlike NAT Instance)

---

# Egress-Only Internet Gateway
## Outbound-only internet access for private subnets (IPv6)
- Blocks inbound IPv6 connections from the internet
- Use for IPv6 CIDR blocks in private subnets
- NAT devices do not support IPv6 traffic

---

# Amazon CloudWatch
## Metrics, alarms, logs, and dashboards

- **Basic monitoring** = 5-minute interval (default, free)
- **Detailed monitoring** = 1-minute interval (must enable, small cost)
- `StatusCheckFailed_System` alarm action = triggers EC2 auto-recovery (retained private IP, Elastic IP, etc.)
- **procstat plugin** = CloudWatch agent plugin that collects per-process CPU metrics on Linux/Windows
- CloudWatch agent can be installed on EC2 instances AND on-premises servers for unified monitoring

---

# AWS CloudTrail
## Logs every API call for compliance and auditing
- Captures KMS key creation, deletion, and rotation events
- Captures EC2 key pair operations
- Central S3 bucket = multi-account log consolidation
- CloudTrail is the right tool for audit logs; AWS Config is for resource configuration state

---

# AWS KMS
## Encryption key management
- Keys with **imported key material** do NOT support automatic rotation
- To rotate a key with imported material: create a new key with new material → update the alias to point to the new key
- You cannot replace existing imported key material in a KMS key
- AWS managed keys auto-rotate approximately every 365 days

---

# IAM Access Analyzer
## Identify resources shared with external entities
- Can **preview** how new permission changes affect public or cross-account access before applying
- Generates findings listing external principals and access details
- Use for security review before policy deployments; not for general IAM policy enforcement

---

# AWS CloudFormation
## Infrastructure as code
- **Nested stacks** = reuse templates within the same account and region (deduplicate common components)
- **CreationPolicy + cfn-signal** = wait for EC2 app to be ready before marking creation complete
- **UpdatePolicy + WaitOnResourceSignals** = rolling update that waits for each new instance to signal healthy
- **Drift detection** = identify actual vs. expected resource configuration differences
- **StackSets** = deploy stacks across multiple accounts and regions from a single operation

---

# Amazon SQS
## Message queuing
- **FIFO queue** = strict message ordering + rate control — use for ordered workloads
- Standard queue = no ordering guarantee
- Scale ASG based on `ApproximateNumberOfMessagesVisible` metric

---

# EC2 Auto Scaling
## Dynamic and scheduled capacity management
- Scale on SQS queue depth (`ApproximateNumberOfMessagesVisible`) for queue-based workloads
- **Spot Fleet** with `lowestPrice` + `InstancePoolsToUseCount` = cost-optimized + interruption-resistant
- `UpdatePolicy` + `WaitOnResourceSignals` = rolling CloudFormation updates without downtime

---

# AWS IAM — Passing Roles to EC2
## How to allow users to launch instances with IAM roles
- User needs `iam:PassRole` and `iam:GetRole` to pass an approved role to EC2
- The IAM role itself needs a **trust policy** allowing the EC2 service to assume it
- SCPs are for org-wide permission guardrails, not for passing roles to AWS services

---

# Amazon S3 Glacier
## Long-term archival with compliance controls
- **Vault Lock policy** = WORM, immutable once locked — cannot be changed
- **Vault access policy** = mutable access control (not compliance-grade)
- **Data Retrieval Policy** = controls retrieval rates and costs

---

# S3 Inventory
## Bulk reporting on object metadata
- Generates CSV/ORC/Parquet files listing objects with metadata including **replication status** and **encryption status**
- Runs on a daily or weekly schedule
- Easiest way to audit all objects — no scripting needed

---

# Amazon ELB — EC2 Recovery
## Automated recovery preserves IPs
- CloudWatch alarm on `StatusCheckFailed_System` + EC2 **recover** action = auto-recovery
- Recovered instance keeps: same instance ID, private IP, Elastic IP, and metadata
- Use SNS topic for email notification when alarm triggers recovery
- Auto Scaling groups would replace (not recover) the instance — private IP would change

---

# AWS DataSync
## Managed data transfer service
- Transfers files between storage services (EFS to EFS, on-premises to S3, etc.)
- Preserves file metadata including filenames (unlike direct Glacier upload)
- Use DataSync → S3 → lifecycle policy → Glacier to preserve filenames in archival workflows

---

