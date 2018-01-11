import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: './src/client/index.ts',
  plugins: [
    typescript({
      verbosity: 2,
      clean: true,
      tsconfig: 'src/client/tsconfig.json',
      useTsconfigDeclarationDir: true
    }),
    resolve()
  ],
  output: [
    {
      file: 'dist/client/index.js',
      format: 'es',
      name: 'DCLScriptingClient',
      sourcemap: true
    }
  ]
}
