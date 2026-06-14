# AWS CloudOps Exam 5 — Quick Reviewer

---

# Cost Optimization — EC2 and EBS
## Know what gets charged and what doesn't
- **EBS volumes** are billed even when not attached to any instance — delete idle volumes to save costs
- **Elastic IPs** are only charged when unattached or when more than one is associated with a running instance
- **Reserved Instances** = significant discount for workloads running continuously for 1+ years
- Auto Scaling groups themselves do not incur extra charges — only the EC2 instances do
- Moving all instances to one AZ to avoid inter-AZ transfer costs sacrifices availability — not recommended for production

---

# Amazon SNS
## Pub/sub notifications for CloudWatch alarms
- Subscribe email addresses or SMS numbers to an SNS topic
- CloudWatch alarms publish to SNS when triggered
- SNS is a push model — SQS is a pull model; SNS cannot send emails by itself without a subscription

---

# Amazon RDS — High Availability vs Scalability
## Multi-AZ vs Read Replicas — they serve different purposes
- **Multi-AZ** = automatic failover to standby in different AZ; the primary goal is **high availability**
- **Read Replicas** = offload read-heavy workloads (ETL, analytics); NOT for high availability
- Backup retention period **cannot be set to 0** when Multi-AZ is enabled
- `DependsOn` in CloudFormation = ensures EC2 instance is created only after the RDS instance is ready

---

# Amazon DLM (Data Lifecycle Manager)
## Automated EBS snapshot management
- Use DLM instead of custom Lambda scripts for snapshot creation and retention
- Must configure the retention period yourself — there is no default retention period
- DLM is **free to use**; you only pay for the snapshot storage in S3
- Better than a Lambda function because code changes in Lambda won't break the retention logic

---

# Amazon CloudWatch — Custom Metrics and Alarms
## Know the CLI commands and monitoring levels
- `put-metric-data` CLI command = publish custom metrics to CloudWatch (not `put-metric-alarm`)
- `put-metric-alarm` = creates or updates an alarm; does not publish data
- `put-dashboard` = creates a CloudWatch dashboard; not for publishing metrics
- For a 3-minute reboot alarm, use **detailed monitoring** (1-min intervals) — basic monitoring (5-min) is too coarse
- CloudWatch Logs Insights + `stats` + `count()` = count and classify errors across up to 50 log groups
- To stream NGINX logs to CloudWatch: install CloudWatch Agent + attach IAM role with CloudWatch permissions

---

# Amazon VPC — CIDR Sizing and Internet Access
## AWS reserves 5 IPs per subnet
- Formula: usable IPs = 2^(32−prefix) − 5
- `/26` = 59 usable IPs (enough for 30 EC2 instances)
- `/27` = 27 usable IPs (not enough for 30)
- For public subnet internet access: attach IGW + add route `0.0.0.0/0 → IGW` + assign public IP to instance
- **NAT Gateway** and **NAT Instance** = IPv4 outbound-only (blocks inbound internet connections)
- **Egress-only Internet Gateway** = IPv6 outbound-only (not for IPv4)

---

# Amazon Aurora — Availability
## Aurora Replicas provide both scalability and availability
- Up to 15 Aurora Replicas across AZs — fast failover if primary fails
- `AuroraReplicaLag` metric spike = replicas are falling behind → reads may return stale data
- Aurora automatically promotes a replica to primary if the primary fails
- Cannot deploy Aurora on EC2 instances — it's a managed service

---

# EC2 Auto Scaling — Protecting In-Progress Work
## Prevent scale-in during critical processing
- `SetInstanceProtection` API with `ProtectedFromScaleIn=true` = prevents termination while a job is running
- Enable at job start, disable at job end
- Lifecycle hook `Terminating:Wait` delays termination but can't guarantee job completion unless the script signals properly
- **Warm pool** = pool of pre-initialized instances that reduce boot latency during scale-out events

---

# Amazon CloudWatch Agent
## Required for custom metrics and log streaming
- Install the CloudWatch Agent + attach an IAM role with CloudWatch permissions to the EC2 instance
- The IAM role must have permissions for `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`
- CloudTrail IAM role permissions are insufficient for pushing logs to CloudWatch

---

# AWS IAM — Security Best Practices
## Always follow least privilege and avoid root key usage
- Enable **MFA** for all privileged users
- Grant access on a **least privilege** basis
- Never use root access keys for applications — use IAM roles on EC2 instances instead
- Never embed access keys in application config files — use IAM roles for temporary credentials
- For corporate SSO with per-user S3 folder access: use Federation proxy + Identity Provider + STS + IAM roles (not individual IAM users)

