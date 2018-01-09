import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: './src/client/index.ts',
  plugins: [
    typescript({
      verbosity: 2,
      clean: true,
      tsconfig: 'src/client/tsconfig.json'
    }),
    resolve()
  ],
  output: [
    {
      file: 'dist/umd/bundle.js',
      format: 'umd',
      name: 'DCLScriptingClient',
      sourcemap: true
    }
  ]
}
