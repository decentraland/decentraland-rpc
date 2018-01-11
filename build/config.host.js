import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: './src/host/index.ts',
  plugins: [
    typescript({
      verbosity: 2,
      clean: true,
      tsconfig: 'src/host/tsconfig.json',
      useTsconfigDeclarationDir: true
    }),
    resolve()
  ],
  output: [
    {
      file: 'dist/host/index.js',
      format: 'umd',
      name: 'DCLScriptingHost',
      sourcemap: true
    }
  ]
}
