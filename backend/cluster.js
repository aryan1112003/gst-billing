/**
 * Node.js Cluster Mode for High Performance
 * This file enables your application to use all CPU cores
 * 
 * Usage: node backend/cluster.js
 */

const cluster = require('cluster');
const os = require('os');

const numCPUs = os.cpus().length;

if (cluster.isMaster || cluster.isPrimary) {
  console.log(`\n🚀 Master process ${process.pid} is running`);
  console.log(`📊 CPU Cores available: ${numCPUs}`);
  console.log(`🔄 Forking ${numCPUs} worker processes...\n`);

  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    console.log(`✅ Worker ${i + 1}/${numCPUs} started (PID: ${worker.process.pid})`);
  }

  console.log(`\n🎉 All ${numCPUs} workers started successfully!`);
  console.log(`💪 Your application can now handle ${numCPUs}x more traffic!\n`);

  // Handle worker exit and restart
  cluster.on('exit', (worker, code, signal) => {
    console.log(`\n⚠️  Worker ${worker.process.pid} died (${signal || code})`);
    console.log(`🔄 Starting a new worker...`);
    const newWorker = cluster.fork();
    console.log(`✅ New worker started (PID: ${newWorker.process.pid})\n`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n📴 SIGTERM received. Shutting down gracefully...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });

  process.on('SIGINT', () => {
    console.log('\n📴 SIGINT received. Shutting down gracefully...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
    process.exit(0);
  });

} else {
  // Workers share the TCP connection
  require('./dist/server.js');
  console.log(`👷 Worker ${process.pid} is ready to handle requests`);
}
