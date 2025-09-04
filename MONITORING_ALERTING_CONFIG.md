# Nigerian Multi-Tenant Money Transfer System - Monitoring and Alerting Configuration

## Overview

This document provides comprehensive monitoring and alerting configuration for the AI-enhanced multi-tenant Nigerian Money Transfer system. It covers infrastructure monitoring, application performance monitoring, AI model monitoring, business metrics tracking, and compliance monitoring.

## 🏗️ Monitoring Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Applications   │    │  Infrastructure │    │   AI Services   │
│                 │    │                 │    │                 │
│ • API Gateway   │    │ • Kubernetes    │    │ • TensorFlow    │
│ • Microservices │    │ • Databases     │    │ • Vector DB     │
│ • Frontend Apps │    │ • Redis/Cache   │    │ • ML Models     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────┬───────────┴─────────┬────────────┘
                     │                     │
          ┌─────────────────────────────────────────┐
          │           Prometheus                    │
          │         (Metrics Collection)            │
          └─────────────────┬───────────────────────┘
                           │
          ┌─────────────────┴───────────────────────┐
          │              Grafana                    │
          │          (Visualization)                │
          └─────────────────┬───────────────────────┘
                           │
          ┌─────────────────┴───────────────────────┐
          │           AlertManager                  │
          │      (Alert Routing & Delivery)         │
          └─────────────────────────────────────────┘
                           │
          ┌─────────────────┴───────────────────────┐
          │        Notification Channels            │
          │  • Slack    • Email    • PagerDuty     │
          │  • SMS      • WhatsApp • Teams         │
          └─────────────────────────────────────────┘
```

## 📊 Prometheus Configuration

### Core Prometheus Configuration

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'orokii-production'
    environment: 'production'

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Kubernetes cluster monitoring
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
      - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https

  # Node monitoring
  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)

  # Pod monitoring
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)

  # API Gateway monitoring
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:8080']
    metrics_path: '/metrics'
    scrape_interval: 5s

  # AI Intelligence Service
  - job_name: 'ai-intelligence-service'
    static_configs:
      - targets: ['ai-intelligence-service:3010']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # Fraud Detection Service
  - job_name: 'fraud-service'
    static_configs:
      - targets: ['fraud-service:3011']
    metrics_path: '/metrics'
    scrape_interval: 5s

  # Transaction Service
  - job_name: 'transaction-service'
    static_configs:
      - targets: ['transaction-service:3001']
    metrics_path: '/metrics'
    scrape_interval: 5s

  # Auth Service
  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3002']
    metrics_path: '/metrics'

  # Tenant Service
  - job_name: 'tenant-service'
    static_configs:
      - targets: ['tenant-service:3003']
    metrics_path: '/metrics'

  # Database monitoring
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis monitoring
  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']

  # TensorFlow Serving monitoring
  - job_name: 'tensorflow-serving'
    static_configs:
      - targets: ['tf-serving:8501']
    metrics_path: '/monitoring/prometheus/metrics'

  # Weaviate Vector DB monitoring
  - job_name: 'weaviate'
    static_configs:
      - targets: ['weaviate:8080']
    metrics_path: '/v1/metrics'

  # NGINX Ingress monitoring
  - job_name: 'nginx-ingress'
    static_configs:
      - targets: ['nginx-ingress-controller:10254']
    metrics_path: '/metrics'

  # Blackbox monitoring for external endpoints
  - job_name: 'blackbox-external'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - https://api.nibss-plc.com.ng/health
        - https://sandbox.interswitchng.com/health
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

### Custom Application Metrics

```typescript
// monitoring/metrics.ts - Application metrics collection
import prometheus from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a Registry
const register = new prometheus.register();

// Default system metrics
prometheus.collectDefaultMetrics({ register });

// Custom business metrics
export const transactionCounter = new prometheus.Counter({
  name: 'transactions_total',
  help: 'Total number of transactions processed',
  labelNames: ['tenant_id', 'transaction_type', 'status', 'payment_method'],
  registers: [register]
});

