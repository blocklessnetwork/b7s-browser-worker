import { resolve } from 'path'

export default {
    build: {
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'b7s.browser',
            // the proper extensions will be added
            fileName: 'b7s-browser-node',
        },
        target: 'es2022'
    },
    optimizeDeps: {
      esbuildOptions: { target: 'es2022', supported: { bigint: true } }
    },
    server: {
      open: true
    }
  }
    