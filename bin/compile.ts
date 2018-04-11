#!/usr/bin/env node

// This started as something different as it is right now. It became gulp. damnit

import * as webpack from 'webpack'
import * as globPkg from 'glob'
import * as rimraf from 'rimraf'
import * as fs from 'fs'
import { resolve, parse as parsePath, dirname, basename, relative } from 'path'
import { TsConfigPathsPlugin } from 'awesome-typescript-loader'
import { spawn } from 'child_process'
import { tmpdir } from 'os'

const isWatching = process.argv.some($ => $ === '--watch')
const instrumentCoverage = process.argv.some($ => $ === '--coverage') || process.env.NODE_ENV === 'coverage'
const isProduction = process.env.NODE_ENV !== 'development' && !isWatching && !instrumentCoverage

export function findConfigFile(baseDir: string, configFileName: string): string | null {
  let configFilePath = resolve(baseDir, configFileName)

  if (fs.existsSync(configFilePath)) {
    return configFilePath
  }

  if (baseDir.length === dirname(baseDir).length) {
    return null
  }

  return findConfigFile(resolve(baseDir, '../'), configFileName)
}

export interface ICompilerOptions {
  files: string[]
  outDir: string
  tsconfig: string
  target?: 'web' | 'webworker' | 'node'
  coverage?: boolean
  rootFolder: string
}

const webWorkerTransport = resolve(__dirname, '../lib/common/transports/WebWorker')

const entryPointWebWorker = (filename: string) => `
import { WebWorkerTransport } from ${JSON.stringify(webWorkerTransport)}
const imported = require(${JSON.stringify(filename)})

if (imported && imported.__esModule && imported['default']) {
  new imported['default'](WebWorkerTransport(self))
}
`

export async function compile(opt: ICompilerOptions) {
  return new Promise<webpack.Stats>((onSuccess, onError) => {
    let entry: webpack.Entry | string[] = opt.files

    const extensions = ['.ts', '.tsx', '.js', '.json']

    if (opt.target === 'webworker') {
      entry = entry.map($ => {
        const file = resolve(tmpdir(), Math.random().toString() + '.WebWorker.js')
        fs.writeFileSync(file, entryPointWebWorker($))
        return file
      })
    }

    entry = entry.reduce(
      (obj, $, $$) => {
        let name = relative(opt.rootFolder, opt.files[$$])
        extensions.forEach($ => {
          if (name.endsWith($)) {
            name = name.substr(0, name.length - $.length)
          }
        })
        let target = name
        if (target.endsWith('.js')) {
          target = target.substr(0, target.length - 3)
        }
        obj[target] = $
        return obj
      },
      {} as webpack.Entry
    )

    console.log(
      [
        `     files:`,
        ...Object.keys(entry).map(
          ($, $$) => `            (root)/${relative(opt.rootFolder, opt.files[$$])} -> (outDir)/${$}.js`
        )
      ].join('\n')
    )

    const options: webpack.Configuration = {
      entry,
      mode: isProduction ? 'production' : 'development',
      optimization: {
        nodeEnv: isProduction ? 'production' : 'development',
        namedModules: !isProduction,
        minimize: isProduction
      },
      output: {
        path: opt.outDir,
        libraryTarget: opt.target === 'webworker' ? 'this' : 'umd'
      },

      resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions,
        plugins: [new TsConfigPathsPlugin({ configFileName: opt.tsconfig })]
      },
      watch: isWatching,
      module: {
        rules: [
          {
            test: /\.(jpe?g|png|gif|svg)$/i,
            use: [
              {
                loader: 'url-loader',
                options: {
                  limit: 512000
                }
              }
            ]
          },
          // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
          {
            test: /\.tsx?$/,
            loader: 'awesome-typescript-loader',
            options: {
              configFileName: opt.tsconfig,
              silent: true
            }
          }
        ]
      },
      target: opt.target
    }

    if (opt.coverage) {
      // tslint:disable-next-line:semicolon
      ;(options.module as any).rules.push({
        test: /\.[jt]sx?$/,
        use: {
          loader: 'istanbul-instrumenter-loader',
          options: { esModules: true, sourceMaps: true }
        },
        enforce: 'post',
        exclude: /node_modules|\.spec\.js$/
      })
    }

    const compiler = webpack(options)

    if (!isWatching) {
      compiler.run((err, stats) => {
        if (err) {
          onError(err)
        } else {
          onSuccess(stats)
        }
      })
    } else {
      compiler.watch({ ignored: /node_modules/, aggregateTimeout: 1000 }, (err, stats) => {
        if (stats.hasErrors() || stats.hasWarnings()) {
          console.log(
            stats.toString({
              colors: true,
              errors: true,
              warnings: true
            })
          )
        } else {
          console.log('OK ' + opt.outDir)
        }

        if (!err) {
          onSuccess(stats)
        }
      })
    }
  })
}

