// PM2 ecosystem configuration for running both servers
module.exports = {
  apps: [
    {
      name: 'rbp-backend',
      script: './server/index.js',
      cwd: './',
      watch: ['./server'],
      ignore_watch: ['node_modules'],
      env: {
        NODE_ENV: 'development',
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'rbp-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './web',
      watch: false, // Vite handles its own hot reload
      env: {
        NODE_ENV: 'development',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