export const transactionDuration = new prometheus.Histogram({
  name: 'transaction_processing_duration_seconds',
  help: 'Time spent processing transactions',
  labelNames: ['tenant_id', 'transaction_type'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

export const fraudDetectionDuration = new prometheus.Histogram({
  name: 'fraud_detection_duration_seconds',
  help: 'Time spent on fraud detection analysis',
  labelNames: ['tenant_id', 'model_version'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register]
});

export const fraudDetectionAccuracy = new prometheus.Gauge({
  name: 'fraud_detection_accuracy',
  help: 'Current accuracy of fraud detection model',
  labelNames: ['tenant_id', 'model_version'],
  registers: [register]
});

export const aiConversationCounter = new prometheus.Counter({
  name: 'ai_conversations_total',
  help: 'Total number of AI conversations',
  labelNames: ['tenant_id', 'language', 'intent', 'confidence_level'],
  registers: [register]
});

export const aiResponseTime = new prometheus.Histogram({
  name: 'ai_response_time_seconds',
  help: 'Time taken for AI to generate responses',
  labelNames: ['tenant_id', 'service_type', 'language'],
  buckets: [0.1, 0.2, 0.5, 1, 2, 3, 5, 10],
  registers: [register]
});

export const tenantActiveUsers = new prometheus.Gauge({
  name: 'tenant_active_users',
  help: 'Number of active users per tenant',
  labelNames: ['tenant_id'],
  registers: [register]
});

export const databaseConnections = new prometheus.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  labelNames: ['tenant_id', 'database_name'],
  registers: [register]
});

export const paymentGatewayLatency = new prometheus.Histogram({
  name: 'payment_gateway_latency_seconds',
  help: 'Latency for payment gateway requests',
  labelNames: ['gateway', 'operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
});

export const complianceViolations = new prometheus.Counter({
  name: 'compliance_violations_total',
  help: 'Total number of compliance violations detected',
  labelNames: ['tenant_id', 'violation_type', 'severity'],
  registers: [register]
});

// Middleware to track HTTP requests
export const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['tenant_id', 'method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

export const httpRequestCounter = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['tenant_id', 'method', 'route', 'status_code'],
  registers: [register]
});

// Metrics middleware
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const tenantId = req.headers['x-tenant-id'] as string || 'unknown';
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(tenantId, req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestCounter
      .labels(tenantId, req.method, route, res.statusCode.toString())
      .inc();
  });
  
  next();
};

// Metrics endpoint
export const metricsEndpoint = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

export { register };
```

### Nigerian Banking-Specific Metrics

```typescript
// monitoring/banking-metrics.ts
import prometheus from 'prom-client';

// CBN compliance metrics
export const cbnTransactionLimits = new prometheus.Counter({
  name: 'cbn_transaction_limit_violations_total',
  help: 'Violations of CBN transaction limits',
  labelNames: ['tenant_id', 'user_tier', 'limit_type'],
});

export const bvnVerificationDuration = new prometheus.Histogram({
  name: 'bvn_verification_duration_seconds',
  help: 'Time taken for BVN verification',
  buckets: [1, 2, 5, 10, 15, 30, 60],
});

export const nipTransactions = new prometheus.Counter({
  name: 'nip_transactions_total',
  help: 'Total NIP transactions processed',
  labelNames: ['tenant_id', 'status', 'bank_code'],
});

