#!/usr/bin/env node

import webpack = require('webpack');
import ProgressPlugin = require('webpack/lib/ProgressPlugin');
import glob = require('glob');
import { promisify, callbackify } from 'util';
import { resolve, parse as parsePath, dirname, relative } from 'path';
import { TsConfigPathsPlugin } from 'awesome-typescript-loader';

import fs = require('fs');

export function findConfigFile(baseDir: string, configFileName: string) {
  let configFilePath = resolve(baseDir, configFileName);

  if (fs.existsSync(configFilePath)) {
    return configFilePath;
  }

  if (baseDir.length === dirname(baseDir).length) {
    return null;
  }

  return findConfigFile(resolve(baseDir, "../"), configFileName);
}

export interface ICompilerOptions {
  file: string;
  output: string;
  outputPath: string;
  tsconfig: string;
}



export async function compile(opt: ICompilerOptions) {
  return new Promise<webpack.Stats>((onSuccess, onError) => {
    const compiler = webpack({
      entry: opt.file,
      output: {
        filename: opt.output,
        path: opt.outputPath,
        libraryTarget: 'umd'
      },

      resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"],
        plugins: [
          new TsConfigPathsPlugin({ configFileName: opt.tsconfig })
        ]
      },

      module: {
        rules: [
          // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
          { test: /\.tsx?$/, loader: "awesome-typescript-loader", options: { configFileName: opt.tsconfig } }
        ]
      }
    });

    // compiler.apply(new ProgressPlugin({
    //   profile: false
    // }));

    compiler.run((err, stats) => {
      if (err) {
        onError(err);
      } else {
        onSuccess(stats);
      }
    });
  });
}

export async function cli(args: string[]) {
  const files = await new Promise<string[]>((onSuccess, onFailure) => {
    glob(process.argv[2], { absolute: true }, (err, values) => {
      if (err) {
        onFailure(err);
      } else {
        onSuccess(values);
      }
    });
  });

  const parsedFilePaths = await Promise.all(files.map(parsePath));

  const configFiles = await Promise.all(files.map((file, index) => {
    const parsed = parsedFilePaths[index];
    const outFile = parsed.name + '-out.js';

    const configFile = findConfigFile(dirname(file), 'tsconfig.json');

    if (!configFile) {
      throw new Error(`Unable to find a tsconfig.json file for ${file}`);
    }

    return configFile
  }))
  const configs = await Promise.all(configFiles.map(file => require(file)))

  const outputFiles = await Promise.all(configs.map((config, index) => {
    const configFile = configFiles[index]
    return args[3]
        ? resolve(process.cwd(), args[3])
        : config.compilerOptions.outFile
          ? resolve(dirname(configFile), config.compilerOptions.outFile)
          : (parsedFilePaths[index].name + '.js');
  }));

  const options = await Promise.all(configs.map((config, index) => {
    const outputPath =
      config.compilerOptions.outDir
        ? resolve(dirname(configFiles[index]), config.compilerOptions.outDir)
        : dirname(outputFiles[index]);

    if (outputFiles[index].startsWith(outputPath)) {
      outputFiles[index] = outputFiles[index].replace(outputPath + '/', '');
    }

    return {
      file: files[index],
      output: outputFiles[index],
      outputPath,
      tsconfig: configFiles[index]
    };
  }));

  await Promise.all(options.map(async (option, index) => {
    console.log(`
compiling: ${option.file}
  outFile: ${option.output}
   outDir: ${option.outputPath}
 tsconfig: ${option.tsconfig}
    `.trim());

    const result = await compile(option);

    if (result.hasErrors() || result.hasWarnings()) {
      console.log(result.toString({
        assets: true,
        colors: true,
        entrypoints: true,
        env: true,
        errors: true,
        publicPath: true
      }));
    }
  }));
}

cli(process.argv).catch(err => {
  console.error(err);
  process.exit(1);
});