export async function tsc(tsconfig: string) {
  const tscLocation = require.resolve('typescript/bin/tsc')

  console.log(
    `
    Executing "tsc -p ${basename(tsconfig)}" in ${dirname(tsconfig)}
  `.trim()
  )

  const args = ['-p', basename(tsconfig)]

  if (isWatching) {
    args.push('--watch')
  }

  const childProcess = spawn(tscLocation, args, {
    cwd: dirname(tsconfig)
  })

  if (isWatching) {
    return true
  }

  let resolve: (x: any) => any = a => void 0
  let reject: (x: any) => any = a => void 0

  const semaphore = new Promise((ok, err) => {
    resolve = ok
    reject = err
  })

  childProcess.stdout.on('data', data => {
    console.log(`tsc stdout: ${data}`)
  })

  childProcess.stderr.on('data', data => {
    console.log(`tsc stderr: ${data}`)
  })

  childProcess.on('close', exitCode => {
    if (exitCode) {
      reject(exitCode)
    } else {
      resolve(exitCode)
    }
  })

  await semaphore
}

export async function processFile(opt: {
  file?: string
  files?: string[]
  outFile?: string
  watch?: boolean
  target?: string
  coverage?: boolean
}) {
  const baseFile = opt.file || (opt.files && opt.files[0]) || ''

  if (!baseFile) {
    throw new Error(`Unable to find a file to compile`)
  }

  if (baseFile.endsWith('.json')) {
    return processJson(baseFile)
  }

  const parsed = parsePath(baseFile)

  const configFile = findConfigFile(dirname(baseFile), 'tsconfig.json')

  if (!configFile) {
    throw new Error(`Unable to find a tsconfig.json file for ${opt.file}`)
  }

  const rootFolder = dirname(configFile)

  const parsedTsConfig = require(configFile)

  let outFile = opt.outFile
    ? resolve(process.cwd(), opt.outFile)
    : parsedTsConfig.compilerOptions.outFile
      ? resolve(dirname(configFile), parsedTsConfig.compilerOptions.outFile)
      : parsed.name + '.js'

  const outDir = parsedTsConfig.compilerOptions.outDir
    ? resolve(dirname(configFile), parsedTsConfig.compilerOptions.outDir)
    : dirname(outFile)

  if (outFile.startsWith(outDir)) {
    outFile = outFile.replace(outDir + '/', '')
  }

  const coverage = !isWatching && (opt.coverage || instrumentCoverage)

  const options: ICompilerOptions = {
    files: opt.files || [opt.file as string],
    outDir,
    tsconfig: configFile,
    coverage: coverage,
    target: (opt.target as any) || 'web',
    rootFolder
  }

  console.log(`
      root: ${options.rootFolder}
    outDir: ${options.outDir}
   options: { coverage: ${coverage}, production: ${isProduction}, watch: ${isWatching} }`)

  const result = await compile(options)

  if (result.hasErrors() || result.hasWarnings()) {
    console.log(
      result.toString({
        assets: true,
        colors: true,
        entrypoints: true,
        env: true,
        errors: true,
        publicPath: true
      })
    )
  }
}

export async function glob(path: string) {
  return new Promise<string[]>((onSuccess, onFailure) => {
    globPkg(path, { absolute: true }, (err, values) => {
      if (err) {
        onFailure(err)
      } else {
        onSuccess(values)
      }
    })
  })
}

export async function cli(args: string[]) {
  const files = await glob(process.argv[2])

  await Promise.all(files.map($ => processFile({ file: $, outFile: args[3] })))
}

export async function processJson(file: string) {
  const config: any[] = require(file)

  if (!config || !(config instanceof Array)) {
    throw new Error(`Config file ${file} is not a valid sequence of steps`)
  }

  if (config.length === 0) {
    throw new Error(`Config file ${file} describes no compilation steps`)
  }

  for (let i = 0; i < config.length; i++) {
    const $ = config[i]

    if ($.kind === 'RM') {
      if (!isWatching) {
        // delete a folder
        console.log(
          `
          Deleting folder: ${$.path}
        `.trim()
        )
        rimraf.sync($.path)
      }
    } else if ($.kind === 'Webpack') {
      // compile TS
      const files = await glob($.file)

      await processFile({ ...$, files })
    } else if ($.kind === 'TSC') {
      if (!$.config) {
        throw new Error(`Missing config in: ${JSON.stringify($, null, 2)}`)
      }

      await tsc($.config)
    } else {
      console.error(`Unknown compilation step ${JSON.stringify($, null, 2)}`)
    }
  }
}

cli(process.argv)
  .then(() => {
    if (isWatching) {
      console.log('The compiler is watching file changes...')
      process.stdin.resume()
    }
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

process.on('unhandledRejection', e => {
  throw e
})