export const posTransactionValue = new prometheus.Histogram({
  name: 'pos_transaction_value_naira',
  help: 'Value of POS transactions in Naira',
  labelNames: ['tenant_id', 'merchant_category'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
});

// Multi-tenant resource usage
export const tenantApiCalls = new prometheus.Counter({
  name: 'tenant_api_calls_total',
  help: 'API calls per tenant',
  labelNames: ['tenant_id', 'endpoint', 'tier'],
});

export const tenantResourceUsage = new prometheus.Gauge({
  name: 'tenant_resource_usage',
  help: 'Resource usage per tenant',
  labelNames: ['tenant_id', 'resource_type'], // cpu, memory, storage, api_calls
});

// Nigerian language AI metrics
export const languageProcessingAccuracy = new prometheus.Gauge({
  name: 'language_processing_accuracy',
  help: 'Accuracy of Nigerian language processing',
  labelNames: ['language', 'dialect', 'service_type'],
});

export const voiceRecognitionAccuracy = new prometheus.Gauge({
  name: 'voice_recognition_accuracy',
  help: 'Voice recognition accuracy for Nigerian accents',
  labelNames: ['language', 'accent_type', 'gender', 'age_group'],
});
```

## 📈 Grafana Dashboard Configurations

### Infrastructure Dashboard

```json
{
  "dashboard": {
    "id": null,
    "title": "OrokiiPay Money Transfer - Infrastructure Overview",
    "tags": ["infrastructure", "kubernetes", "nibss"],
    "timezone": "Africa/Lagos",
    "panels": [
      {
        "title": "Cluster CPU Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 70},
                {"color": "red", "value": 85}
              ]
            }
          }
        }
      },
      {
        "title": "Memory Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "Memory Usage %"
          }
        ]
      },
      {
        "title": "Pod Status Overview",
        "type": "piechart",
        "targets": [
          {
            "expr": "count by (phase) (kube_pod_status_phase{namespace=\"orokii-moneytransfer\"})",
            "legendFormat": "{{phase}}"
          }
        ]
      },
      {
        "title": "Network I/O",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(node_network_receive_bytes_total[5m])",
            "legendFormat": "Receive {{device}}"
          },
          {
            "expr": "rate(node_network_transmit_bytes_total[5m])",
            "legendFormat": "Transmit {{device}}"
          }
        ]
      },
      {
        "title": "Disk Usage by Mount Point",
        "type": "bargauge",
        "targets": [
          {
            "expr": "100 - ((node_filesystem_avail_bytes{mountpoint!~\".*tmp.*\"} * 100) / node_filesystem_size_bytes{mountpoint!~\".*tmp.*\"})",
            "legendFormat": "{{mountpoint}}"
          }
        ]
      }
    ]
  }
}
```

### Application Performance Dashboard

```json
{
  "dashboard": {
    "title": "OrokiiPay Money Transfer - Application Performance",
    "panels": [
      {
        "title": "Transaction Processing Rate",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(transactions_total[5m])",
            "legendFormat": "{{tenant_id}} - {{transaction_type}}"
          }
        ]
      },
      {
        "title": "API Response Times (95th Percentile)",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{tenant_id}} - {{route}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 0.5},
                {"color": "red", "value": 1.0}
              ]
            }
          }
        }
      },
      {
        "title": "Error Rate by Service",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "{{job}} Error Rate"
          }
        ]
      },
      {
        "title": "Active Database Connections",
        "type": "timeseries",
        "targets": [
          {
            "expr": "database_connections_active",
            "legendFormat": "{{tenant_id}} - {{database_name}}"
          }
        ]
      },
      {
        "title": "Payment Gateway Performance",
        "type": "heatmap",
        "targets": [
          {
            "expr": "rate(payment_gateway_latency_seconds_bucket[5m])",
            "legendFormat": "{{gateway}}"
          }
        ]
      }
    ]
  }
}
```

### AI & ML Dashboard

```json
{
  "dashboard": {
    "title": "OrokiiPay Money Transfer - AI & Machine Learning",
    "panels": [
      {
        "title": "Fraud Detection Accuracy",
        "type": "gauge",
        "targets": [
          {
            "expr": "fraud_detection_accuracy",
            "legendFormat": "{{tenant_id}} - {{model_version}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "min": 0.8,
            "max": 1.0,
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0.8},
                {"color": "yellow", "value": 0.9},
                {"color": "green", "value": 0.95}
              ]
            }
          }
        }
      },
      {
        "title": "AI Response Times",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(ai_response_time_seconds_bucket[5m]))",
            "legendFormat": "{{tenant_id}} - {{service_type}}"
          }
        ]
      },
      {
        "title": "Conversational AI by Language",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum by (language) (rate(ai_conversations_total[1h]))",
            "legendFormat": "{{language}}"
          }
        ]
      },
      {
        "title": "Voice Recognition Accuracy",
        "type": "timeseries",
        "targets": [
          {
            "expr": "voice_recognition_accuracy",
            "legendFormat": "{{language}} - {{accent_type}}"
          }
        ]
      },
      {
        "title": "TensorFlow Serving Model Requests",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(tensorflow_serving_requests_total[5m])",
            "legendFormat": "{{model_name}} - {{version}}"
          }
        ]
      },
      {
        "title": "Vector Database Operations",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(weaviate_operations_total[5m])",
            "legendFormat": "{{operation_type}}"
          }
        ]
      }
    ]
  }
}
```

### Business Metrics Dashboard

```json
{
  "dashboard": {
    "title": "OrokiiPay Money Transfer - Business Metrics",
    "panels": [
      {
        "title": "Transaction Volume by Tenant",
        "type": "timeseries",
        "targets": [
          {
            "expr": "sum by (tenant_id) (rate(transactions_total{status=\"completed\"}[1h]))",
            "legendFormat": "{{tenant_id}}"
          }
        ]
      },
      {
        "title": "Transaction Value (NGN)",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(pos_transaction_value_naira_sum[1h])) * 3600",
            "legendFormat": "Hourly Volume (₦)"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "currencyNGN"
          }
        }
      },
      {
        "title": "Active Users by Tenant",
        "type": "bargauge",
        "targets": [
          {
            "expr": "tenant_active_users",
            "legendFormat": "{{tenant_id}}"
          }
        ]
      },
      {
        "title": "Payment Method Distribution",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum by (payment_method) (rate(transactions_total[1h]))",
            "legendFormat": "{{payment_method}}"
          }
        ]
      },
      {
        "title": "Compliance Violations",
        "type": "table",
        "targets": [
          {
            "expr": "increase(compliance_violations_total[24h])",
            "legendFormat": "{{tenant_id}} - {{violation_type}} - {{severity}}"
          }
        ]
      }
    ]
  }
}
```

## 🚨 AlertManager Configuration

### Alert Rules

```yaml
# prometheus/rules/application-alerts.yml
groups:
  - name: application.rules
    rules:
      # High error rate alert
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High error rate detected for {{ $labels.job }}"
          description: "Error rate is {{ $value | humanizePercentage }} for service {{ $labels.job }} in tenant {{ $labels.tenant_id }}"
          runbook_url: "https://wiki.orokii.com/runbooks/high-error-rate"

      # High response time alert
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High response time for {{ $labels.job }}"
          description: "95th percentile response time is {{ $value }}s for {{ $labels.job }}"

      # Database connection exhaustion
      - alert: DatabaseConnectionsHigh
        expr: database_connections_active / database_connections_max > 0.8
        for: 5m
        labels:
          severity: warning
          team: database
        annotations:
          summary: "High database connection usage"
          description: "Database connections at {{ $value | humanizePercentage }} capacity for tenant {{ $labels.tenant_id }}"

      # Transaction processing failure
      - alert: TransactionProcessingFailure
        expr: rate(transactions_total{status="failed"}[5m]) / rate(transactions_total[5m]) > 0.02
        for: 3m
        labels:
          severity: critical
          team: payments
        annotations:
          summary: "High transaction failure rate"
          description: "Transaction failure rate is {{ $value | humanizePercentage }} for tenant {{ $labels.tenant_id }}"

      # Fraud detection model accuracy drop
      - alert: FraudDetectionAccuracyDrop
        expr: fraud_detection_accuracy < 0.9
        for: 15m
        labels:
          severity: critical
          team: ai-ml
        annotations:
          summary: "Fraud detection accuracy dropped below threshold"
          description: "Fraud detection accuracy is {{ $value | humanizePercentage }} for tenant {{ $labels.tenant_id }}"

      # AI service unavailable
      - alert: AIServiceUnavailable
        expr: up{job=~".*ai.*|.*fraud.*"} == 0
        for: 2m
        labels:
          severity: critical
          team: ai-ml
        annotations:
          summary: "AI service {{ $labels.job }} is down"
          description: "AI service {{ $labels.job }} has been unavailable for more than 2 minutes"

      # Payment gateway latency
      - alert: PaymentGatewayHighLatency
        expr: histogram_quantile(0.95, rate(payment_gateway_latency_seconds_bucket[5m])) > 5
        for: 10m
        labels:
          severity: warning
          team: integrations
        annotations:
          summary: "High payment gateway latency"
          description: "Payment gateway {{ $labels.gateway }} latency is {{ $value }}s"

  - name: infrastructure.rules
    rules:
      # High CPU usage
      - alert: HighCPUUsage
        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
        for: 15m
        labels:
          severity: warning
          team: infrastructure
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}% on node {{ $labels.instance }}"

      # High memory usage
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90
        for: 10m
        labels:
          severity: critical
          team: infrastructure
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value }}% on node {{ $labels.instance }}"

      # Disk space low
      - alert: DiskSpaceLow
        expr: 100 - ((node_filesystem_avail_bytes{mountpoint="/"} * 100) / node_filesystem_size_bytes{mountpoint="/"}) > 85
        for: 5m
        labels:
          severity: warning
          team: infrastructure
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
          description: "Disk usage is {{ $value }}% on {{ $labels.instance }}"

      # Pod crash looping
      - alert: PodCrashLooping
        expr: increase(kube_pod_container_status_restarts_total[15m]) > 0
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Pod {{ $labels.pod }} is crash looping"
          description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} has restarted {{ $value }} times"

  - name: business.rules
    rules:
      # Low transaction volume (potential outage indicator)
      - alert: LowTransactionVolume
        expr: rate(transactions_total[10m]) < 0.1
        for: 10m
        labels:
          severity: warning
          team: business
        annotations:
          summary: "Unusually low transaction volume"
          description: "Transaction rate is {{ $value }} TPS, which is below normal levels"

      # Compliance violations
      - alert: ComplianceViolationSpike
        expr: increase(compliance_violations_total{severity="high"}[1h]) > 10
        for: 0m
        labels:
          severity: critical
          team: compliance
        annotations:
          summary: "High number of compliance violations detected"
          description: "{{ $value }} high-severity compliance violations in the last hour for tenant {{ $labels.tenant_id }}"

      # CBN transaction limit violations
      - alert: CBNLimitViolations
        expr: increase(cbn_transaction_limit_violations_total[1h]) > 5
        for: 0m
        labels:
          severity: critical
          team: compliance
        annotations:
          summary: "CBN transaction limit violations detected"
          description: "{{ $value }} CBN limit violations for {{ $labels.limit_type }} in tenant {{ $labels.tenant_id }}"

  - name: security.rules
    rules:
      # Too many failed authentication attempts
      - alert: HighFailedAuthRate
        expr: rate(http_requests_total{route="/api/v2/auth/login",status_code="401"}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
          team: security
        annotations:
          summary: "High rate of failed authentication attempts"
          description: "{{ $value }} failed login attempts per second for tenant {{ $labels.tenant_id }}"

      # Suspicious transaction patterns (potential fraud)
      - alert: SuspiciousTransactionPattern
        expr: rate(transactions_total{status="blocked"}[10m]) > 0.05
        for: 5m
        labels:
          severity: warning
          team: fraud
        annotations:
          summary: "High rate of blocked transactions"
          description: "{{ $value }} transactions per second are being blocked by fraud detection"
```

### AlertManager Configuration

```yaml
# alertmanager/alertmanager.yml
global:
  smtp_smarthost: 'smtp.sendgrid.net:587'
  smtp_from: 'alerts@orokii.com'
  smtp_auth_username: 'apikey'
  smtp_auth_password: '${SENDGRID_API_KEY}'
  
  # Nigerian timezone
  time_zone: 'Africa/Lagos'

# Template files
templates:
  - '/etc/alertmanager/templates/*.tmpl'

# Route tree for alerts
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 24h
  receiver: 'default-receiver'
  
  routes:
    # Critical alerts - immediate notification
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 10s
      group_interval: 2m
      repeat_interval: 1h
      
    # Payment and transaction alerts
    - match:
        team: payments
      receiver: 'payments-team'
      
    # AI/ML alerts
    - match:
        team: ai-ml
      receiver: 'ai-team'
      
    # Infrastructure alerts
    - match:
        team: infrastructure
      receiver: 'infrastructure-team'
      
    # Compliance alerts
    - match:
        team: compliance
      receiver: 'compliance-team'
      
    # Security alerts  
    - match:
        team: security
      receiver: 'security-team'

# Alert receivers/notification channels
receivers:
  # Default receiver
  - name: 'default-receiver'
    email_configs:
      - to: 'devops@orokii.com'
        subject: '[NIBSS Money Transfer] {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Severity: {{ .Labels.severity }}
          Time: {{ .StartsAt.Format "2006-01-02 15:04:05" }} WAT
          {{ end }}

  # Critical alerts - multiple channels
  - name: 'critical-alerts'
    email_configs:
      - to: 'critical-alerts@orokii.com'
        subject: '🚨 CRITICAL ALERT: {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        html: |
          <h2 style="color: red;">CRITICAL ALERT</h2>
          {{ range .Alerts }}
          <h3>{{ .Annotations.summary }}</h3>
          <p><strong>Description:</strong> {{ .Annotations.description }}</p>
          <p><strong>Tenant:</strong> {{ .Labels.tenant_id }}</p>
          <p><strong>Service:</strong> {{ .Labels.job }}</p>
          <p><strong>Time:</strong> {{ .StartsAt.Format "2006-01-02 15:04:05" }} WAT</p>
          <p><strong>Runbook:</strong> <a href="{{ .Annotations.runbook_url }}">{{ .Annotations.runbook_url }}</a></p>
          {{ end }}
    
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#orokii-alerts'
        title: '🚨 CRITICAL ALERT'
        text: |
          {{ range .Alerts }}
          *{{ .Annotations.summary }}*
          {{ .Annotations.description }}
          *Tenant:* {{ .Labels.tenant_id }}
          *Severity:* {{ .Labels.severity }}
          {{ end }}
        color: 'danger'
    
    pagerduty_configs:
      - routing_key: '${PAGERDUTY_ROUTING_KEY}'
        description: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  # Payments team
  - name: 'payments-team'
    email_configs:
      - to: 'payments@orokii.com'
        subject: '[Payments] {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#payments-team'
        title: '💳 Payment Alert'

  # AI/ML team
  - name: 'ai-team'
    email_configs:
      - to: 'ai-team@orokii.com'
        subject: '[AI/ML] {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#ai-ml-team'
        title: '🤖 AI/ML Alert'

  # Infrastructure team
  - name: 'infrastructure-team'
    email_configs:
      - to: 'infrastructure@orokii.com'
        subject: '[Infrastructure] {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#infrastructure'
        title: '🏗️ Infrastructure Alert'

  # Compliance team  
  - name: 'compliance-team'
    email_configs:
      - to: 'compliance@orokii.com'
        subject: '[COMPLIANCE] {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#compliance'
        title: '⚖️ Compliance Alert'
        color: 'warning'

  # Security team
  - name: 'security-team'
    email_configs:
      - to: 'security@orokii.com'
        subject: '[SECURITY] {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#security'
        title: '🔒 Security Alert'
        color: 'danger'
    
    # Also send SMS for high-severity security alerts
    webhook_configs:
      - url: 'https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json'
        http_config:
          basic_auth:
            username: '${TWILIO_ACCOUNT_SID}'
            password: '${TWILIO_AUTH_TOKEN}'
        send_resolved: false

# Inhibition rules - prevent alert spam
inhibit_rules:
  # If service is down, don't alert on high response times
  - source_match:
      alertname: 'ServiceDown'
    target_match:
      alertname: 'HighResponseTime'
    equal: ['job', 'tenant_id']
  
  # If database is down, don't alert on connection issues
  - source_match:
      alertname: 'DatabaseDown'
    target_match:
      alertname: 'DatabaseConnectionsHigh'
    equal: ['tenant_id']
```

## 📊 Logging Configuration (ELK Stack)

### Elasticsearch Configuration

```yaml
# elasticsearch/elasticsearch.yml
cluster.name: orokii-moneytransfer-logs
node.name: ${HOSTNAME}
network.host: 0.0.0.0
discovery.type: single-node

# Memory settings
-Xms2g
-Xmx2g

# Index lifecycle management
xpack.ilm.enabled: true
xpack.monitoring.enabled: true

# Security
xpack.security.enabled: true
xpack.security.authc:
  anonymous:
    username: anonymous_user
    roles: kibana_user
    authz_exception: true
```

### Logstash Configuration

```ruby
# logstash/pipeline/orokii-moneytransfer.conf
input {
  beats {
    port => 5044
  }
  
  # Syslog input for infrastructure logs
  syslog {
    port => 5514
    type => "syslog"
  }
  
  # HTTP input for application logs
  http {
    port => 8080
    codec => "json"
    type => "application"
  }
}

filter {
  # Parse application logs
  if [type] == "application" {
    json {
      source => "message"
    }
    
    # Add tenant information
    if [tenant_id] {
      mutate {
        add_field => { "[@metadata][index_suffix]" => "%{tenant_id}" }
      }
    }
    
    # Parse timestamp
    date {
      match => [ "timestamp", "ISO8601" ]
      target => "@timestamp"
    }
    
    # Classify log levels
    if [level] == "ERROR" or [level] == "FATAL" {
      mutate {
        add_tag => [ "error" ]
      }
    }
    
    # Identify sensitive data and mask it
    mutate {
      gsub => [
        "message", "password[\"']?\s*[:=]\s*[\"']?[^\"'\s,}]+", "password: [REDACTED]",
        "message", "pin[\"']?\s*[:=]\s*[\"']?\d+", "pin: [REDACTED]",
        "message", "\d{10,11}", "[MASKED_ACCOUNT]",
        "message", "\d{4}\s?\d{4}\s?\d{4}\s?\d{4}", "[MASKED_CARD]"
      ]
    }
    
    # Extract AI metrics
    if [service] == "ai-intelligence" {
      if [ai_metrics] {
        mutate {
          add_field => {
            "ai_response_time" => "%{[ai_metrics][response_time]}"
            "ai_confidence" => "%{[ai_metrics][confidence]}"
            "ai_model_version" => "%{[ai_metrics][model_version]}"
          }
        }
      }
    }
    
    # Extract fraud detection metrics
    if [service] == "fraud-detection" {
      if [fraud_analysis] {
        mutate {
          add_field => {
            "fraud_score" => "%{[fraud_analysis][risk_score]}"
            "fraud_factors" => "%{[fraud_analysis][risk_factors]}"
          }
        }
      }
    }
    
    # Geolocate IP addresses
    geoip {
      source => "client_ip"
      target => "geoip"
      database => "/usr/share/logstash/vendor/geoip/GeoLite2-City.mmdb"
    }
  }
  
  # Parse Kubernetes logs
  if [kubernetes] {
    mutate {
      add_field => {
        "k8s_namespace" => "%{[kubernetes][namespace]}"
        "k8s_pod" => "%{[kubernetes][pod][name]}"
        "k8s_container" => "%{[kubernetes][container][name]}"
      }
    }
  }
  
  # Enhanced error tracking
  if "error" in [tags] {
    mutate {
      add_field => { "alert_required" => "true" }
    }
    
    # Send to dead letter queue for failed processing
    if [parse_failure] {
      mutate {
        add_tag => [ "parse_failure" ]
      }
    }
  }
}

output {
  # Main application logs
  if [type] == "application" {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "orokii-moneytransfer-app-%{+YYYY.MM.dd}"
      template_name => "orokii-moneytransfer-app"
      template_pattern => "orokii-moneytransfer-app-*"
      template => "/etc/logstash/templates/app-template.json"
    }
  }
  
  # Infrastructure logs
  if [type] == "syslog" {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "orokii-moneytransfer-infra-%{+YYYY.MM.dd}"
    }
  }
  
  # Error logs to separate index for alerting
  if "error" in [tags] {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "orokii-moneytransfer-errors-%{+YYYY.MM.dd}"
    }
  }
  
  # Send critical errors to external alerting
  if [level] == "FATAL" or ([level] == "ERROR" and [service] in ["transaction-service", "fraud-service", "auth-service"]) {
    http {
      url => "http://alertmanager:9093/api/v1/alerts"
      http_method => "post"
      content_type => "application/json"
      format => "json"
      mapping => {
        "alerts" => [
          {
            "labels" => {
              "alertname" => "ApplicationError"
              "severity" => "critical"
              "service" => "%{service}"
              "tenant_id" => "%{tenant_id}"
            }
            "annotations" => {
              "summary" => "Application error in %{service}"
              "description" => "%{message}"
            }
          }
        ]
      }
    }
  }
  
  # Debug output
  stdout { codec => rubydebug }
}
```

### Kibana Configuration

```yaml
# kibana/kibana.yml
server.host: "0.0.0.0"
server.name: "orokii-moneytransfer-kibana"
elasticsearch.hosts: ["http://elasticsearch:9200"]

