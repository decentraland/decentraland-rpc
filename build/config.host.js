import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: './src/host/index.ts',
  plugins: [
    typescript({
      verbosity: 2,
      clean: true,
      tsconfig: 'src/host/tsconfig.json'
    }),
    resolve()
  ],
  output: [
    {
      file: 'dist/umd/bundle.js',
      format: 'umd',
      name: 'DCLScriptingHost',
      sourcemap: true
    }
  ]
}
