-- EDoS Detection Dashboard - Database Schema Design
-- Designed for Supabase (PostgreSQL) with real-time capabilities

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ================================
-- CORE USER MANAGEMENT
-- ================================

-- Organizations (for multi-tenancy)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    plan_type VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
    max_resources INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'analyst', -- admin, analyst, viewer
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for JWT management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    alert_threshold VARCHAR(20) DEFAULT 'medium',
    dashboard_layout JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- CLOUD RESOURCES MANAGEMENT
-- ================================

-- Cloud providers
CREATE TABLE cloud_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- AWS, Azure, GCP, etc.
    logo_url TEXT,
    api_endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resource types
CREATE TABLE resource_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES cloud_providers(id),
    name VARCHAR(100) NOT NULL, -- VM, Container, Database, etc.
    icon VARCHAR(50),
    monitoring_metrics JSONB DEFAULT '[]', -- What metrics this resource type supports
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User's cloud resources
CREATE TABLE cloud_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES cloud_providers(id),
    resource_type_id UUID REFERENCES resource_types(id),
    name VARCHAR(255) NOT NULL,
    identifier VARCHAR(500) NOT NULL, -- AWS instance ID, Azure resource ID, etc.
    region VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, error
    connection_config JSONB DEFAULT '{}', -- API keys, endpoints, etc.
    metadata JSONB DEFAULT '{}', -- Any additional resource-specific data
    is_monitoring_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, identifier) -- Prevent duplicate resources per user
);

-- ================================
-- SECURITY ALERTS SYSTEM
-- ================================

-- Alert categories
CREATE TABLE alert_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color_code VARCHAR(7), -- Hex color for UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security alerts
CREATE TABLE security_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES cloud_resources(id) ON DELETE CASCADE,
    category_id UUID REFERENCES alert_categories(id),
    severity VARCHAR(20) NOT NULL, -- critical, high, medium, low
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    source_ip INET,
    target_ip INET,
    target_port INTEGER,
    detection_method VARCHAR(100),
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    status VARCHAR(20) DEFAULT 'new', -- new, acknowledged, resolved, false_positive
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    raw_data JSONB DEFAULT '{}', -- Original detection data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert comments for collaboration
CREATE TABLE alert_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES security_alerts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- SECURITY LOGS
-- ================================