# Nigerian timezone
i18n.locale: "en"
timezone: "Africa/Lagos"

# Security
xpack.security.enabled: true
xpack.monitoring.enabled: true

# Custom branding
server.customResponseHeaders:
  "X-Frame-Options": "SAMEORIGIN"
  "X-Content-Type-Options": "nosniff"

# Index patterns
kibana.index: ".kibana"

# Telemetry
telemetry.enabled: false
```

## 📱 Nigerian-Specific Monitoring

### SMS Alerting Integration

```typescript
// monitoring/sms-alerts.ts
import axios from 'axios';

interface SMSAlert {
  to: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

class NigerianSMSAlerting {
  private readonly providers = {
    mtn: {
      url: 'https://api.mtnsms.ng/v1/send',
      apiKey: process.env.MTN_SMS_API_KEY
    },
    airtel: {
      url: 'https://api.airtel.ng/sms/send',
      apiKey: process.env.AIRTEL_SMS_API_KEY
    },
    glo: {
      url: 'https://api.globacom.ng/sms',
      apiKey: process.env.GLO_SMS_API_KEY
    }
  };

  async sendAlert(alert: SMSAlert): Promise<void> {
    const phoneNumber = this.formatNigerianNumber(alert.to);
    const network = this.detectNetwork(phoneNumber);
    
    const message = `[OrokiiPay Alert] ${alert.message}`;
    
    try {
      await this.sendViaBestProvider(network, phoneNumber, message);
    } catch (error) {
      console.error('Failed to send SMS alert:', error);
      // Fallback to email
      await this.sendEmailFallback(alert);
    }
  }

