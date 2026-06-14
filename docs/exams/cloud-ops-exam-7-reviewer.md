# AWS CloudOps Exam 7 — Quick Reviewer

---

# Amazon Route 53
## Routing policies and hybrid DNS

- **Weighted routing** = split traffic by percentage between resources — best for canary testing or gradual rollouts
- **Latency-based routing** = routes to the region with the lowest latency for the user
- **Failover routing** = active-passive; routes to secondary when primary health check fails
- **Alias record** = use for zone apex (root domain like `example.com`) pointing to an ALB — no static IP needed, no CNAME equivalent at root
- **Resolver inbound endpoint** = on-premises DNS forwards queries to this endpoint → resolves AWS private hosted zone names
- **Resolver outbound endpoint** = AWS forwards queries to on-premises DNS → resolves on-premises hostnames from within VPC

---

# Amazon CloudFront
## Cache management and content protection

- **Origin Shield** = extra caching layer; consolidates cache misses from multiple edge locations → reduces origin load and improves hit ratio
- Increase TTL = objects stay cached longer → higher cache hit ratio
- **CloudFront invalidation** = forces TTL to expire immediately for specific paths — use after deployments
- **Versioned filenames** = rename assets on deployment (e.g., `app-v2.js`) — CloudFront treats them as new objects; avoids invalidation charges
- **OAC (Origin Access Control)** = restricts S3 bucket so only CloudFront can access it — prevents direct S3 URL access
- CloudFront + WAF + Shield = protection against SQL injection, XSS, and DDoS

---

# AWS Secrets Manager
## Automated credential management
- Store database credentials and retrieve them in Lambda/EC2 at runtime — no hardcoded passwords
- Supports automatic rotation on a schedule
- Use with SSM Parameter Store (SecureString) as an alternative for simple non-rotating secrets

---

# Amazon FSx for Windows File Server
## Windows-native file system with SMB and AD support
- Use FSx when Windows EC2 instances need SMB protocol, Windows ACLs, or Active Directory integration
- EFS supports NFS only — no Windows ACL support
- Multi-AZ FSx = automatic failover; Single-AZ = no failover

---

# AWS Compute Optimizer
## Right-sizing recommendations for EC2, EBS, and Lambda
- Recommends the right EBS volume IOPS/throughput settings to match actual usage
- Recommends EC2 instance types based on utilization patterns
- Recommends Lambda memory settings to optimize cost and performance
- Compute Optimizer provides recommendations only — does not make changes automatically

---

# Amazon Athena
## Serverless SQL on S3 data
- Analyze VPC Flow Logs stored in S3 — e.g., find what destinations are using the most NAT gateway bandwidth
- Analyze CloudTrail logs for audit queries (who called which API when)
- Serverless — no cluster setup (unlike Redshift Spectrum which requires a Redshift cluster)
- QuickSight = visualization only; Athena = querying

---

# Amazon EBS
## Volume performance and snapshot restore speed
- **EBS Fast Snapshot Restore (FSR)** = volumes restored from snapshots deliver full IOPS immediately without initialization delay — useful for databases that need instant performance after restore
- **gp3** upgrade from gp2 = consistent 3,000 IOPS without burst credit depletion; use when gp2 bursts are exhausted under sustained load
- EBS CloudWatch metrics: `VolumeReadOps`, `VolumeWriteOps` — these are for EBS volumes; `DiskReadOps` is for instance store only

---

# Amazon ElastiCache Redis
## In-memory caching with high availability options
- **Multi-AZ + automatic failover** = minimizes RTO during primary node failure
- **Cluster mode enabled** = horizontal sharding across multiple shards for larger datasets
- Online resizing = can downsize node type with minimal downtime
- Redis supports Multi-AZ; Memcached does not

---

# CloudWatch Logs Insights
## Count and classify errors across multiple log groups
- `stats count(errorType) by errorType` = counts error occurrences grouped by type
- Queries up to 50 log groups per request in a single Insights query
- Much faster than creating individual metric filters for ad-hoc classification

---

# Amazon EKS — Kubernetes HPA
## Scale pods automatically on CPU/memory
- Must install **Kubernetes Metrics Server** before HPA can be configured
- Run `aws eks update-kubeconfig` to configure `kubectl` to communicate with your EKS cluster
- HPA adds pod replicas to handle traffic surges; VPA resizes individual pod resource limits

---

# AWS IAM — Cross-Account Access
## Service-to-service access across accounts
- Lambda in Account A needs to access DynamoDB in Account B: create an IAM role in Account B with a **trust policy** that allows Account A's Lambda to assume it
- The Lambda execution role in Account A needs `sts:AssumeRole` permission targeting the Account B role
- This pattern avoids embedding static credentials across accounts

---

# AWS Systems Manager
## Broad operational tool — know specific use cases

- **CloudWatch Agent via SSM**: store agent config in Parameter Store → use State Manager to deploy consistently across regions
- **Distributor + State Manager**: install MSI software on tagged Windows EC2 instances automatically
- **Run Command**: immediate ad-hoc execution on managed instances
- **Session Manager failure**: check IAM role permissions, SSM Agent running, and VPC endpoint if in private subnet
- **Patch Manager with patch groups**: use separate patch baselines for staging vs production by tagging instances with `Patch Group` tag

---

# Amazon DynamoDB
## Serverless NoSQL with cross-account access and monitoring
- `ConsumedReadCapacityUnits` metric = monitor read capacity usage; set alarm before throttling occurs
- Use SCPs to block DynamoDB access org-wide including root users
- Cross-account DynamoDB access = IAM role assumption (same pattern as any cross-account service access)

---

