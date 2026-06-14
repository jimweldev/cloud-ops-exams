# AWS CloudOps Exam 4 — Quick Reviewer

---

# AWS Systems Manager Automation
## Custom and pre-defined runbooks for operational tasks
- Can create custom workflows or use AWS pre-defined automation documents (runbooks)
- Notifications for automation events via **Amazon EventBridge**
- Limits: max 25 concurrent executions, max 12 hours per execution duration
- Automation documents can be shared across accounts — they are not locked to a user

---

# Amazon CloudFront
## CDN for global performance improvement
- Best solution when users are geographically far and experience slow load times (not CPU-related)
- Reports available: Popular Objects, Usage by region, Cache Statistics (status code breakdown), Top Referrers
- Use CloudFront + WAF to block SQL injection and XSS attacks
- Works with ALB, EC2, S3 as origins

---

# Amazon RDS
## Managed relational database service
- AWS handles: automated backups (5-min PITR), OS security patches, underlying hardware
- AWS does **NOT** automatically create read replicas or Multi-AZ — you configure these
- Max backup retention period: **35 days** (not 1 year)
- **RDS Proxy** = connection pooling between Lambda/EC2 and RDS; preserves connections during failover

---

# Amazon CloudWatch
## Monitoring, metrics, dashboards, and alarms
- `DiskReadOps` always = 0 on EBS-backed instances with **no instance store volumes** attached
- Memory and swap metrics require installing the **CloudWatch Agent** (no built-in EC2 memory metric)
- Detailed monitoring = 1-minute intervals; Basic monitoring = 5-minute intervals (default)
- CloudWatch Agent must be installed + IAM role with CloudWatch permissions must be attached to push logs/metrics
- CloudWatch cross-region dashboard = view metrics from multiple regions on a single dashboard

---

# EC2 Tags
## The simplest way to filter instances for automation
- Use tags to opt-in or opt-out of automated tasks (start/stop scripts, patching, etc.)
- Tagging by environment (dev/prod) or team is a best practice for cost tracking and automation

---

# AWS Organizations
## Centralized multi-account management and billing
- Add existing accounts by **sending invitations** from the management account console
- SCPs = org-wide permission guardrails that apply to all accounts including root users
- Use `aws:PrincipalOrgID` condition in S3 bucket policies to restrict access to only accounts within the org

---

# Network Load Balancer (NLB)
## Layer 4 TCP/UDP load balancing for extreme performance
- Handles millions of requests per second with ultra-low latency
- Best for volatile traffic patterns or raw TCP/UDP
- Does NOT support host/path-based routing or AWS WAF integration

---

# Amazon Route 53
## DNS routing policies and record types

- **A record** = maps hostname to IPv4 address (use for non-AWS resources like on-premises servers)
- **Alias record** = AWS-specific extension; routes zone apex (e.g., example.com) to AWS resources like ALB
- CNAME cannot be used at the **zone apex** (root domain) — use Alias records instead
- For active-passive failover to on-premises servers: use A records + HTTP health checks
- Alias records cannot point to on-premises servers — only to AWS resources

---