  private formatNigerianNumber(phone: string): string {
    // Convert to Nigerian format (+234...)
    if (phone.startsWith('0')) {
      return '+234' + phone.substring(1);
    }
    if (phone.startsWith('234')) {
      return '+' + phone;
    }
    return phone;
  }

  private detectNetwork(phone: string): 'mtn' | 'airtel' | 'glo' | 'unknown' {
    const number = phone.replace('+234', '');
    
    // MTN prefixes
    if (/^(703|706|803|806|810|813|814|816|903|906)/.test(number)) {
      return 'mtn';
    }
    
    // Airtel prefixes
    if (/^(701|708|802|808|812|901|902|904|907)/.test(number)) {
      return 'airtel';
    }
    
    // Glo prefixes
    if (/^(705|815|905)/.test(number)) {
      return 'glo';
    }
    
    return 'unknown';
  }

  private async sendViaBestProvider(network: string, phone: string, message: string): Promise<void> {
    if (network !== 'unknown' && this.providers[network]) {
      const provider = this.providers[network];
      
      await axios.post(provider.url, {
        to: phone,
        message: message,
        from: 'OrokiiPay'
      }, {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      // Use default provider (MTN)
      await this.sendViaBestProvider('mtn', phone, message);
    }
  }

  private async sendEmailFallback(alert: SMSAlert): Promise<void> {
    // Email fallback implementation
    console.log('Sending email fallback for SMS alert:', alert);
  }
}

export const smsAlerting = new NigerianSMSAlerting();
```

### WhatsApp Business API Integration

```typescript
// monitoring/whatsapp-alerts.ts
import axios from 'axios';

class WhatsAppAlerting {
  private readonly apiUrl = 'https://graph.facebook.com/v17.0';
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  async sendAlert(to: string, message: string, severity: string): Promise<void> {
    const formattedNumber = this.formatNigerianNumber(to);
    
    const payload = {
      messaging_product: 'whatsapp',
      to: formattedNumber,
      type: 'template',
      template: {
        name: 'alert_notification',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: severity.toUpperCase() },
              { type: 'text', text: message },
              { type: 'text', text: new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }) }
            ]
          }
        ]
      }
    };

    try {
      await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Failed to send WhatsApp alert:', error);
    }
  }

  private formatNigerianNumber(phone: string): string {
    if (phone.startsWith('0')) {
      return '234' + phone.substring(1);
    }
    if (phone.startsWith('+234')) {
      return phone.substring(1);
    }
    return phone;
  }
}

