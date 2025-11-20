# EDoS Detection Dashboard - Real-time Architecture & Development Setup

## 🏗️ **Architecture Overview**

### **Database Choice: Supabase (PostgreSQL)**

- ✅ **Real-time subscriptions** built-in (no need to manage WebSockets manually)
- ✅ **Team collaboration** - cloud hosted, instant access with connection string
- ✅ **Row Level Security** - multi-tenant data isolation
- ✅ **ACID compliance** for critical security data
- ✅ **Built-in Auth** with JWT tokens
- ✅ **Edge Functions** for real-time data processing

### **When to Use REST APIs vs WebSockets**

#### **REST APIs** (Traditional request/response):

- ✅ User authentication/registration
- ✅ CRUD operations (create/update/delete resources)
- ✅ Historical data queries (trends, reports)
- ✅ File uploads/downloads
- ✅ Configuration changes

#### **WebSockets/Real-time** (Live data streaming):

- 🔴 **New security alerts** → instant toast notifications
- 🌐 **Network traffic visualization** → 3D globe live updates
- 📊 **Live metrics** → bandwidth charts, connection counts
- 📝 **Security logs streaming** → live log viewer
- 🔔 **Collaborative features** → alert comments, user activity

## 🚀 **Team Development Setup**

### **1. Supabase Project Setup** (5 minutes)

```bash
# 1. Create account at supabase.com
# 2. Create new project (choose region closest to team)
# 3. Get connection details:
#    - Project URL: https://your-project.supabase.co
#    - API Key (anon): eyJhbGciOiJIUzI1NiIsInR5...
#    - Database URL: postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

### **2. Environment Configuration**

Create `.env.local` (frontend) and `.env` (backend):

```env
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...

# Backend (.env)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5...
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
JWT_SECRET=your-jwt-secret-here
ENVIRONMENT=development
```

### **3. Quick Developer Onboarding**

```bash
# New developer setup (< 5 minutes):
git clone https://github.com/FABLOUSFALCON/EDOS-DETECTION-KIT
cd EDOS-DETECTION-KIT

# Backend setup
cd backend
pip install -r requirements.txt
# Add .env file with Supabase credentials
python main.py

# Frontend setup (new terminal)
npm install
# Add .env.local with Supabase credentials
npm run dev
```

## 📡 **Real-time Data Flow Design**

### **1. Alert System** (Replace 10-second polling)

```typescript
// OLD: Polling approach (inefficient)
setInterval(() => {
  fetch("/api/alerts"); // 100,000 resources = 100,000 requests every 10s
}, 10000);

// NEW: WebSocket subscription (efficient)
const supabase = createClient();
supabase
  .channel("alerts")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "security_alerts",
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      showNotification(payload.new);
      playAlertSound(payload.new.severity);
    }
  )
  .subscribe();
```

### **2. Network Traffic (3D Globe)**

```typescript
// Real-time network sessions
supabase
  .channel("network_traffic")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "network_sessions",
      filter: `resource_id=in.(${userResourceIds.join(",")})`,
    },
    (payload) => {
      updateGlobeVisualization({
        source: { lat: payload.new.source_lat, lon: payload.new.source_lon },
        destination: { lat: payload.new.destination_lat, lon: payload.new.destination_lon },
        protocol: payload.new.protocol,
      });
    }
  )
  .subscribe();
```

### **3. Live Metrics Dashboard**

```typescript
// Real-time bandwidth/metrics updates
supabase
  .channel("metrics")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "network_metrics",
      filter: `resource_id=eq.${selectedResourceId}`,
    },
    (payload) => {
      updateBandwidthChart(payload.new.bandwidth_in, payload.new.bandwidth_out);
      updateProtocolBreakdown(payload.new.protocol_breakdown);
      updateActiveConnections(payload.new.connections_active);
    }
  )
  .subscribe();
```

## 📊 **Data Storage Strategy**

### **Real-time Data** (Don't store everything):

- ✅ **Live network metrics** → store aggregated 1-minute summaries
- ✅ **Active network sessions** → store only current connections
- ✅ **Live bandwidth** → store hourly/daily rollups for trends
- ❌ **Every packet** → too much data, process in-memory

### **Historical Data** (Store for trends):

- 📈 **Daily summaries** → alerts count, bandwidth totals, top threats
- 📅 **Weekly/Monthly trends** → for dashboard charts
- 🗄️ **Important events** → critical alerts, security incidents
- 🗂️ **Audit logs** → user actions, configuration changes

### **Data Lifecycle**:

```sql
-- Auto-delete old data to manage storage
DELETE FROM network_sessions
WHERE session_start < NOW() - INTERVAL '7 days'
  AND status = 'closed';

-- Keep aggregated data longer
DELETE FROM network_metrics
WHERE timestamp < NOW() - INTERVAL '30 days';

-- Keep critical alerts forever
-- (no auto-deletion for security_alerts)
```

## 🔄 **Migration Plan**

### **Phase 1: Setup Supabase** (1 day)

1. Create Supabase project
2. Run schema migrations
3. Update backend to use PostgreSQL driver
4. Test basic CRUD operations

### **Phase 2: Real-time Migration** (2-3 days)

1. Replace polling with Supabase real-time subscriptions
2. Implement WebSocket fallback for older browsers
3. Add connection management (reconnect on disconnect)
4. Test with multiple users/resources

### **Phase 3: Performance Optimization** (1 day)

1. Add database indexes
2. Implement data partitioning for high-volume tables
3. Set up automated data cleanup jobs
4. Add monitoring/alerting

## 🛡️ **Security & Scalability**

### **Security**:

- 🔒 **Row Level Security** - users only see their own data
- 🔑 **JWT token validation** on every request
- 🚫 **Rate limiting** on API endpoints
- 📝 **Audit logging** for all security operations

### **Scalability**:

- ⚡ **Connection pooling** for database connections
- 📊 **Read replicas** for analytics queries
- 🗂️ **Data partitioning** for time-series data
- 🚀 **CDN caching** for static assets

### **Monitoring**:

- 📈 **Database performance** metrics
- 🔍 **Query optimization** with EXPLAIN ANALYZE
- 💾 **Memory/CPU usage** monitoring
- ⚠️ **Alert fatigue prevention** with smart filtering

## 💰 **Cost Estimation**

### **Supabase Pricing**:

- **Free tier**: 500MB database, 2GB bandwidth/month (good for development)
- **Pro tier**: $25/month - 8GB database, 250GB bandwidth (production ready)
- **Team tier**: $599/month - 100GB database, 2.5TB bandwidth (high scale)

### **Compared to self-hosted**:

- No server maintenance costs
- No DevOps overhead
- Built-in backups and monitoring
- Global edge locations

Would you like me to proceed with migrating your current SQLite setup to Supabase and implementing the real-time subscriptions?
