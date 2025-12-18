module.exports = {
  apps: [
    {
      name: 'saasxbarbershop',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