export const whatsappAlerting = new WhatsAppAlerting();
```

## 🎯 SLA Monitoring and Reporting

### SLA Configuration

```yaml
# prometheus/rules/sla-rules.yml
groups:
  - name: sla.rules
    interval: 30s
    rules:
      # Transaction processing SLA (99.9% availability, <500ms response time)
      - record: sla:transaction_availability
        expr: |
          (
            rate(http_requests_total{job="transaction-service",status_code!~"5.."}[5m]) /
            rate(http_requests_total{job="transaction-service"}[5m])
          ) * 100
      
      - record: sla:transaction_response_time_p95
        expr: |
          histogram_quantile(0.95, 
            rate(http_request_duration_seconds_bucket{job="transaction-service"}[5m])
          )
      
      # AI service SLA (99.5% availability, <1s response time)
      - record: sla:ai_service_availability
        expr: |
          (
            rate(http_requests_total{job=~".*ai.*",status_code!~"5.."}[5m]) /
            rate(http_requests_total{job=~".*ai.*"}[5m])
          ) * 100
      
      - record: sla:ai_response_time_p95
        expr: |
          histogram_quantile(0.95, 
            rate(ai_response_time_seconds_bucket[5m])
          )
      
      # Fraud detection SLA (99.9% availability, <200ms response time)
      - record: sla:fraud_detection_availability
        expr: |
          (
            rate(http_requests_total{job="fraud-service",status_code!~"5.."}[5m]) /
            rate(http_requests_total{job="fraud-service"}[5m])
          ) * 100
      
      - record: sla:fraud_detection_response_time_p95
        expr: |
          histogram_quantile(0.95, 
            rate(fraud_detection_duration_seconds_bucket[5m])
          )

      # Overall system SLA
      - record: sla:system_availability
        expr: |
          min(
            sla:transaction_availability,
            sla:ai_service_availability,
            sla:fraud_detection_availability
          )

  - name: sla-alerts.rules
    rules:
      # SLA violation alerts
      - alert: TransactionSLAViolation
        expr: sla:transaction_availability < 99.9 or sla:transaction_response_time_p95 > 0.5
        for: 5m
        labels:
          severity: critical
          sla: transaction
        annotations:
          summary: "Transaction SLA violation"
          description: "Availability: {{ .sla_transaction_availability }}%, Response time: {{ .sla_transaction_response_time_p95 }}s"

      - alert: AISLAViolation
        expr: sla:ai_service_availability < 99.5 or sla:ai_response_time_p95 > 1
        for: 10m
        labels:
          severity: warning
          sla: ai
        annotations:
          summary: "AI service SLA violation"
          description: "AI service not meeting SLA requirements"

      - alert: FraudDetectionSLAViolation
        expr: sla:fraud_detection_availability < 99.9 or sla:fraud_detection_response_time_p95 > 0.2
        for: 3m
        labels:
          severity: critical
          sla: fraud
        annotations:
          summary: "Fraud detection SLA violation"
          description: "Fraud detection service not meeting SLA requirements"
