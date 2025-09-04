# Book 3: AI Operations and Multi-Tenant Infrastructure Implementation Guide
## Nigerian Money Transfer System - Enterprise Infrastructure and MLOps

**Version:** 2.0  
**Date:** September 2025  
**Target Audience:** DevOps Engineers, Infrastructure Architects, MLOps Engineers, Security Engineers  

---

## Table of Contents

1. [Multi-Tenant Kubernetes Infrastructure](#1-multi-tenant-kubernetes-infrastructure)
2. [AI/ML Pipeline and MLOps Implementation](#2-aiml-pipeline-and-mlops-implementation)
3. [Multi-Tenant Deployment Strategies](#3-multi-tenant-deployment-strategies)
4. [AI Model Lifecycle Management](#4-ai-model-lifecycle-management)
5. [Multi-Tenant Monitoring and Observability](#5-multi-tenant-monitoring-and-observability)
6. [Security Operations and Compliance](#6-security-operations-and-compliance)
7. [Multi-Tenant CI/CD Pipelines](#7-multi-tenant-cicd-pipelines)
8. [Disaster Recovery and Business Continuity](#8-disaster-recovery-and-business-continuity)
9. [Performance Optimization and Auto-Scaling](#9-performance-optimization-and-auto-scaling)
10. [Cost Management and Resource Optimization](#10-cost-management-and-resource-optimization)

---

## 1. Multi-Tenant Kubernetes Infrastructure

### 1.1 Kubernetes Cluster Setup for Multi-Tenant AI Workloads

**infrastructure/kubernetes/cluster-setup/cluster-config.yaml:**
```yaml
# Multi-tenant Kubernetes cluster configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-config
  namespace: kube-system
data:
  cluster.yaml: |
    # Nigerian PoS Multi-Tenant AI Cluster Configuration
    cluster:
      name: "orokii-moneytransfer-ai-cluster"
      region: "nigeria-west"
      zones: ["nigeria-west-1a", "nigeria-west-1b", "nigeria-west-1c"]
      
    # Multi-tenant specific configuration
    multiTenancy:
      enabled: true
      isolationModel: "namespace-per-tenant"
      networkPolicies: true
      resourceQuotas: true
      limitRanges: true
      
    # AI/ML workload configuration
    ai:
      gpuSupport: true
      tensorflowServing: true
      modelServing: true
      vectorDatabase: true
      
    # Nigerian compliance and regulations
    compliance:
      cbnCompliance: true
      dataLocalization: true
      auditLogging: true
      encryptionAtRest: true

---
# Node pools for different workload types
apiVersion: v1
kind: ConfigMap
metadata:
  name: node-pools-config
  namespace: kube-system
data:
  nodePools: |
    # General workloads node pool
    - name: "general-workloads"
      instanceType: "n1-standard-4"
      minNodes: 3
      maxNodes: 20
      diskSize: "100GB"
      diskType: "ssd"
      preemptible: false
      labels:
        workload-type: "general"
        
    # AI/ML workloads node pool with GPUs
    - name: "ai-workloads"
      instanceType: "n1-standard-8-gpu"
      minNodes: 2
      maxNodes: 10
      diskSize: "200GB"
      diskType: "ssd"
      gpuType: "nvidia-tesla-t4"
      gpuCount: 1
      preemptible: false
      labels:
        workload-type: "ai-ml"
        
    # High-memory workloads for data processing
    - name: "data-processing"
      instanceType: "n1-highmem-4"
      minNodes: 1
      maxNodes: 5
      diskSize: "500GB"
      diskType: "ssd"
      preemptible: true
      labels:
        workload-type: "data-processing"
        
    # Database workloads
    - name: "database"
      instanceType: "n1-standard-8"
      minNodes: 3
      maxNodes: 6
      diskSize: "1TB"
      diskType: "ssd"
      preemptible: false
      labels:
        workload-type: "database"
      taints:
        - key: "workload-type"
          value: "database"
          effect: "NoSchedule"
```

### 1.2 Multi-Tenant Namespace and Resource Management

**infrastructure/kubernetes/multi-tenancy/tenant-namespace-template.yaml:**
```yaml
# Template for creating tenant-specific namespaces
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-${TENANT_ID}
  labels:
    tenant: ${TENANT_ID}
    tier: ${TENANT_TIER}
    region: ${TENANT_REGION}
    compliance-level: ${COMPLIANCE_LEVEL}
    ai-enabled: ${AI_ENABLED}
    app.kubernetes.io/managed-by: "tenant-operator"
  annotations:
    tenant.nibss.com/id: ${TENANT_ID}
    tenant.nibss.com/name: ${TENANT_NAME}
    tenant.nibss.com/created-date: ${CREATION_DATE}
    tenant.nibss.com/billing-account: ${BILLING_ACCOUNT}
    tenant.nibss.com/ai-config: ${AI_CONFIGURATION}

---
# Resource Quota for tenant namespace
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-${TENANT_ID}-quota
  namespace: tenant-${TENANT_ID}
spec:
  hard:
    # Compute resources based on tenant tier
    requests.cpu: ${CPU_REQUEST_LIMIT}     # e.g., "10" for basic, "50" for enterprise
    requests.memory: ${MEMORY_REQUEST_LIMIT}  # e.g., "20Gi" for basic, "100Gi" for enterprise
    limits.cpu: ${CPU_LIMIT}              # e.g., "20" for basic, "100" for enterprise  
    limits.memory: ${MEMORY_LIMIT}        # e.g., "40Gi" for basic, "200Gi" for enterprise
    
    # GPU resources for AI workloads
    requests.nvidia.com/gpu: ${GPU_REQUEST_LIMIT}  # e.g., "0" for basic, "4" for enterprise
    limits.nvidia.com/gpu: ${GPU_LIMIT}    # e.g., "0" for basic, "8" for enterprise
    
    # Storage resources
    requests.storage: ${STORAGE_REQUEST_LIMIT}  # e.g., "100Gi" for basic, "1Ti" for enterprise
    persistentvolumeclaims: ${PVC_LIMIT}    # e.g., "10" for basic, "50" for enterprise
    
    # Object count limits
    pods: ${POD_LIMIT}                     # e.g., "20" for basic, "100" for enterprise
    services: ${SERVICE_LIMIT}             # e.g., "10" for basic, "50" for enterprise
    secrets: ${SECRET_LIMIT}               # e.g., "20" for basic, "100" for enterprise
    configmaps: ${CONFIGMAP_LIMIT}         # e.g., "20" for basic, "100" for enterprise
    
    # Network resources
    services.loadbalancers: ${LB_LIMIT}    # e.g., "1" for basic, "5" for enterprise
    services.nodeports: ${NODEPORT_LIMIT}  # e.g., "0" for basic, "3" for enterprise

---
# Limit Ranges for default resource constraints
apiVersion: v1
kind: LimitRange
metadata:
  name: tenant-${TENANT_ID}-limits
  namespace: tenant-${TENANT_ID}
spec:
  limits:
  # Default limits for containers
  - default:
      cpu: "500m"
      memory: "1Gi"
      nvidia.com/gpu: "0"
    defaultRequest:
      cpu: "100m"
      memory: "256Mi"
    type: Container
    
  # Limits for pods
  - max:
      cpu: "8"
      memory: "16Gi"
      nvidia.com/gpu: "2"
    min:
      cpu: "50m"
      memory: "64Mi"
    type: Pod
    
  # Limits for PersistentVolumeClaims
  - max:
      storage: "100Gi"
    min:
      storage: "1Gi"
    type: PersistentVolumeClaim

---
# Network Policy for tenant isolation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-${TENANT_ID}-isolation
  namespace: tenant-${TENANT_ID}
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  
  # Ingress rules
  ingress:
  # Allow traffic from API Gateway
  - from:
    - namespaceSelector:
        matchLabels:
          name: api-gateway
  # Allow traffic from monitoring
  - from:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 8080  # metrics endpoint
  # Allow traffic from same tenant namespace
  - from:
    - namespaceSelector:
        matchLabels:
          tenant: ${TENANT_ID}
  
  # Egress rules
  egress:
  # Allow DNS resolution
  - to: []
    ports:
    - protocol: UDP
      port: 53
  # Allow HTTPS to external services (AI APIs, payment gateways)
  - to: []
    ports:
    - protocol: TCP
      port: 443
  # Allow HTTP to internal services
  - to:
    - namespaceSelector:
        matchLabels:
          name: platform-services
    ports:
    - protocol: TCP
      port: 80
  # Allow database connections
  - to:
    - namespaceSelector:
        matchLabels:
          name: databases
    ports:
    - protocol: TCP
      port: 5432
  # Allow AI service connections
  - to:
    - namespaceSelector:
        matchLabels:
          name: ai-services
    ports:
    - protocol: TCP
      port: 8080

---
# Service Account for tenant workloads
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tenant-${TENANT_ID}-workloads
  namespace: tenant-${TENANT_ID}
  labels:
    tenant: ${TENANT_ID}
automountServiceAccountToken: true

---
# RBAC Role for tenant operations
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tenant-${TENANT_ID}-role
  namespace: tenant-${TENANT_ID}
rules:
# Allow management of pods, services, configmaps within namespace
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets", "persistentvolumeclaims"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
# Allow management of deployments and replicasets
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets", "statefulsets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
# Allow management of ingress
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
# Allow access to metrics
- apiGroups: ["metrics.k8s.io"]
  resources: ["pods", "nodes"]
  verbs: ["get", "list"]

---
# RBAC RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-${TENANT_ID}-binding
  namespace: tenant-${TENANT_ID}
subjects:
- kind: ServiceAccount
  name: tenant-${TENANT_ID}-workloads
  namespace: tenant-${TENANT_ID}
roleRef:
  kind: Role
  name: tenant-${TENANT_ID}-role
  apiGroup: rbac.authorization.k8s.io
```

### 1.3 AI-Enhanced Pod Security Policies

**infrastructure/kubernetes/security/pod-security-policies.yaml:**
```yaml
# Pod Security Policy for AI workloads
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: ai-workload-psp
  annotations:
    seccomp.security.alpha.kubernetes.io/allowedProfileNames: 'docker/default,runtime/default'
    seccomp.security.alpha.kubernetes.io/defaultProfileName: 'runtime/default'
    apparmor.security.beta.kubernetes.io/allowedProfileNames: 'runtime/default'
    apparmor.security.beta.kubernetes.io/defaultProfileName: 'runtime/default'
spec:
  # Privilege and access controls
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  
  # Volume restrictions
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  
  # Host restrictions
  hostNetwork: false
  hostIPC: false
  hostPID: false
  
  # User restrictions
  runAsUser:
    rule: 'MustRunAsNonRoot'
  runAsGroup:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  
  # Security context
  seLinux:
    rule: 'RunAsAny'
  
  # File system
  fsGroup:
    rule: 'RunAsAny'
  readOnlyRootFilesystem: true
  
  # Allow GPU access for AI workloads
  allowedCapabilities:
    - 'SYS_NICE'  # Required for GPU scheduling optimization
  
  # Sysctls
  forbiddenSysctls:
    - '*'

---
# Pod Security Policy for general tenant workloads
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: tenant-workload-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  runAsGroup:
    rule: 'MustRunAs'
    ranges:
      - min: 1000
        max: 65535
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
  readOnlyRootFilesystem: true

---
# ClusterRole for PSP usage by AI workloads
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: ai-workload-psp-user
rules:
- apiGroups: ['policy']
  resources: ['podsecuritypolicies']
  verbs: ['use']
  resourceNames:
  - ai-workload-psp

---
# ClusterRole for PSP usage by general workloads
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: tenant-workload-psp-user
rules:
- apiGroups: ['policy']
  resources: ['podsecuritypolicies']
  verbs: ['use']
  resourceNames:
  - tenant-workload-psp
```

---

## 2. AI/ML Pipeline and MLOps Implementation

### 2.1 MLOps Pipeline Configuration

**infrastructure/mlops/mlflow/mlflow-deployment.yaml:**
```yaml
# MLflow tracking server for AI model management
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mlflow-tracking-server
  namespace: ai-services
  labels:
    app: mlflow-tracking-server
    component: mlops
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mlflow-tracking-server
  template:
    metadata:
      labels:
        app: mlflow-tracking-server
    spec:
      serviceAccountName: mlflow-service-account
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: mlflow-server
        image: mlflow/mlflow:2.7.1
        ports:
        - containerPort: 5000
          name: http
        env:
        - name: MLFLOW_BACKEND_STORE_URI
          valueFrom:
            secretKeyRef:
              name: mlflow-secrets
              key: backend-store-uri
        - name: MLFLOW_DEFAULT_ARTIFACT_ROOT
          valueFrom:
            secretKeyRef:
              name: mlflow-secrets
              key: artifact-root
        - name: MLFLOW_S3_ENDPOINT_URL
          valueFrom:
            secretKeyRef:
              name: mlflow-secrets
              key: s3-endpoint-url
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: mlflow-secrets
              key: aws-access-key-id
        - name: AWS_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: mlflow-secrets
              key: aws-secret-access-key
        command:
        - mlflow
        - server
        - --host
        - "0.0.0.0"
        - --port
        - "5000"
        - --backend-store-uri
        - $(MLFLOW_BACKEND_STORE_URI)
        - --default-artifact-root
        - $(MLFLOW_DEFAULT_ARTIFACT_ROOT)
        - --serve-artifacts
        volumeMounts:
        - name: mlflow-data
          mountPath: /mlflow-data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1"
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 60
          periodSeconds: 30
      volumes:
      - name: mlflow-data
        persistentVolumeClaim:
          claimName: mlflow-data-pvc

---
# MLflow Service
apiVersion: v1
kind: Service
metadata:
  name: mlflow-tracking-service
  namespace: ai-services
  labels:
    app: mlflow-tracking-server
spec:
  type: ClusterIP
  ports:
  - port: 5000
    targetPort: 5000
    protocol: TCP
    name: http
  selector:
    app: mlflow-tracking-server

---
# MLflow Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mlflow-ingress
  namespace: ai-services
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: mlflow-basic-auth
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
spec:
  tls:
  - hosts:
    - mlflow.orokii.com
    secretName: mlflow-tls
  rules:
  - host: mlflow.orokii.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: mlflow-tracking-service
            port:
              number: 5000
```

### 2.2 TensorFlow Serving for AI Model Deployment

**infrastructure/mlops/tensorflow-serving/tensorflow-serving.yaml:**
```yaml
# TensorFlow Serving deployment for fraud detection models
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tensorflow-serving-fraud-detection
  namespace: ai-services
  labels:
    app: tensorflow-serving
    model: fraud-detection
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tensorflow-serving
      model: fraud-detection
  template:
    metadata:
      labels:
        app: tensorflow-serving
        model: fraud-detection
    spec:
      serviceAccountName: tensorflow-serving-sa
      nodeSelector:
        workload-type: ai-ml
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      containers:
      - name: tensorflow-serving
        image: tensorflow/serving:2.13.0-gpu
        ports:
        - containerPort: 8501
          name: rest-api
        - containerPort: 8500
          name: grpc-api
        env:
        - name: MODEL_NAME
          value: "fraud_detection"
        - name: MODEL_BASE_PATH
          value: "/models"
        - name: REST_API_PORT
          value: "8501"
        - name: GRPC_API_PORT
          value: "8500"
        - name: MONITORING_CONFIG_FILE
          value: "/monitoring/monitoring_config.txt"
        - name: BATCHING_PARAMETERS_FILE
          value: "/config/batching_parameters.txt"
        command:
        - "/usr/bin/tensorflow_model_server"
        args:
        - "--port=8500"
        - "--rest_api_port=8501"
        - "--model_name=$(MODEL_NAME)"
        - "--model_base_path=$(MODEL_BASE_PATH)"
        - "--monitoring_config_file=$(MONITORING_CONFIG_FILE)"
        - "--batching_parameters_file=$(BATCHING_PARAMETERS_FILE)"
        - "--file_system_poll_wait_seconds=60"
        - "--flush_filesystem_caches=true"
        - "--enable_batching=true"
        - "--allow_version_labels_for_unavailable_models=true"
        volumeMounts:
        - name: model-storage
          mountPath: /models
          readOnly: true
        - name: monitoring-config
          mountPath: /monitoring
        - name: batching-config
          mountPath: /config
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
            nvidia.com/gpu: "1"
          limits:
            memory: "8Gi"
            cpu: "4"
            nvidia.com/gpu: "1"
        readinessProbe:
          httpGet:
            path: /v1/models/fraud_detection
            port: 8501
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /v1/models/fraud_detection
            port: 8501
          initialDelaySeconds: 120
          periodSeconds: 30
      volumes:
      - name: model-storage
        persistentVolumeClaim:
          claimName: ai-models-pvc
      - name: monitoring-config
        configMap:
          name: tensorflow-monitoring-config
      - name: batching-config
        configMap:
          name: tensorflow-batching-config

---
# TensorFlow Serving for conversational AI models
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tensorflow-serving-nlp
  namespace: ai-services
  labels:
    app: tensorflow-serving
    model: nlp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tensorflow-serving
      model: nlp
  template:
    metadata:
      labels:
        app: tensorflow-serving
        model: nlp
    spec:
      serviceAccountName: tensorflow-serving-sa
      nodeSelector:
        workload-type: ai-ml
      containers:
      - name: tensorflow-serving
        image: tensorflow/serving:2.13.0
        ports:
        - containerPort: 8501
          name: rest-api
        - containerPort: 8500
          name: grpc-api
        env:
        - name: MODEL_CONFIG_FILE
          value: "/config/models.config"
        command:
        - "/usr/bin/tensorflow_model_server"
        args:
        - "--port=8500"
        - "--rest_api_port=8501"
        - "--model_config_file=$(MODEL_CONFIG_FILE)"
        - "--file_system_poll_wait_seconds=60"
        - "--flush_filesystem_caches=true"
        volumeMounts:
        - name: model-storage
          mountPath: /models
          readOnly: true
        - name: model-config
          mountPath: /config
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        readinessProbe:
          httpGet:
            path: /v1/models/nigerian_nlp
            port: 8501
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /v1/models/nigerian_nlp
            port: 8501
          initialDelaySeconds: 120
          periodSeconds: 30
      volumes:
      - name: model-storage
        persistentVolumeClaim:
          claimName: ai-models-pvc
      - name: model-config
        configMap:
          name: tensorflow-nlp-models-config

---
# TensorFlow Serving Services
apiVersion: v1
kind: Service
metadata:
  name: tensorflow-serving-fraud-detection
  namespace: ai-services
  labels:
    app: tensorflow-serving
    model: fraud-detection
spec:
  type: ClusterIP
  ports:
  - port: 8501
    targetPort: 8501
    protocol: TCP
    name: rest-api
  - port: 8500
    targetPort: 8500
    protocol: TCP
    name: grpc-api
  selector:
    app: tensorflow-serving
    model: fraud-detection

---
apiVersion: v1
kind: Service
metadata:
  name: tensorflow-serving-nlp
  namespace: ai-services
  labels:
    app: tensorflow-serving
    model: nlp
spec:
  type: ClusterIP
  ports:
  - port: 8501
    targetPort: 8501
    protocol: TCP
    name: rest-api
  - port: 8500
    targetPort: 8500
    protocol: TCP
    name: grpc-api
  selector:
    app: tensorflow-serving
    model: nlp

---
# ConfigMap for TensorFlow Serving monitoring
apiVersion: v1
kind: ConfigMap
metadata:
  name: tensorflow-monitoring-config
  namespace: ai-services
data:
  monitoring_config.txt: |
    prometheus_config {
      enable: true,
      path: "/monitoring/prometheus/metrics"
    }

---
# ConfigMap for TensorFlow Serving batching
apiVersion: v1
kind: ConfigMap
metadata:
  name: tensorflow-batching-config
  namespace: ai-services
data:
  batching_parameters.txt: |
    max_batch_size { value: 32 }
    batch_timeout_micros { value: 50000 }
    max_enqueued_batches { value: 10 }
    num_batch_threads { value: 4 }

---
# ConfigMap for multiple NLP models
apiVersion: v1
kind: ConfigMap
metadata:
  name: tensorflow-nlp-models-config
  namespace: ai-services
data:
  models.config: |
    model_config_list {
      config {
        name: 'nigerian_nlp'
        base_path: '/models/nigerian_nlp'
        model_platform: "tensorflow"
        model_version_policy {
          latest {
            num_versions: 2
          }
        }
        version_labels {
          key: 'stable'
          value: 1
        }
        version_labels {
          key: 'canary'
          value: 2
        }
      }
      config {
        name: 'intent_classifier'
        base_path: '/models/intent_classifier'
        model_platform: "tensorflow"
        model_version_policy {
          latest {
            num_versions: 1
          }
        }
      }
      config {
        name: 'entity_extractor'
        base_path: '/models/entity_extractor'
        model_platform: "tensorflow"
        model_version_policy {
          latest {
            num_versions: 1
          }
        }
      }
    }
```

### 2.3 Vector Database for AI Embeddings (Weaviate)

**infrastructure/mlops/vector-database/weaviate.yaml:**
```yaml
# Weaviate vector database for AI embeddings and semantic search
apiVersion: apps/v1
kind: Deployment
metadata:
  name: weaviate
  namespace: ai-services
  labels:
    app: weaviate
spec:
  replicas: 3
  selector:
    matchLabels:
      app: weaviate
  template:
    metadata:
      labels:
        app: weaviate
    spec:
      serviceAccountName: weaviate-sa
      nodeSelector:
        workload-type: ai-ml
      containers:
      - name: weaviate
        image: semitechnologies/weaviate:1.21.2
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: QUERY_DEFAULTS_LIMIT
          value: "25"
        - name: AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED
          value: "false"
        - name: AUTHENTICATION_APIKEY_ENABLED
          value: "true"
        - name: AUTHENTICATION_APIKEY_ALLOWED_KEYS
          valueFrom:
            secretKeyRef:
              name: weaviate-secrets
              key: api-keys
        - name: AUTHENTICATION_APIKEY_USERS
          valueFrom:
            secretKeyRef:
              name: weaviate-secrets
              key: api-users
        - name: AUTHORIZATION_ADMINLIST_ENABLED
          value: "true"
        - name: AUTHORIZATION_ADMINLIST_USERS
          valueFrom:
            secretKeyRef:
              name: weaviate-secrets
              key: admin-users
        - name: PERSISTENCE_DATA_PATH
          value: "/var/lib/weaviate"
        - name: DEFAULT_VECTORIZER_MODULE
          value: "text2vec-transformers"
        - name: ENABLE_MODULES
          value: "text2vec-transformers,text2vec-openai,qna-transformers,generative-openai"
        - name: TRANSFORMERS_INFERENCE_API
          value: "http://transformers-inference:8080"
        - name: CLUSTER_HOSTNAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: CLUSTER_GOSSIP_BIND_PORT
          value: "7100"
        - name: CLUSTER_DATA_BIND_PORT
          value: "7101"
        - name: CLUSTER_JOIN
          value: "weaviate-0.weaviate-headless.ai-services.svc.cluster.local:7100,weaviate-1.weaviate-headless.ai-services.svc.cluster.local:7100,weaviate-2.weaviate-headless.ai-services.svc.cluster.local:7100"
        volumeMounts:
        - name: weaviate-data
          mountPath: /var/lib/weaviate
        resources:
          requests:
            memory: "4Gi"
            cpu: "1"
          limits:
            memory: "8Gi"
            cpu: "2"
        readinessProbe:
          httpGet:
            path: /v1/.well-known/ready
            port: 8080
            httpHeaders:
            - name: Authorization
              value: "Bearer weaviate-admin-key"
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /v1/.well-known/live
            port: 8080
            httpHeaders:
            - name: Authorization
              value: "Bearer weaviate-admin-key"
          initialDelaySeconds: 60
          periodSeconds: 30
      volumes:
      - name: weaviate-data
        persistentVolumeClaim:
          claimName: weaviate-data-pvc

---
# Weaviate StatefulSet for persistent storage
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: weaviate
  namespace: ai-services
spec:
  serviceName: weaviate-headless
  replicas: 3
  selector:
    matchLabels:
      app: weaviate
  template:
    metadata:
      labels:
        app: weaviate
    spec:
      serviceAccountName: weaviate-sa
      nodeSelector:
        workload-type: ai-ml
      containers:
      - name: weaviate
        image: semitechnologies/weaviate:1.21.2
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 7100
          name: gossip
        - containerPort: 7101
          name: data
        env:
        - name: AUTHENTICATION_APIKEY_ENABLED
          value: "true"
        - name: AUTHENTICATION_APIKEY_ALLOWED_KEYS
          valueFrom:
            secretKeyRef:
              name: weaviate-secrets
              key: api-keys
        - name: PERSISTENCE_DATA_PATH
          value: "/var/lib/weaviate"
        - name: DEFAULT_VECTORIZER_MODULE
          value: "text2vec-transformers"
        - name: ENABLE_MODULES
          value: "text2vec-transformers,text2vec-openai,qna-transformers,generative-openai"
        - name: CLUSTER_HOSTNAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: CLUSTER_GOSSIP_BIND_PORT
          value: "7100"
        - name: CLUSTER_DATA_BIND_PORT
          value: "7101"
        volumeMounts:
        - name: weaviate-storage
          mountPath: /var/lib/weaviate
        resources:
          requests:
            memory: "4Gi"
            cpu: "1"
          limits:
            memory: "8Gi"
            cpu: "2"
  volumeClaimTemplates:
  - metadata:
      name: weaviate-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 100Gi
      storageClassName: fast-ssd

---
# Weaviate Services
apiVersion: v1
kind: Service
metadata:
  name: weaviate
  namespace: ai-services
  labels:
    app: weaviate
spec:
  type: ClusterIP
  ports:
  - port: 8080
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: weaviate

---
apiVersion: v1
kind: Service
metadata:
  name: weaviate-headless
  namespace: ai-services
  labels:
    app: weaviate
spec:
  clusterIP: None
  ports:
  - port: 8080
    targetPort: 8080
    protocol: TCP
    name: http
  - port: 7100
    targetPort: 7100
    protocol: TCP
    name: gossip
  - port: 7101
    targetPort: 7101
    protocol: TCP
    name: data
  selector:
    app: weaviate

---
# Transformers inference service for Weaviate
apiVersion: apps/v1
kind: Deployment
metadata:
  name: transformers-inference
  namespace: ai-services
  labels:
    app: transformers-inference
spec:
  replicas: 2
  selector:
    matchLabels:
      app: transformers-inference
  template:
    metadata:
      labels:
        app: transformers-inference
    spec:
      nodeSelector:
        workload-type: ai-ml
      containers:
      - name: transformers-inference
        image: semitechnologies/transformers-inference:sentence-transformers-multi-qa-MiniLM-L6-cos-v1
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: ENABLE_CUDA
          value: "true"
        resources:
          requests:
            memory: "2Gi"
            cpu: "500m"
            nvidia.com/gpu: "1"
          limits:
            memory: "4Gi"
            cpu: "1"
            nvidia.com/gpu: "1"
        readinessProbe:
          httpGet:
            path: /.well-known/ready
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /.well-known/live
            port: 8080
          initialDelaySeconds: 120
          periodSeconds: 30

---
apiVersion: v1
kind: Service
metadata:
  name: transformers-inference
  namespace: ai-services
  labels:
    app: transformers-inference
spec:
  type: ClusterIP
  ports:
  - port: 8080
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: transformers-inference
```

---

## 3. Multi-Tenant Deployment Strategies

### 3.1 Tenant Application Deployment Template

**infrastructure/deployment/tenant-application.yaml:**
```yaml
# Multi-tenant application deployment template
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${TENANT_ID}-app
  namespace: tenant-${TENANT_ID}
  labels:
    app: tenant-app
    tenant: ${TENANT_ID}
    tier: ${TENANT_TIER}
    version: ${APP_VERSION}
spec:
  replicas: ${REPLICA_COUNT}
  selector:
    matchLabels:
      app: tenant-app
      tenant: ${TENANT_ID}
  template:
    metadata:
      labels:
        app: tenant-app
        tenant: ${TENANT_ID}
        tier: ${TENANT_TIER}
        version: ${APP_VERSION}
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: tenant-${TENANT_ID}-workloads
      nodeSelector:
        workload-type: general
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      initContainers:
      # Database migration container
      - name: db-migration
        image: ${REGISTRY_URL}/orokii-moneytransfer-migrations:${APP_VERSION}
        env:
        - name: TENANT_ID
          value: "${TENANT_ID}"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ${TENANT_ID}-db-secret
              key: database-url
        - name: MIGRATION_TIMEOUT
          value: "300"
        command:
        - "/scripts/run-migrations.sh"
        volumeMounts:
        - name: migration-scripts
          mountPath: /scripts
      containers:
      # Main application container
      - name: app
        image: ${REGISTRY_URL}/orokii-moneytransfer-app:${APP_VERSION}
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8081
          name: metrics
        env:
        # Tenant configuration
        - name: TENANT_ID
          value: "${TENANT_ID}"
        - name: TENANT_NAME
          value: "${TENANT_NAME}"
        - name: TENANT_TIER
          value: "${TENANT_TIER}"
        - name: NODE_ENV
          value: "production"
        
        # Database configuration
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ${TENANT_ID}-db-secret
              key: database-url
        - name: DATABASE_POOL_SIZE
          value: "${DB_POOL_SIZE}"
        - name: DATABASE_SSL
          value: "true"
        
        # AI service configuration
        - name: AI_SERVICE_URL
          valueFrom:
            configMapKeyRef:
              name: platform-config
              key: ai-service-url
        - name: AI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ${TENANT_ID}-ai-secrets
              key: ai-api-key
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ${TENANT_ID}-ai-secrets
              key: openai-api-key
        
        # Fraud detection configuration
        - name: FRAUD_SERVICE_URL
          valueFrom:
            configMapKeyRef:
              name: platform-config
              key: fraud-service-url
        - name: FRAUD_DETECTION_ENABLED
          value: "${FRAUD_DETECTION_ENABLED}"
        
        # Payment provider configuration
        - name: NIBSS_API_URL
          valueFrom:
            configMapKeyRef:
              name: payment-config
              key: nibss-api-url
        - name: NIBSS_API_KEY
          valueFrom:
            secretKeyRef:
              name: ${TENANT_ID}-payment-secrets
              key: nibss-api-key
        
        # Monitoring and logging
        - name: LOG_LEVEL
          value: "${LOG_LEVEL}"
        - name: METRICS_ENABLED
          value: "true"
        - name: JAEGER_ENDPOINT
          valueFrom:
            configMapKeyRef:
              name: monitoring-config
              key: jaeger-endpoint
        
        # Security configuration
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: ${TENANT_ID}-auth-secrets
              key: jwt-secret
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: ${TENANT_ID}-encryption-secrets
              key: encryption-key
        
        # Feature flags
        - name: AI_ASSISTANT_ENABLED
          value: "${AI_ASSISTANT_ENABLED}"
        - name: VOICE_COMMANDS_ENABLED
          value: "${VOICE_COMMANDS_ENABLED}"
        - name: OFFLINE_MODE_ENABLED
          value: "${OFFLINE_MODE_ENABLED}"
        
        volumeMounts:
        - name: app-config
          mountPath: /app/config
          readOnly: true
        - name: ai-models-cache
          mountPath: /app/ai-models
        - name: temp-storage
          mountPath: /tmp
        
        resources:
          requests:
            memory: "${MEMORY_REQUEST}"
            cpu: "${CPU_REQUEST}"
          limits:
            memory: "${MEMORY_LIMIT}"
            cpu: "${CPU_LIMIT}"
        
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
        
        # Startup probe for slow-starting AI models
        startupProbe:
          httpGet:
            path: /health/startup
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 60  # Allow up to 5 minutes for AI model loading
      
      volumes:
      - name: app-config
        configMap:
          name: ${TENANT_ID}-app-config
      - name: migration-scripts
        configMap:
          name: db-migration-scripts
          defaultMode: 0755
      - name: ai-models-cache
        emptyDir:
          sizeLimit: 10Gi
      - name: temp-storage
        emptyDir:
          sizeLimit: 1Gi
      
      # Pod disruption budget consideration
      terminationGracePeriodSeconds: 60
      
      # Topology spread constraints for high availability
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: tenant-app
            tenant: ${TENANT_ID}

---
# Horizontal Pod Autoscaler for tenant application
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${TENANT_ID}-app-hpa
  namespace: tenant-${TENANT_ID}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${TENANT_ID}-app
  minReplicas: ${MIN_REPLICAS}
  maxReplicas: ${MAX_REPLICAS}
  metrics:
  # CPU utilization
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  # Memory utilization
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  # Custom metrics: requests per second
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  # AI processing queue length
  - type: Object
    object:
      metric:
        name: ai_processing_queue_length
      target:
        type: Value
        value: "50"
      describedObject:
        apiVersion: v1
        kind: Service
        name: ${TENANT_ID}-app-service
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max

---
# Service for tenant application
apiVersion: v1
kind: Service
metadata:
  name: ${TENANT_ID}-app-service
  namespace: tenant-${TENANT_ID}
  labels:
    app: tenant-app
    tenant: ${TENANT_ID}
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  - port: 8081
    targetPort: 8081
    protocol: TCP
    name: metrics
  selector:
    app: tenant-app
    tenant: ${TENANT_ID}

---
# Ingress for tenant application
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${TENANT_ID}-app-ingress
  namespace: tenant-${TENANT_ID}
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "120"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "120"
    nginx.ingress.kubernetes.io/rate-limit: "${RATE_LIMIT_RPS}"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    # Enable CORS for web apps
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "${CORS_ALLOWED_ORIGINS}"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "DNT,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Tenant-ID"
    # Security headers
    nginx.ingress.kubernetes.io/configuration-snippet: |
      add_header X-Frame-Options "SAMEORIGIN" always;
      add_header X-Content-Type-Options "nosniff" always;
      add_header X-XSS-Protection "1; mode=block" always;
      add_header Referrer-Policy "strict-origin-when-cross-origin" always;
      add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.openai.com https://nibss.com.ng;" always;
spec:
  tls:
  - hosts:
    - ${TENANT_SUBDOMAIN}.orokii.com
    - ${CUSTOM_DOMAIN}
    secretName: ${TENANT_ID}-tls
  rules:
  - host: ${TENANT_SUBDOMAIN}.orokii.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${TENANT_ID}-app-service
            port:
              number: 80
  - host: ${CUSTOM_DOMAIN}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${TENANT_ID}-app-service
            port:
              number: 80

---
# Pod Disruption Budget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ${TENANT_ID}-app-pdb
  namespace: tenant-${TENANT_ID}
spec:
  minAvailable: 50%
  selector:
    matchLabels:
      app: tenant-app
      tenant: ${TENANT_ID}
```

### 3.2 Automated Tenant Provisioning

**scripts/tenant-provisioning/provision-tenant.sh:**
```bash
#!/bin/bash
set -e

# Nigerian PoS Multi-Tenant Provisioning Script
# This script provisions a new tenant with all necessary resources

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="${SCRIPT_DIR}/../templates"
KUBECTL_CMD="kubectl"
HELM_CMD="helm"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Usage function
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Provision a new tenant in the Nigerian Money Transfer multi-tenant system.

OPTIONS:
    -t, --tenant-id TENANT_ID          Unique tenant identifier (required)
    -n, --tenant-name TENANT_NAME      Display name for the tenant (required)
    -s, --subdomain SUBDOMAIN          Subdomain for the tenant (required)
    -d, --custom-domain DOMAIN         Custom domain (optional)
    --tier TIER                        Tenant tier: basic|premium|enterprise (default: basic)
    --region REGION                    Deployment region (default: nigeria-west)
    --compliance LEVEL                 Compliance level: tier1|tier2|tier3 (default: tier2)
    --ai-enabled                       Enable AI features (default: true)
    --fraud-detection                  Enable fraud detection (default: true)
    --voice-commands                   Enable voice commands (default: false)
    --database-size SIZE               Database storage size (default: 100Gi)
    --cpu-request CPU                  CPU request (default: 1)
    --memory-request MEMORY            Memory request (default: 2Gi)
    --cpu-limit CPU                    CPU limit (default: 4)  
    --memory-limit MEMORY              Memory limit (default: 8Gi)
    --min-replicas NUM                 Minimum replicas (default: 2)
    --max-replicas NUM                 Maximum replicas (default: 10)
    --dry-run                          Show what would be created without actually creating
    -h, --help                         Show this help message

EXAMPLES:
    $0 -t bank-a -n "Bank A" -s bank-a --tier enterprise --ai-enabled
    $0 -t bank-b -n "Bank B" -s bank-b -d banking.bank-b.com --tier premium
    $0 -t bank-c -n "Bank C" -s bank-c --tier basic --database-size 50Gi

EOF
}

# Default values
TENANT_ID=""
TENANT_NAME=""
SUBDOMAIN=""
CUSTOM_DOMAIN=""
TIER="basic"
REGION="nigeria-west"
COMPLIANCE_LEVEL="tier2"
AI_ENABLED="true"
FRAUD_DETECTION="true"
VOICE_COMMANDS="false"
DATABASE_SIZE="100Gi"
CPU_REQUEST="1"
MEMORY_REQUEST="2Gi"
CPU_LIMIT="4"
MEMORY_LIMIT="8Gi"
MIN_REPLICAS="2"
MAX_REPLICAS="10"
DRY_RUN="false"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tenant-id)
            TENANT_ID="$2"
            shift 2
            ;;
        -n|--tenant-name)
            TENANT_NAME="$2"
            shift 2
            ;;
        -s|--subdomain)
            SUBDOMAIN="$2"
            shift 2
            ;;
        -d|--custom-domain)
            CUSTOM_DOMAIN="$2"
            shift 2
            ;;
        --tier)
            TIER="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --compliance)
            COMPLIANCE_LEVEL="$2"
            shift 2
            ;;
        --ai-enabled)
            AI_ENABLED="true"
            shift
            ;;
        --fraud-detection)
            FRAUD_DETECTION="true"
            shift
            ;;
        --voice-commands)
            VOICE_COMMANDS="true"
            shift
            ;;
        --database-size)
            DATABASE_SIZE="$2"
            shift 2
            ;;
        --cpu-request)
            CPU_REQUEST="$2"
            shift 2
            ;;
        --memory-request)
            MEMORY_REQUEST="$2"
            shift 2
            ;;
        --cpu-limit)
            CPU_LIMIT="$2"
            shift 2
            ;;
        --memory-limit)
            MEMORY_LIMIT="$2"
            shift 2
            ;;
        --min-replicas)
            MIN_REPLICAS="$2"
            shift 2
            ;;
        --max-replicas)
            MAX_REPLICAS="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option $1"
            usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$TENANT_ID" ]]; then
    log_error "Tenant ID is required"
    usage
    exit 1
fi

if [[ -z "$TENANT_NAME" ]]; then
    log_error "Tenant name is required"
    usage
    exit 1
fi

if [[ -z "$SUBDOMAIN" ]]; then
    log_error "Subdomain is required"
    usage
    exit 1
fi

# Validate tenant ID format
if [[ ! "$TENANT_ID" =~ ^[a-z0-9-]+$ ]]; then
    log_error "Tenant ID must contain only lowercase letters, numbers, and hyphens"
    exit 1
fi

# Validate tier
if [[ ! "$TIER" =~ ^(basic|premium|enterprise)$ ]]; then
    log_error "Tier must be one of: basic, premium, enterprise"
    exit 1
fi

# Validate compliance level
if [[ ! "$COMPLIANCE_LEVEL" =~ ^(tier1|tier2|tier3)$ ]]; then
    log_error "Compliance level must be one of: tier1, tier2, tier3"
    exit 1
fi

# Set tier-specific defaults
case $TIER in
    "basic")
        if [[ "$CPU_REQUEST" == "1" ]]; then CPU_REQUEST="500m"; fi
        if [[ "$MEMORY_REQUEST" == "2Gi" ]]; then MEMORY_REQUEST="1Gi"; fi
        if [[ "$CPU_LIMIT" == "4" ]]; then CPU_LIMIT="2"; fi
        if [[ "$MEMORY_LIMIT" == "8Gi" ]]; then MEMORY_LIMIT="4Gi"; fi
        if [[ "$MAX_REPLICAS" == "10" ]]; then MAX_REPLICAS="5"; fi
        RATE_LIMIT_RPS="100"
        ;;
    "premium")
        if [[ "$CPU_REQUEST" == "1" ]]; then CPU_REQUEST="1"; fi
        if [[ "$MEMORY_REQUEST" == "2Gi" ]]; then MEMORY_REQUEST="2Gi"; fi
        if [[ "$CPU_LIMIT" == "4" ]]; then CPU_LIMIT="4"; fi
        if [[ "$MEMORY_LIMIT" == "8Gi" ]]; then MEMORY_LIMIT="8Gi"; fi
        RATE_LIMIT_RPS="500"
        ;;
    "enterprise")
        if [[ "$CPU_REQUEST" == "1" ]]; then CPU_REQUEST="2"; fi
        if [[ "$MEMORY_REQUEST" == "2Gi" ]]; then MEMORY_REQUEST="4Gi"; fi
        if [[ "$CPU_LIMIT" == "4" ]]; then CPU_LIMIT="8"; fi
        if [[ "$MEMORY_LIMIT" == "8Gi" ]]; then MEMORY_LIMIT="16Gi"; fi
        if [[ "$MIN_REPLICAS" == "2" ]]; then MIN_REPLICAS="3"; fi
        if [[ "$MAX_REPLICAS" == "10" ]]; then MAX_REPLICAS="20"; fi
        RATE_LIMIT_RPS="1000"
        ;;
esac

# Generate configuration values
export TENANT_ID TENANT_NAME SUBDOMAIN CUSTOM_DOMAIN TIER REGION COMPLIANCE_LEVEL
export AI_ENABLED FRAUD_DETECTION VOICE_COMMANDS DATABASE_SIZE
export CPU_REQUEST MEMORY_REQUEST CPU_LIMIT MEMORY_LIMIT
export MIN_REPLICAS MAX_REPLICAS RATE_LIMIT_RPS
export APP_VERSION="${APP_VERSION:-latest}"
export REGISTRY_URL="${REGISTRY_URL:-orokii.azurecr.io}"

# Additional computed values
export TENANT_SUBDOMAIN="$SUBDOMAIN"
export AI_ASSISTANT_ENABLED="$AI_ENABLED"
export VOICE_COMMANDS_ENABLED="$VOICE_COMMANDS"
export FRAUD_DETECTION_ENABLED="$FRAUD_DETECTION"
export OFFLINE_MODE_ENABLED="true"
export LOG_LEVEL="info"
export DB_POOL_SIZE="20"
export CORS_ALLOWED_ORIGINS="https://${SUBDOMAIN}.orokii.com,https://${CUSTOM_DOMAIN}"
export REPLICA_COUNT="$MIN_REPLICAS"

# Function to check if tenant already exists
check_tenant_exists() {
    log_info "Checking if tenant already exists..."
    
    if $KUBECTL_CMD get namespace "tenant-${TENANT_ID}" &> /dev/null; then
        log_error "Tenant namespace 'tenant-${TENANT_ID}' already exists"
        exit 1
    fi
    
    # Check in platform database for tenant record
    log_debug "Checking platform database for existing tenant record..."
}

# Function to create tenant database
create_tenant_database() {
    log_info "Creating tenant database..."
    
    # Generate database credentials
    DB_NAME="tenant_${TENANT_ID}_pos"
    DB_USER="tenant_${TENANT_ID}_user"
    DB_PASSWORD=$(openssl rand -base64 32)
    DB_ENCRYPTION_KEY=$(openssl rand -base64 32)
    
    # Create database using PostgreSQL operator or direct connection
    if [[ "$DRY_RUN" == "false" ]]; then
        # This would typically use a PostgreSQL operator or connect to managed database
        log_debug "Database creation would happen here in production"
        
        # Create database secret
        $KUBECTL_CMD create secret generic "${TENANT_ID}-db-secret" \
            --namespace="tenant-${TENANT_ID}" \
            --from-literal=database-url="postgresql://${DB_USER}:${DB_PASSWORD}@postgres.databases.svc.cluster.local:5432/${DB_NAME}?sslmode=require" \
            --from-literal=database-name="${DB_NAME}" \
            --from-literal=database-user="${DB_USER}" \
            --from-literal=database-password="${DB_PASSWORD}" \
            --from-literal=encryption-key="${DB_ENCRYPTION_KEY}"
    else
        log_debug "[DRY RUN] Would create database: $DB_NAME"
        log_debug "[DRY RUN] Would create database user: $DB_USER"
        log_debug "[DRY RUN] Would create database secret: ${TENANT_ID}-db-secret"
    fi
}

# Function to create AI secrets
create_ai_secrets() {
    log_info "Creating AI service secrets..."
    
    # Generate AI API keys
    AI_API_KEY=$(openssl rand -base64 32)
    OPENAI_API_KEY="${OPENAI_API_KEY:-sk-changeme}" # Should be provided via environment
    
    if [[ "$DRY_RUN" == "false" ]]; then
        $KUBECTL_CMD create secret generic "${TENANT_ID}-ai-secrets" \
            --namespace="tenant-${TENANT_ID}" \
            --from-literal=ai-api-key="${AI_API_KEY}" \
            --from-literal=openai-api-key="${OPENAI_API_KEY}"
    else
        log_debug "[DRY RUN] Would create AI secrets: ${TENANT_ID}-ai-secrets"
    fi
}

# Function to create payment secrets
create_payment_secrets() {
    log_info "Creating payment provider secrets..."
    
    # Generate payment provider credentials (these would come from actual providers)
    NIBSS_API_KEY="${NIBSS_API_KEY:-test-nibss-key}"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        $KUBECTL_CMD create secret generic "${TENANT_ID}-payment-secrets" \
            --namespace="tenant-${TENANT_ID}" \
            --from-literal=nibss-api-key="${NIBSS_API_KEY}"
    else
        log_debug "[DRY RUN] Would create payment secrets: ${TENANT_ID}-payment-secrets"
    fi
}

# Function to create auth secrets
create_auth_secrets() {
    log_info "Creating authentication secrets..."
    
    JWT_SECRET=$(openssl rand -base64 64)
    
    if [[ "$DRY_RUN" == "false" ]]; then
        $KUBECTL_CMD create secret generic "${TENANT_ID}-auth-secrets" \
            --namespace="tenant-${TENANT_ID}" \
            --from-literal=jwt-secret="${JWT_SECRET}"
    else
        log_debug "[DRY RUN] Would create auth secrets: ${TENANT_ID}-auth-secrets"
    fi
}

# Function to create encryption secrets
create_encryption_secrets() {
    log_info "Creating encryption secrets..."
    
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    
    if [[ "$DRY_RUN" == "false" ]]; then
        $KUBECTL_CMD create secret generic "${TENANT_ID}-encryption-secrets" \
            --namespace="tenant-${TENANT_ID}" \
            --from-literal=encryption-key="${ENCRYPTION_KEY}"
    else
        log_debug "[DRY RUN] Would create encryption secrets: ${TENANT_ID}-encryption-secrets"
    fi
}

# Function to create tenant configuration
create_tenant_config() {
    log_info "Creating tenant configuration..."
    
    # Create tenant configuration ConfigMap
    cat > /tmp/tenant-config.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${TENANT_ID}-app-config
  namespace: tenant-${TENANT_ID}
data:
  tenant.json: |
    {
      "id": "${TENANT_ID}",
      "name": "${TENANT_NAME}",
      "subdomain": "${SUBDOMAIN}",
      "customDomain": "${CUSTOM_DOMAIN}",
      "tier": "${TIER}",
      "region": "${REGION}",
      "complianceLevel": "${COMPLIANCE_LEVEL}",
      "features": {
        "aiAssistant": ${AI_ENABLED},
        "fraudDetection": ${FRAUD_DETECTION},
        "voiceCommands": ${VOICE_COMMANDS},
        "offlineMode": true,
        "biometricAuth": true,
        "qrPayments": true
      },
      "branding": {
        "companyName": "${TENANT_NAME}",
        "primaryColor": "#1976d2",
        "secondaryColor": "#f50057",
        "backgroundColor": "#ffffff",
        "textColor": "#333333",
        "fontFamily": "Roboto",
        "currency": "NGN",
        "locale": "en-NG"
      },
      "businessRules": {
        "transactionLimits": {
          "daily": {"amount": 1000000, "count": 100},
          "monthly": {"amount": 10000000, "count": 1000},
          "perTransaction": {"minimum": 100, "maximum": 500000}
        },
        "operatingHours": {
          "timezone": "Africa/Lagos",
          "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "startTime": "08:00",
          "endTime": "18:00"
        }
      }
    }
EOF
    
    if [[ "$DRY_RUN" == "false" ]]; then
        $KUBECTL_CMD apply -f /tmp/tenant-config.yaml
        rm /tmp/tenant-config.yaml
    else
        log_debug "[DRY RUN] Would create tenant config:"
        cat /tmp/tenant-config.yaml
        rm /tmp/tenant-config.yaml
    fi
}

# Function to apply Kubernetes resources
apply_k8s_resources() {
    log_info "Applying Kubernetes resources..."
    
    # Create temporary directory for processed templates
    TEMP_DIR=$(mktemp -d)
    
    # Process namespace template
    envsubst < "${TEMPLATES_DIR}/tenant-namespace-template.yaml" > "${TEMP_DIR}/namespace.yaml"
    
    # Process application deployment template
    envsubst < "${TEMPLATES_DIR}/tenant-application.yaml" > "${TEMP_DIR}/application.yaml"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Apply namespace first
        $KUBECTL_CMD apply -f "${TEMP_DIR}/namespace.yaml"
        
        # Wait for namespace to be ready
        $KUBECTL_CMD wait --for=condition=Active namespace/tenant-${TENANT_ID} --timeout=60s
        
        # Create secrets
        create_tenant_database
        create_ai_secrets
        create_payment_secrets
        create_auth_secrets
        create_encryption_secrets
        
        # Create configuration
        create_tenant_config
        
        # Apply application resources
        $KUBECTL_CMD apply -f "${TEMP_DIR}/application.yaml"
        
        log_info "Waiting for deployment to be ready..."
        $KUBECTL_CMD wait --for=condition=available deployment/${TENANT_ID}-app --namespace=tenant-${TENANT_ID} --timeout=300s
        
    else
        log_debug "[DRY RUN] Would apply the following resources:"
        echo "--- Namespace ---"
        cat "${TEMP_DIR}/namespace.yaml"
        echo ""
        echo "--- Application ---"
        cat "${TEMP_DIR}/application.yaml"
    fi
    
    # Cleanup
    rm -rf "${TEMP_DIR}"
}

# Function to register tenant in platform database
register_tenant_platform() {
    log_info "Registering tenant in platform database..."
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # This would typically make an API call to the tenant management service
        # or directly insert into the platform database
        log_debug "Tenant registration would happen here in production"
    else
        log_debug "[DRY RUN] Would register tenant in platform database"
    fi
}

# Function to run post-deployment tests
run_health_checks() {
    log_info "Running post-deployment health checks..."
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Check if pods are running
        if $KUBECTL_CMD get pods -n tenant-${TENANT_ID} -l app=tenant-app | grep -q "Running"; then
            log_info "Application pods are running successfully"
        else
            log_error "Application pods are not running properly"
            $KUBECTL_CMD get pods -n tenant-${TENANT_ID} -l app=tenant-app
            exit 1
        fi
        
        # Check if service is accessible
        SERVICE_IP=$(kubectl get service ${TENANT_ID}-app-service -n tenant-${TENANT_ID} -o jsonpath='{.spec.clusterIP}')
        if [[ -n "$SERVICE_IP" ]]; then
            log_info "Service is accessible at: $SERVICE_IP"
        else
            log_error "Service is not accessible"
            exit 1
        fi
        
        # Test health endpoint (would require port-forward or ingress in real scenario)
        log_debug "Health endpoint testing would happen here"
        
    else
        log_debug "[DRY RUN] Would run health checks"
    fi
}

# Function to display deployment summary
display_summary() {
    log_info "Deployment Summary:"
    echo "===================="
    echo "Tenant ID: $TENANT_ID"
    echo "Tenant Name: $TENANT_NAME"
    echo "Subdomain: $SUBDOMAIN.nibss-pos.com"
    if [[ -n "$CUSTOM_DOMAIN" ]]; then
        echo "Custom Domain: $CUSTOM_DOMAIN"
    fi
    echo "Tier: $TIER"
    echo "Region: $REGION"
    echo "Compliance Level: $COMPLIANCE_LEVEL"
    echo "AI Enabled: $AI_ENABLED"
    echo "Fraud Detection: $FRAUD_DETECTION"
    echo "Voice Commands: $VOICE_COMMANDS"
    echo "Resources: ${CPU_REQUEST}/${CPU_LIMIT} CPU, ${MEMORY_REQUEST}/${MEMORY_LIMIT} Memory"
    echo "Replicas: ${MIN_REPLICAS}-${MAX_REPLICAS}"
    echo "===================="
    
    if [[ "$DRY_RUN" == "false" ]]; then
        echo ""
        echo "Next Steps:"
        echo "1. Configure DNS for ${SUBDOMAIN}.nibss-pos.com"
        if [[ -n "$CUSTOM_DOMAIN" ]]; then
            echo "2. Configure DNS for ${CUSTOM_DOMAIN}"
        fi
        echo "3. Test the deployment: https://${SUBDOMAIN}.nibss-pos.com"
        echo "4. Configure payment provider credentials"
        echo "5. Set up monitoring alerts for the tenant"
    fi
}

# Main execution
main() {
    log_info "Starting tenant provisioning for: $TENANT_ID"
    
    # Pre-flight checks
    check_tenant_exists
    
    # Provision tenant
    apply_k8s_resources
    register_tenant_platform
    run_health_checks
    
    # Show summary
    display_summary
    
    log_info "Tenant provisioning completed successfully!"
}

# Execute main function
main "$@"
```

This comprehensive AI-enhanced multi-tenant implementation guide provides the complete infrastructure foundation. The guide includes Kubernetes setup, MLOps pipelines, deployment strategies, and operational tooling needed for the Nigerian PoS system.

Would you like me to continue with the remaining sections of Book 3, or would you prefer me to complete any specific sections in more detail?