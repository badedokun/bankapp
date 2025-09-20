# Environment Configuration Guide

This guide explains how to configure the OrokiiPay banking application for different deployment environments.

## Quick Start

### For Local Development
```bash
# Copy the local environment template
cp .env.local.example .env.local

# Edit the values as needed
nano .env.local

# Start the application
npm run server  # API server on port 3001
npm run web     # Web app on port 3000
```

### For Cloud Deployment
```bash
# Copy the cloud environment template
cp .env.cloud.example .env

# Edit with your cloud-specific values
nano .env

# Deploy using your deployment script
./deploy.sh
```

## Environment Configuration System

The application uses a centralized environment configuration system that automatically detects the deployment environment and configures URLs accordingly.

### Key Features
- **Automatic Environment Detection**: Detects local vs cloud deployment
- **Centralized Configuration**: All environment settings in one place
- **Smart URL Resolution**: Uses relative URLs in cloud, absolute URLs locally
- **Easy Switching**: Switch between environments with minimal changes

## Configuration Files

### 1. Core Environment Config
- **`src/config/environment.ts`**: Main configuration logic for frontend
- **`src/config/testEnvironment.js`**: Configuration for test files

### 2. Environment Templates
- **`.env.local.example`**: Template for local development
- **`.env.cloud.example`**: Template for cloud deployment

## Environment Variables

### Frontend (React App)
| Variable | Description | Local Example | Cloud Example |
|----------|-------------|---------------|---------------|
| `REACT_APP_ENV` | Environment type | `local` | `development` |
| `REACT_APP_API_URL` | API base URL | `http://localhost:3001` | `` (empty for relative) |
| `REACT_APP_WEB_URL` | Web app URL | `http://localhost:3000` | `` (empty for relative) |
| `REACT_APP_API_TIMEOUT` | API timeout | `30000` | `30000` |

### Backend (Node.js)
| Variable | Description | Local Example | Cloud Example |
|----------|-------------|---------------|---------------|
| `NODE_ENV` | Node environment | `development` | `production` |
| `DATABASE_URL` | Database connection | `postgresql://...localhost` | `postgresql://...cloud-host` |
| `JWT_SECRET` | JWT signing secret | `dev-secret` | `secure-prod-secret` |

### Testing
| Variable | Description | Local Example | Cloud Example |
|----------|-------------|---------------|---------------|
| `TEST_API_URL` | Test API URL | `http://localhost:3001/api` | `/api` |
| `TEST_WEB_URL` | Test web URL | `http://localhost:3000` | `` (empty) |

## Environment Detection

The system automatically detects the environment based on:

### Local Development
- `NODE_ENV !== 'production'`
- `window.location.hostname === 'localhost'`
- No cloud provider environment variables

### Cloud Deployment
- Presence of cloud provider variables:
  - `CLOUD_PROVIDER`
  - `VERCEL`, `NETLIFY`, `HEROKU`
  - `AWS_LAMBDA_FUNCTION_NAME`
  - `GOOGLE_CLOUD_PROJECT`
- Or `window.location.hostname !== 'localhost'`

## URL Resolution Strategy

### Local Development
- **API URLs**: `http://localhost:3001/api/endpoint`
- **Web URLs**: `http://localhost:3000/path`
- **WebSocket**: `ws://localhost:3000`

### Cloud Deployment
- **API URLs**: `/api/endpoint` (relative to same domain)
- **Web URLs**: `/path` (relative to same domain)
- **WebSocket**: Relative WebSocket URLs

## Migration Guide

### From Hardcoded URLs
If you have hardcoded localhost URLs in your code:

**Before:**
```typescript
const apiUrl = 'http://localhost:3001/api/endpoint';
```

**After:**
```typescript
import { buildApiUrl } from '../config/environment';
const apiUrl = buildApiUrl('/api/endpoint');
```

### Test Files
**Before:**
```javascript
const baseUrl = 'http://localhost:3001/api';
```

**After:**
```javascript
const { API_URL } = require('./src/config/testEnvironment');
const baseUrl = API_URL;
```

## Deployment Scenarios

### Scenario 1: Local Development
1. Copy `.env.local.example` to `.env.local`
2. Start both API server and web app
3. Access via `http://localhost:3000`

### Scenario 2: Single Server Deployment (Current)
1. Copy `.env.cloud.example` to `.env`
2. Set `REACT_APP_API_URL=` (empty for relative URLs)
3. Deploy both API and web app to same server
4. Configure reverse proxy (Nginx) to handle routing

### Scenario 3: Microservices Deployment
1. Copy `.env.cloud.example` to `.env`
2. Set `REACT_APP_API_URL=https://api.yourdomain.com`
3. Deploy API and web app to different servers

### Scenario 4: Development on Cloud
1. Use `.env.cloud.example` as base
2. Set `REACT_APP_ENV=development`
3. Keep development tools enabled

## Troubleshooting

### Common Issues

#### 1. API calls failing in cloud
**Problem**: Frontend can't reach backend API
**Solution**: Ensure `REACT_APP_API_URL` is empty for same-domain deployment

#### 2. WebSocket connection errors
**Problem**: WebSocket failing to connect
**Solution**: Check `REACT_APP_WS_URL` configuration and proxy settings

#### 3. Tests using wrong URLs
**Problem**: Tests still using hardcoded localhost
**Solution**: Update test files to use `testEnvironment.js` configuration

### Debug Environment Configuration
Add this to see current configuration:
```javascript
import { ENV_CONFIG } from './src/config/environment';
console.log('Environment Config:', ENV_CONFIG);
```

## Best Practices

1. **Never commit `.env` files** with real credentials
2. **Use environment templates** (`.env.*.example`) for documentation
3. **Test both local and cloud configurations** before deployment
4. **Use relative URLs** for same-domain deployments
5. **Keep environment detection automatic** when possible

## Security Notes

- **Production**: Use strong JWT secrets and session secrets
- **Database**: Use encrypted connections and strong passwords
- **Environment Variables**: Never expose secrets in frontend code
- **HTTPS**: Always use HTTPS in production environments