```

### SLA Reporting Dashboard

```json
{
  "dashboard": {
    "title": "OrokiiPay Money Transfer - SLA Report",
    "tags": ["sla", "business", "reporting"],
    "time": {
      "from": "now-30d",
      "to": "now"
    },
    "panels": [
      {
        "title": "Monthly SLA Summary",
        "type": "stat",
        "targets": [
          {
            "expr": "avg_over_time(sla:system_availability[30d])",
            "legendFormat": "System Availability"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 99},
                {"color": "green", "value": 99.9}
              ]
            }
          }
        }
      },
      {
        "title": "SLA Trends",
        "type": "timeseries",
        "targets": [
          {
            "expr": "sla:transaction_availability",
            "legendFormat": "Transaction Service"
          },
          {
            "expr": "sla:ai_service_availability", 
            "legendFormat": "AI Services"
          },
          {
            "expr": "sla:fraud_detection_availability",
            "legendFormat": "Fraud Detection"
          }
        ]
      },
      {
        "title": "Response Time SLA Compliance",
        "type": "timeseries",
        "targets": [
          {
            "expr": "sla:transaction_response_time_p95",
            "legendFormat": "Transaction Service (Target: 500ms)"
          },
          {
            "expr": "sla:ai_response_time_p95",
            "legendFormat": "AI Services (Target: 1s)"
          }
        ]
      }
    ]
  }
}
```

## 📋 Deployment and Maintenance

### Kubernetes Monitoring Stack Deployment

```bash
#!/bin/bash
# deploy-monitoring.sh

