// PM2 Ecosystem Configuration for High Performance
module.exports = {
  apps: [{
    name: 'erp-api',
    script: './dist/server.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster', // Enable cluster mode
    watch: false, // Disable in production
    max_memory_restart: '1G', // Restart if memory exceeds 1GB
    env: {
      NODE_ENV: 'production',
      PORT: 8001
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 8001
    },
    // Advanced PM2 features
    min_uptime: '10s', // Min uptime before considering app stable
    max_restarts: 10, // Max restarts within 1 minute
    autorestart: true, // Auto restart on crash
    cron_restart: '0 0 * * *', // Restart daily at midnight
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // Performance optimizations
    listen_timeout: 10000,
    kill_timeout: 5000,
    wait_ready: true,
    // Monitoring
    instance_var: 'INSTANCE_ID',
  }]
};
