import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // The dataset is inlined into the bundle so consumers need no runtime fetch
  // and no JSON loader config. It is data-only, so it compresses well.
  loader: { '.json': 'json' },
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
});