echo "Deploying OrokiiPay Money Transfer Monitoring Stack..."

# Create monitoring namespace
kubectl create namespace orokii-moneytransfer-monitoring

# Deploy Prometheus
kubectl apply -f monitoring/prometheus/

# Deploy Grafana
kubectl apply -f monitoring/grafana/

# Deploy AlertManager  
kubectl apply -f monitoring/alertmanager/

# Deploy ELK Stack
kubectl apply -f monitoring/elasticsearch/
kubectl apply -f monitoring/logstash/
kubectl apply -f monitoring/kibana/

# Deploy exporters
kubectl apply -f monitoring/exporters/

# Configure ingresses
kubectl apply -f monitoring/ingresses/

# Wait for deployments
kubectl wait --for=condition=available deployment --all -n orokii-moneytransfer-monitoring --timeout=600s

echo "Monitoring stack deployed successfully!"
echo "Access points:"
echo "- Grafana: https://monitoring.orokii.com"
echo "- Prometheus: https://prometheus.orokii.com"  
echo "- AlertManager: https://alerts.orokii.com"
echo "- Kibana: https://logs.orokii.com"
```

### Maintenance Scripts

```bash
#!/bin/bash
# maintenance/cleanup-monitoring.sh

# Clean up old logs (retain 30 days)
curl -X DELETE "elasticsearch:9200/orokii-moneytransfer-*-$(date -d '30 days ago' +%Y.%m.%d)"

# Clean up old metrics (retain 90 days) 
curl -X POST prometheus:9090/api/v1/admin/tsdb/delete_series \
  -d 'match[]={__name__=~".*"}' \
  -d 'start=$(date -d "90 days ago" +%s)'

# Restart services if memory usage is high
MEMORY_USAGE=$(free | grep '^Mem' | awk '{print ($3/$2) * 100}')
if (( $(echo "$MEMORY_USAGE > 85" | bc -l) )); then
    echo "High memory usage detected, restarting monitoring services..."
    kubectl rollout restart deployment/prometheus -n orokii-moneytransfer-monitoring
    kubectl rollout restart deployment/grafana -n orokii-moneytransfer-monitoring
fi

# Generate monitoring health report
./generate-monitoring-report.sh > /tmp/monitoring-health-$(date +%Y%m%d).txt
```

This comprehensive monitoring and alerting configuration ensures robust observability for the Nigerian Multi-Tenant Money Transfer system, covering all critical aspects from infrastructure to business metrics, with particular attention to AI components, multi-tenant isolation, Nigerian compliance requirements, and local communication channels.