# Amazon Inspector
## EC2 instance security assessment
- Analyzes EC2 instance behavior: network activity, file system, running processes
- Identifies potential security issues and vulnerabilities
- Used for security assessments — not for architecture best practice checks (that's Trusted Advisor)

---

# Amazon EBS — Performance Optimization
## EBS-optimized instances and IOPS provisioning
- **EBS-optimized instance** = dedicated EBS bandwidth; minimizes contention between EBS I/O and other traffic
- If high bandwidth is the problem, check if the instance type supports EBS optimization — if not, change it
- **Provisioned IOPS SSD (io1/io2)** = for workloads requiring >10,000 IOPS or high-throughput databases
- `DiskReadOps` CloudWatch metric only counts **instance store** disk operations — always 0 on EBS-only instances

---

# AWS Shield Advanced
## Managed DDoS protection
- Protects against SYN floods, UDP floods, and volumetric DDoS attacks at Layer 3/4
- Includes 24x7 DDoS Response Team (DRT) access
- Covers EC2, ELB, CloudFront, and Route 53 resources
- Use Shield Advanced when facing infrastructure-layer attacks — WAF alone is not sufficient for DDoS

---

# AWS CloudFormation — Failure Behavior
## Know default behavior and rollback states
- Default `OnFailure` behavior when not specified = **ROLLBACK** (not DELETE, not DO_NOTHING)
- Rollback preserves the stack — it does not delete the stack itself (only resources created so far are rolled back)
- `UPDATE_ROLLBACK_FAILED` state = use the `ContinueUpdateRollback` API to resume
- **Resources** section is the only required section in a CloudFormation template

---

# AWS CloudTrail
## API call audit logging
- Captures all API calls including federated user calls (AssumeRoleWithWebIdentity)
- The `userIdentity` section of CloudTrail logs maps API calls to federated callers
- Use CloudTrail to answer "who made this API call?" across all services

---

# AWS Health Dashboard
## AWS infrastructure and outage notifications
- Provides personalized account-level health events (not just global AWS status)
- Use EventBridge + Lambda + Slack integration for real-time Slack notifications on AWS health events
- AWS Trusted Advisor checks best practices; AWS Health Dashboard checks service availability

---

# AWS Artifact
## On-demand compliance documentation
- Provides PCI DSS, SOC, ISO, and other compliance reports and certificates
- Contains the PCI DSS Attestation of Compliance (AOC)
- Not to be confused with AWS Certificate Manager (ACM) — Artifact is for compliance docs, ACM is for SSL certs

---

# Amazon Cognito
## User authentication for mobile and web apps
- Use for social media logins (OAuth/OpenID Connect)
- **User pool** = user directory for sign-up/sign-in
- **Identity pool** = assigns IAM roles for authenticated users to access AWS resources (S3, DynamoDB, etc.)

---

# Amazon RDS Proxy
## Connection pooling between Lambda/EC2 and RDS
- Reduces connection overhead from Lambda functions (Lambda can create many short-lived DB connections)
- Automatically connects to standby DB during failover while **preserving existing application connections**
- Reduces "too many connections" errors during traffic spikes

---

# AWS Storage Gateway — Volume Gateway
## Cache hit and disk management
- Low `CacheHitPercent` + high `CachePercentUsed` = cache disk is too small → add a larger cached disk
- To increase cache size: create a new disk in the host environment → edit local disk in the Storage Gateway console
- Do NOT resize the existing cache disk — add a new one

---

# AWS WAF
## Web Application Firewall
- Create IP sets and web ACLs to block specific IP ranges
- Integrates with ALB and CloudFront — does **NOT** integrate with NLB
- Blocks SQL injection, XSS, and HTTP flood attacks

---

# AWS Config Rules
## Continuous compliance monitoring
- `s3-bucket-logging-enabled` = checks if S3 access logging is enabled; can auto-remediate
- `require-tags` = checks tag compliance on resources
- Remediation actions use SSM Automation documents
- Use AWS Firewall Manager + Config to enforce security group rules across multiple accounts in AWS Organizations

---

# AWS Cost and Usage Report (CUR)
## Detailed billing data for analysis
- Delivers CSV reports to an S3 bucket (daily or monthly granularity)
- Best for spreadsheet-based analysis or feeding into BI tools

---

# AWS Secrets Manager
## Secure credential storage and auto-rotation
- Use `RotationSchedule` CloudFormation resource to rotate RDS credentials on a schedule
- Lambda retrieves credentials at runtime — no hardcoded passwords in code
- SSM Parameter Store can store secrets but **cannot rotate them automatically**

---

# EC2 Auto Scaling — Scaling Strategies
## Know when to use each strategy
- **Scheduled scaling** = predictable daily or weekly patterns
- **Warm pool** = pre-initialized instances for apps with long startup times; instances drawn on scale-out
- **Target tracking on ALBRequestCountPerTarget** = scale based on per-instance ALB request load
- `SetInstanceProtection` API = prevents specific instances from being terminated during scale-in

---

# Amazon VPC — Route Table Issues
## Common routing problems
- Private subnet route table showing a **blackhole** = NAT instance was stopped or terminated; replace it
- Route `0.0.0.0/0 → IGW` must be in the route table for public subnet internet access
- For S3 access from private subnet: add an **S3 VPC gateway endpoint** route in addition to the NAT gateway route

---

# AWS Compute Optimizer
## Right-sizing recommendations
- Analyzes EC2 instance types, EBS volume IOPS/throughput, and Lambda memory settings
- Provides recommendations — it does NOT automatically change your instances

---

