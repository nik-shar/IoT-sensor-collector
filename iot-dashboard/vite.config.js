import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'nikhildashboard18688.loca.lt'  // 👈 add your localtunnel host here
    ],
    host: '0.0.0.0', // 👈 makes Vite reachable from your network/tunnel
    port: 5173
  }
})
