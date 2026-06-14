# AWS CloudOps Exam 1 — Quick Reviewer

---

# Amazon RDS
## Multi-AZ = automatic failover with zero data loss
- Synchronous replication means the standby is always up to date before the primary confirms a write
- Failover is automatic — no scripts needed
- Read replicas use **async** replication — not suitable for zero data loss failover
- To force SSL on PostgreSQL RDS, set `rds.force_ssl = 1` in the **DB parameter group**
- For granular OS-level metrics (CPU per process/thread), enable **Enhanced Monitoring** on the instance
- To offload heavy read queries (e.g. ETL), create a **Read Replica** and point the ETL there

---

# Amazon EC2
## Know what each status check covers and when to use special options

- `StatusCheckFailed` covers **both** instance and system checks (use this for alarms)
- `StatusCheckFailed_Instance` = only instance check; `StatusCheckFailed_System` = only system check
- Enhanced networking (SR-IOV) is for workloads near or exceeding **20,000 PPS**
- To change instance type on an **instance store-backed** instance: create an AMI → launch a new instance → re-associate the Elastic IP
- To change instance type on an **EBS-backed** instance: stop it → change type → start it (instance ID stays the same)
- Resizing (changing instance type) only works if the root device is an **EBS volume**
- If the instance is in an Auto Scaling group and you stop it, ASG may terminate it — suspend scaling first
- `DisableApiTermination` does NOT stop Auto Scaling from terminating an instance on scale-in; use **instance protection** for that
- You **cannot** enable termination protection on Spot Instances
- **Dedicated Host** = physical server you own; use for per-socket/per-core software licenses
- To create an application-consistent AMI, **disable "No reboot"** so the instance flushes buffers before snapshot

---

# AWS CloudFormation
## Infrastructure as code — know the common failure modes

- `cfn-signal` not received = either **timeout** hit or **no network route** to CloudFormation (check NAT/IGW for private subnets)
- `DeletionPolicy: Snapshot` = auto-snapshot an EBS volume when the stack is deleted
- `OnFailure=DO_NOTHING` = keeps EC2 instances alive on stack failure so you can SSH in and debug logs
- If stack deletion silently fails with no error = **termination protection** is on; disable it first
- Wait Condition = makes CloudFormation pause until `cfn-signal` is received; without it, stack completes before your app finishes bootstrapping
- CloudFormation **stack policy** only controls stack updates — it does NOT replace IAM for access control
- To import existing manually-created resources into CloudFormation, use **resource import**
- To deploy IAM roles across many AWS accounts, use **CloudFormation StackSets** with AWS Organizations
- CloudWatch agent is auto-installed on ASG instances only if the **AMI already has it baked in**

---

# AWS CloudTrail
## Logs every API call made to AWS services
- Use CloudTrail to see who called ELB APIs from the Console or CLI
- Not the same as CloudWatch (metrics/alarms) or Load Balancer access logs (HTTP request logs)

---

# Amazon CloudWatch
## Monitoring and alerting for AWS resources

- `NetworkIn` and `NetworkOut` = total bytes received/sent by an EC2 instance (use to find highest bandwidth user)
- CloudWatch Agent: if you `append-config` using a file with the **same filename** as an existing config, it **overwrites** — not appends

---

# S3 Glacier
## Long-term archival with tamper-proof WORM compliance
- Use **Vault Lock Policy** to enforce WORM (write once, read many) — once locked, the policy cannot be changed
- You cannot copy data directly from Snowball Edge to Glacier — first copy to S3, then use a **lifecycle policy** to transition to Glacier

---

# AWS Budgets
## Set spending alerts with minimal setup
- Filter budgets by charge type (e.g. inter-Region data transfer) and alert at a % threshold
- Sends email directly — no Lambda, no custom code needed
- Simpler than CloudWatch for cost alerts; CloudWatch estimated charges alarms don't support filtering by charge type

---

# Amazon ElastiCache (Redis)
## In-memory cache — evictions mean you're running out of memory
- High evictions = Redis is full and dropping keys
- Fix: switch to a **larger node instance type** for more memory
- Don't increase TTL — that makes items stay longer and worsens eviction pressure
- Multi-AZ failover doesn't reduce evictions; it's a HA feature, not a memory fix

---

# EC2 Auto Scaling
## Scaling strategies — know which fits which pattern

- **Scheduled scaling** = best for predictable, recurring traffic spikes (e.g. every day at noon)
- **Predictive scaling** = lets AWS forecast and pre-scale automatically based on historical patterns
- **Target tracking** = reactive; scales after metrics change, too slow for known spikes
- Increasing minimum capacity wastes money outside the peak window

---

# AWS IAM Identity Center
## Federate with external identity providers (IdP) using SAML 2.0
- You need two things to set up federation:
  1. **IAM Identity Center SAML metadata** (service provider metadata) → give to your IdP
  2. **IdP metadata + X.509 certificate** → configure in IAM Identity Center

---

# AWS Snowball Edge
## Physical device for moving petabyte-scale data to AWS
- Each device: 80 TB usable HDD, 40 vCPUs, up to 40 Gb network
- Cannot copy directly to Glacier — go through **S3 → lifecycle policy → Glacier**
- Use when internet bandwidth is insufficient for the data volume

---

# Amazon S3
## Object storage — lots of exam-tested gotchas