---

# Amazon Cognito — ADFS Integration
## Connect corporate Active Directory to Kibana on OpenSearch
- Create a **Cognito User Pool** → set ADFS as an external SAML IdP
- Enable Cognito authentication on the Amazon OpenSearch domain for Kibana login
- Amazon OpenSearch does not directly support Active Directory as an identity provider — Cognito is the bridge

---

# Amazon EventBridge + EBS Snapshots
## Event-driven cross-region snapshot copies
- EBS emits state-change events to EventBridge when a snapshot is completed
- Create an EventBridge rule that triggers a Lambda function to copy the snapshot to another region
- S3 bucket events cannot trigger EBS snapshot copies
- Step Functions is overkill for this use case

---

# Amazon Route 53 — Record Types for Zone Apex
## CNAME cannot be used at the root domain
- For an apex domain (e.g., `example.com`) pointing to an ALB: use **Alias record**
- CNAME can only be used for subdomains (e.g., `www.example.com`)
- Alias records are free and do not count as additional DNS queries
- AAAA record = IPv6 address mapping; TXT record = text metadata (no routing)

---

# CloudWatch Logs Insights
## Fast ad-hoc log analysis across multiple log groups
- `stats` command + `count()` function = count error occurrences, group by error type
- Queries up to 50 log groups in a single request
- Faster than creating metric filters for ad-hoc analysis
- Use Athena for SQL queries on CloudTrail logs stored in S3 (not in CloudWatch)

---

# AWS CloudFormation StackSets
## Update stacks across multiple accounts simultaneously
- Use StackSets to push template updates to all accounts at once
- **Change Sets** only preview changes on a single stack — not multi-account
- Drift detection shows actual vs. expected configuration for a single stack

---

# Amazon EKS — Horizontal Pod Autoscaler
## Scale pods in Kubernetes based on CPU/memory
- Must install **Kubernetes Metrics Server** in the EKS cluster before HPA can work
- Must configure `kubectl` to communicate with the EKS cluster (`aws eks update-kubeconfig`)
- HPA scales the number of pods; VPA resizes individual pod resource allocations

---

# EC2 Image Builder
## Create pre-baked AMIs to reduce ASG launch time
- Build an AMI with all dependencies pre-installed → reference it in your ASG launch template
- Instances launched from this AMI skip user data installation scripts → shorter boot time
- EC2 Image Builder does NOT reduce boot latency of existing running instances

---

# Amazon Athena
## Serverless SQL queries on S3 data
- Used to query CloudTrail logs stored in S3 for audit analysis
- No cluster or server setup needed — truly serverless
- QuickSight = visualization only; Redshift Spectrum = requires a Redshift cluster

---

# AWS CloudHSM
## FIPS 140-2 validated hardware security module
- AWS has **no access** to customer keys in CloudHSM (unlike KMS where AWS manages the HSMs)
- Use CloudHSM when regulations require customer-exclusive key control
- More complex and expensive than KMS — only use when required by compliance

---

# AWS Elastic Beanstalk — Deployment Strategies
## Know the deployment options and their tradeoffs
- **All at Once** = fastest deployment; brief downtime during update
- **Rolling** = updates instances in batches; capacity reduced during update
- **Rolling with additional batch** = launches extra instances first; no capacity reduction
- **Blue/Green** = separate environment; full capacity maintained; swap DNS when ready

---

# EBS RAID Configurations
## RAID 1 for redundancy, RAID 0 for performance
- **RAID 1** = mirrors data across volumes; provides data redundancy for compliance/backup requirements
- **RAID 0** = stripes data for max I/O; no redundancy — do not use for critical data
- For EBS backups: create **encrypted EBS snapshots** for security + compliance

---

# Amazon S3 — Compliance and Access Control
## Object Lock and MFA-authenticated access
- **S3 Object Lock (Compliance mode)** = objects cannot be deleted or modified for the retention period — even by root
- **SSE-KMS default encryption** = for compliance requiring customer-managed key control
- To restrict S3 bucket access to users with MFA, use a bucket policy `Condition` with `aws:MultiFactorAuthPresent`
- S3 versioning prevents permanent accidental deletion (objects become delete-marked, not gone)

---

# Amazon S3 — CloudFront Cache Invalidation
## How to force CloudFront to serve fresh content
- **CloudFront invalidation** = marks cached objects as expired immediately — charged per path
- **Versioned filenames** = rename files on deployment (e.g., `app-v2.js`) — CloudFront sees it as new content; no charge
- Versioned filenames are preferred over invalidations for frequent deployments

---