# Amazon Route 53 Resolver DNS Firewall
## Block malicious DNS queries within VPCs
- Intercepts DNS queries at the VPC's DNS resolver before they resolve to malicious IPs
- Blocks known malware domains, C2 servers, and other threat intelligence sources
- Works natively within the DNS resolution path — no agent installation needed on instances

---

# AWS CloudFormation
## Reuse and multi-account deployment patterns
- **Nested stacks** = extract duplicate resource definitions into shared templates — eliminates repetition across multiple stacks
- StackSets `OUTDATED` status = stack instance is out of sync with the stack set; caused by concurrent updates or account not being opted in to trusted access
- Use CloudFormation to replicate dashboards, monitoring, or alerting across multiple environments

---

# Amazon S3
## Lifecycle, Object Lock, and access tracing
- **Abort incomplete multipart uploads** = use an S3 lifecycle rule to clean up failed multipart uploads automatically — lowest operational overhead solution
- **Object Lock governance mode deletion** = requires `s3:BypassGovernanceRetention` permission AND the `x-amz-bypass-governance-retention: true` header in the delete request
- Use SCPs to prevent bucket deletions across all accounts in the org
- To trace unexpected S3 LIST requests: enable S3 server access logs + CloudTrail data events for S3 → use Athena to query

---

# Application Load Balancer — Load Distribution
## Sticky sessions and cross-zone load balancing
- **Sticky sessions** = sends all requests from one client to the same target; can cause uneven load if one instance handles many long-lived sessions
- **Fix for uneven distribution**: disable stickiness OR enable cross-zone load balancing
- **Slow start mode** = gradually increases request rate to a new target instance — prevents overloading fresh instances during scale-out

---

# AWS Savings Plans
## Flexible commitment pricing for compute
- **Compute Savings Plans** = covers EC2, Lambda, and AWS Fargate containers (1 or 3-year commitment)
- All Upfront payment option = maximum discount
- Savings Plans are more flexible than Reserved Instances — apply across instance families, regions, and services

---

# AWS Billing Alerts
## Must enable before creating CloudWatch billing alarms
- Go to Billing Preferences → enable billing alerts **before** creating a CloudWatch alarm on estimated charges
- Billing alerts are not enabled by default for new accounts

---

# Amazon CloudWatch Alarm + SSM Automation
## Self-healing applications via automated runbooks
- CloudWatch alarm on a process metric (e.g., process stopped) → triggers SSM Automation runbook to restart the process
- Pattern: alarm → SSM Automation → restart/remediate
- More reliable than alerting a human and waiting for manual action

---

# Amazon VPC — Advanced Routing
## NAT Gateway route table, flow log customization, and Client VPN
- Single NAT Gateway failure: update all **private subnet route tables** to point to a new/replacement NAT Gateway
- VPC Flow Log custom format: to add the `tcp-flags` field, you must **delete the existing flow log and recreate it** with the new format — flow log configuration is immutable
- **Client VPN split tunneling**: only VPC-bound traffic goes through the VPN tunnel; all other internet traffic goes directly — reduces bandwidth consumption
- Deploy internal EC2 instances in **private subnets** with no internet route for maximum isolation

---

# AWS KMS — Key Deletion Window
## Safeguards before permanent key deletion
- Scheduled deletion waiting period: **7 to 30 days**
- During this window, key state = `PendingDeletion` — cannot encrypt or decrypt any data
- You CAN cancel the deletion during the waiting period
- Once the waiting period expires and the key is deleted, it cannot be recovered

---

# AWS Storage Gateway — Tape Gateway
## Virtual tape library for backup workloads
- Error "Not Enough Space" on Tape Gateway = add more upload buffer disk OR archive tapes to free up space
- Tape Gateway replaces physical tape infrastructure with virtual tapes stored in S3/Glacier
- Predictable retrieval from Glacier — plan ahead for restore times

---

# AWS CloudTrail — Specific Use Cases
## Trace the exact API calls that caused infrastructure changes
- Who changed an ASG minimum capacity? → search CloudTrail for the `UpdateAutoScalingGroup` API call
- Trace unexpected S3 LIST requests → enable CloudTrail **data events** for S3 operations
- CloudTrail + S3 server access logs together provide full S3 request tracing (management + data events)

---

# AWS Config — S3 Public Access
## Automated remediation for public S3 buckets
- `s3-bucket-public-read-prohibited` managed rule = flags publicly readable S3 buckets
- Configure auto-remediation to remove public access settings automatically
- Release unused/unassociated Elastic IPs using Config + Lambda remediation (Config detects, Lambda releases)

---

# EC2 Auto Scaling Warm Pool
## Pre-initialized instance pool for long boot scripts
- Instances in the warm pool boot and run initialization scripts in advance
- When scale-out is triggered, instances are drawn from the warm pool ready to serve traffic
- No need to increase baseline (desired) capacity to compensate for slow launch times

---

# AWS Organizations SCPs
## Org-wide hard guardrails including root users
- Block DynamoDB access across all accounts — even root users cannot bypass an SCP deny
- Prevent S3 bucket deletions org-wide — protects against accidental or malicious bucket deletion
- SCPs set the maximum permissions boundary; IAM still controls the actual permissions within that boundary

---

# Amazon CloudWatch Metric Filters
## Create alarms from log content
- Define a filter pattern on a log group (e.g., match HTTP 503 errors)
- CloudWatch creates a metric from match counts
- Set a CloudWatch alarm that fires when the match count exceeds a threshold

---

# AWS Client VPN
## Managed remote access VPN
- **Split tunneling**: only traffic destined for VPC CIDRs goes through the VPN; all other traffic goes directly to internet — reduces bandwidth and latency for internet-bound traffic
- Without split tunneling, all client traffic (including internet) routes through the VPN endpoint

---