-- Security logs (high volume, partitioned by date)
CREATE TABLE security_logs (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES cloud_resources(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    log_level VARCHAR(20) NOT NULL, -- debug, info, warn, error, critical
    source VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Primary key must include partition column for partitioned tables
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions (example for current month)
CREATE TABLE security_logs_2025_11 PARTITION OF security_logs
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- ================================
-- NETWORK MONITORING DATA
-- ================================

-- Network traffic sessions (for 3D globe)
CREATE TABLE network_sessions (
    id UUID DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES cloud_resources(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    source_ip INET NOT NULL,
    source_port INTEGER,
    source_country VARCHAR(2),
    source_lat DECIMAL(10, 8),
    source_lon DECIMAL(11, 8),
    destination_ip INET NOT NULL,
    destination_port INTEGER NOT NULL,
    destination_country VARCHAR(2),
    destination_lat DECIMAL(10, 8),
    destination_lon DECIMAL(11, 8),
    protocol VARCHAR(10) NOT NULL, -- TCP, UDP, ICMP
    service_name VARCHAR(100), -- HTTP, SSH, FTP, etc.
    bytes_transferred BIGINT DEFAULT 0,
    packets_count INTEGER DEFAULT 0,
    session_start TIMESTAMP WITH TIME ZONE NOT NULL,
    session_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active', -- active, closed, timeout
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Primary key must include partition column for partitioned tables
    PRIMARY KEY (id, session_start)
) PARTITION BY RANGE (session_start);

-- Current month partition
CREATE TABLE network_sessions_2025_11 PARTITION OF network_sessions
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Real-time network metrics (aggregated per minute)
CREATE TABLE network_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES cloud_resources(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    bandwidth_in BIGINT DEFAULT 0, -- bytes per minute
    bandwidth_out BIGINT DEFAULT 0,
    packets_in INTEGER DEFAULT 0,
    packets_out INTEGER DEFAULT 0,
    connections_active INTEGER DEFAULT 0,
    connections_new INTEGER DEFAULT 0,
    protocol_breakdown JSONB DEFAULT '{}', -- {"tcp": 1024, "udp": 512}
    top_services JSONB DEFAULT '[]', -- [{"service": "http", "bytes": 1024}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Network services/ports
CREATE TABLE network_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES cloud_resources(id) ON DELETE CASCADE,
    port INTEGER NOT NULL,
    protocol VARCHAR(10) NOT NULL,
    service_name VARCHAR(100),
    process_name VARCHAR(255),
    process_id INTEGER,
    status VARCHAR(20) DEFAULT 'listening', -- listening, established, closed
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(resource_id, port, protocol)
);

-- System metrics (aggregated system performance data)
CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES cloud_resources(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    cpu_usage DECIMAL(5,2), -- percentage (0-100.00)
    memory_usage DECIMAL(5,2), -- percentage (0-100.00)
    disk_usage DECIMAL(5,2), -- percentage (0-100.00)
    network_throughput BIGINT, -- bytes per minute
    active_connections INTEGER,
    response_time DECIMAL(10,3), -- milliseconds
    error_rate DECIMAL(5,2), -- percentage (0-100.00)
    uptime_seconds BIGINT,
    metadata JSONB DEFAULT '{}', -- Additional metrics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- HISTORICAL DATA AGGREGATION
-- ================================

-- Daily summaries for trends (pre-aggregated for performance)
CREATE TABLE daily_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES cloud_resources(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_alerts INTEGER DEFAULT 0,
    critical_alerts INTEGER DEFAULT 0,
    total_bandwidth BIGINT DEFAULT 0,
    unique_connections INTEGER DEFAULT 0,
    top_threats JSONB DEFAULT '[]',
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(resource_id, date)
);

-- ================================
-- WEBSOCKET SUBSCRIPTIONS
-- ================================

-- Track active WebSocket subscriptions
CREATE TABLE websocket_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    connection_id VARCHAR(255) NOT NULL,
    channel_type VARCHAR(50) NOT NULL, -- alerts, network, logs, metrics
    resource_filters JSONB DEFAULT '[]', -- Which resources to monitor
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- User and auth indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Resource indexes
CREATE INDEX idx_cloud_resources_user ON cloud_resources(user_id);
CREATE INDEX idx_cloud_resources_status ON cloud_resources(status);

-- Alert indexes (critical for performance)
CREATE INDEX idx_alerts_user_status ON security_alerts(user_id, status);
CREATE INDEX idx_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_alerts_created ON security_alerts(created_at DESC);
CREATE INDEX idx_alerts_resource ON security_alerts(resource_id);

-- Log indexes (for high volume data)
CREATE INDEX idx_security_logs_resource_time ON security_logs(resource_id, timestamp DESC);
CREATE INDEX idx_security_logs_level ON security_logs(log_level);

-- Network indexes
CREATE INDEX idx_network_sessions_resource_time ON network_sessions(resource_id, session_start DESC);
CREATE INDEX idx_network_metrics_resource_time ON network_metrics(resource_id, timestamp DESC);
CREATE INDEX idx_network_services_resource ON network_services(resource_id);

-- System metrics indexes
CREATE INDEX idx_system_metrics_resource_time ON system_metrics(resource_id, timestamp DESC);
CREATE INDEX idx_system_metrics_timestamp ON system_metrics(timestamp DESC);

-- WebSocket indexes
CREATE INDEX idx_websocket_user_active ON websocket_subscriptions(user_id, is_active);
CREATE INDEX idx_websocket_connection ON websocket_subscriptions(connection_id);

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS on all user-data tables
ALTER TABLE cloud_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (users can only see their own data)
CREATE POLICY "Users can view own resources" ON cloud_resources
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own alerts" ON security_alerts
    FOR SELECT USING (user_id = auth.uid());

-- ================================
-- FUNCTIONS FOR REAL-TIME UPDATES
-- ================================

-- Function to notify on new alerts
CREATE OR REPLACE FUNCTION notify_new_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify via PostgreSQL NOTIFY
    PERFORM pg_notify('new_alert', json_build_object(
        'user_id', NEW.user_id,
        'alert_id', NEW.id,
        'severity', NEW.severity,
        'title', NEW.title
    )::text);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for real-time alert notifications
CREATE TRIGGER trigger_new_alert
    AFTER INSERT ON security_alerts
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_alert();

-- ================================
-- SAMPLE DATA INSERTION
-- ================================

-- Insert cloud providers
INSERT INTO cloud_providers (name, api_endpoint) VALUES 
    ('AWS', 'https://ec2.amazonaws.com'),
    ('Azure', 'https://management.azure.com'),
    ('Google Cloud', 'https://compute.googleapis.com');

-- Insert alert categories
INSERT INTO alert_categories (name, description, color_code) VALUES 
    ('Intrusion Detection', 'Suspicious access attempts', '#dc2626'),
    ('Malware Detection', 'Malicious software detected', '#ea580c'),
    ('Data Exfiltration', 'Unusual data transfer patterns', '#d97706'),
    ('Network Anomaly', 'Abnormal network behavior', '#059669');
