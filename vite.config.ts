import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/ls.ts'),
      name: 'ls',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'localstorage-slim.mjs';
        if (format === 'cjs') return 'localstorage-slim.cjs';
        return 'localstorage-slim.js';
      },
    },
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true,
  },
  plugins: [
    dts({
      include: ['src'],
      copyDtsFiles: true,
    }),
  ],
});
