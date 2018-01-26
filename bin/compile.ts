#!/usr/bin/env node

// This started as something different as it is right now. It became gulp. damnit

import * as webpack from 'webpack'
import * as globPkg from 'glob'
import * as rimraf from 'rimraf'
import * as fs from 'fs'
import { resolve, parse as parsePath, dirname, basename } from 'path'
import { TsConfigPathsPlugin, CheckerPlugin } from 'awesome-typescript-loader'

const isWatching = process.argv.some($ => $ === '--watch')

import { spawn } from 'child_process'

export function findConfigFile(
  baseDir: string,
  configFileName: string
): string | null {
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
  file: string
  outFile: string
  outDir: string
  tsconfig: string
  target?: 'web' | 'webworker' | 'node'
}

export async function compile(opt: ICompilerOptions) {
  return new Promise<webpack.Stats>((onSuccess, onError) => {
    const options: webpack.Configuration = {
      entry: opt.file,
      output: {
        filename: opt.outFile,
        path: opt.outDir,
        libraryTarget: 'umd'
      },

      resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ['.ts', '.tsx', '.js', '.json'],
        plugins: [
          new TsConfigPathsPlugin({ configFileName: opt.tsconfig }),
          new CheckerPlugin()
        ]
      },
      watch: isWatching,
      module: {
        rules: [
          // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
          {
            test: /\.tsx?$/,
            loader: 'awesome-typescript-loader',
            options: { configFileName: opt.tsconfig, silent: true }
          }
        ]
      },
      target: opt.target
    }

    const compiler = webpack(options)

    // compiler.apply(new ProgressPlugin({
    //   profile: false
    // }));

    if (!isWatching) {
      compiler.run((err, stats) => {
        if (err) {
          onError(err)
        } else {
          onSuccess(stats)
        }
      })
    } else {
      compiler.watch(
        { ignored: /node_modules/, aggregateTimeout: 1000 },
        (err, stats) => {
          if (stats.hasErrors() || stats.hasWarnings()) {
            console.log(
              stats.toString({
                colors: true,
                errors: true,
                warnings: true
              })
            )
          } else {
            console.log(
              'OK  ' + opt.file + ' -> ' + opt.outDir + '/' + opt.outFile
            )
          }

          if (!err) {
            onSuccess(stats)
          }
        }
      )
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
  file: string
  outFile?: string
  watch?: boolean
  target?: string
}) {
  if (opt.file.endsWith('.json')) {
    return processJson(opt.file)
  }

  const parsed = parsePath(opt.file)

  const configFile = findConfigFile(dirname(opt.file), 'tsconfig.json')

  if (!configFile) {
    throw new Error(`Unable to find a tsconfig.json file for ${opt.file}`)
  }

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

  const options: ICompilerOptions = {
    file: opt.file,
    outFile,
    outDir,
    tsconfig: configFile
  }

  console.log(`
compiling: ${opt.file}
  outFile: ${options.outFile}
   outDir: ${options.outDir}
 tsconfig: ${options.tsconfig}
  `)

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

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        await processFile({ ...$, file })
      }
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