- **Transfer Acceleration** = faster uploads from distributed locations via AWS edge network
- **Default Encryption (SSE-S3)** = simplest way to enforce encryption on all new uploads
- **Pre-signed URLs** = time-limited secure access to private objects — best for sharing with many dynamic users
- **S3 Access Logs + Athena** = analyze access patterns and detect unauthorized access attempts
- **Cost per bucket** = tag each bucket → activate as cost allocation tag → filter in Cost Explorer
- **MFA-Delete**: only the **root account** can enable it, and only via **AWS CLI** (not the Console)
- MFA is required for: (1) permanently deleting an object version, and (2) suspending versioning
- In a versioning-enabled bucket, deleting an object creates a **delete marker** — the object is NOT gone
- A GET request does NOT return a delete marker (use `GET Bucket versions` to list them)
- Bucket deletion fails with "not empty" if **delete markers still exist** from versioning
- Root user can be locked out of a bucket if an IAM user set a bucket policy that excludes the root user principal — fix by adding root back to the bucket policy
- For cross-account S3 access: identity-based policy in the requester's account + resource-based policy (bucket policy) in the target account — both are required

---

# Amazon S3 Object Lock
## Retention periods apply per object version, not per bucket

- Setting a retention period explicitly requires a **Retain Until Date**
- Different versions of the same object can have **different retention modes and periods**
- Bucket default settings do NOT override explicit per-version retention settings

---

# Amazon CloudFront
## CDN — cache more to reduce origin load

- Low cache hit ratio fix: (1) enable **Origin Shield** to consolidate misses, (2) increase **TTL** so objects stay cached longer
- **Origin Shield** = extra caching layer between edge and origin, reduces duplicate origin requests
- When S3 is configured as a **website endpoint**, CloudFront can only communicate with it over **HTTP** (not HTTPS) — HTTPS viewer policy still works for viewers
- CloudFront **access logs + Athena** = best way to analyze 4xx/5xx errors at scale

---

# Amazon EBS
## Block storage for EC2 — know the edge cases

- EBS stuck in "attaching" state = **device name conflict** — the name is already in use; detach and retry with a different device name
- Non-root EBS volumes: `DeleteOnTermination` is false by default — data persists after instance termination
- EBS snapshots only capture **data already written to disk** — locally cached data may be missing; detach or stop instance first for consistency
- Separate OS and data volumes even if root persistence is available (AWS best practice)
- Snapshots are on S3 but **not accessible via S3 APIs**

---

# Amazon VPC / Security Groups / NACLs
## Know the stateful vs stateless difference

- **Security Groups** = stateful (return traffic is automatic)
- **NACLs** = stateless (you need explicit inbound AND outbound rules)
- If Flow Logs show inbound ACCEPT + outbound REJECT → NACL is missing an outbound rule
- VPC Flow Log configuration is **immutable** after creation — to change IAM role, delete and recreate
- Default NACL = allows all inbound and outbound traffic
- Security group inbound rule changes and NACL inbound/outbound rule changes can all cause RDS connectivity loss

---

# AWS KMS
## Cross-account key sharing requires two policies

- **Key policy** in the owning account: grants the external account permission to use the key
- **IAM policy** in the external account: delegates those key permissions to its users/roles
- Both must be in place — neither alone is enough

---

# AWS Storage Gateway (File Gateway)
## Connects on-premises NFS/SMB to S3 with local caching

- Use File Gateway when you need NFS or SMB access to S3 data from on-premises
- Files are stored in S3; frequently accessed files are cached locally for low latency
- Data in transit is encrypted with **SSL/TLS**
- Data at rest is encrypted with **SSE-S3** by default (can upgrade to SSE-KMS)

---

# Amazon Cognito
## User authentication for mobile/web apps
- Use **Cognito User Pool** for sign-up/sign-in
- Use **Cognito Identity Pool** to grant authenticated users temporary AWS credentials (e.g., to write to S3)
- Better than creating individual IAM users or hardcoding access keys in the app

---

# Amazon EventBridge
## Event-driven automation — best for real-time reactions to AWS events
- Use EventBridge to detect EC2 instance launch events and trigger an SNS notification
- More reliable and lower maintenance than embedding scripts in EC2 user data

---

# AWS Backup
## Centralized backup across accounts and Regions
- Integrates with AWS Organizations for multi-account backup policies
- Assign resources by tag → apply backup plans based on environment (prod vs. dev)
- Supports cross-account and cross-Region backups

---

# Amazon Athena
## Run SQL queries directly on S3 data — serverless
- Used to analyze CloudFront access logs, S3 access logs, and other log data in S3
- No infrastructure to manage

---

# AWS X-Ray
## Application tracing and service maps
- **ALB adds** a trace ID header (`X-Amzn-Trace-Id`) but does **NOT** send data to X-Ray
- ALB will **not** appear as a node on your X-Ray service map
- Lambda and API Gateway are natively integrated with X-Ray

---

# Application Load Balancer (ALB)
## HTTP/HTTPS load balancing

- You must add **at least one listener** before the ALB will accept traffic
- Target groups are attached to **listener rules** — not directly to the ALB
- Clients can't connect = check security group and NACL rules allow inbound traffic on listener port

---

# AWS Shared Responsibility Model
## Know what AWS manages vs. what you manage

- **EC2 = IaaS**: you manage the guest OS, patches, app software, and security groups
- AWS manages the physical hardware and hypervisor
- For managed services (S3, RDS), AWS handles the OS and platform — you manage data and access

---

# CloudWatch Agent — Append Config Behavior
## Same filename = overwrite, not append
- If you append a config file with the same name as an existing one (even from a different path), it **overwrites** the existing config
- Use different filenames to truly append multiple config files

---
