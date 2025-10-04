import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';

class WorkersPlugin {
  apply(compiler: webpack.Compiler) {
    const workersDir = path.resolve(compiler.context, 'src/main/workers');
    const appPackageJsonPath = path.resolve(compiler.context, 'release/app/package.json');

    if (!fs.existsSync(workersDir)) return;

    // Load native dependencies from the app package.json
    let nativeDependencies: string[] = [];
    if (fs.existsSync(appPackageJsonPath)) {
      try {
        const appPackageJson = JSON.parse(fs.readFileSync(appPackageJsonPath, 'utf8'));
        nativeDependencies = Object.keys(appPackageJson.dependencies || {});
      } catch (error) {
        console.error('Failed to parse app package.json:', error);
      }
    }

    const workerFiles = fs.readdirSync(workersDir);

    workerFiles.forEach((file) => {
      if (!file.endsWith('.ts') && !file.endsWith('.js')) return;

      // Create externals configuration for native dependencies
      const externals: Record<string, string> = {};
      nativeDependencies.forEach((dep) => {
        externals[dep] = `commonjs ${dep}`;
      });

      const workerConfig: webpack.Configuration = {
        ...baseConfig,
        entry: path.join(workersDir, file),
        target: 'node',
        output: {
          filename: `workers/${file.replace('.ts', '.js')}`,
          path: compiler.options.output.path,
        },
        mode: compiler.options.mode,
        devtool: compiler.options.devtool,
        resolve: {
          ...compiler.options.resolve,
          modules: [
            // Add the app node_modules to the resolve paths
            path.resolve(compiler.context, webpackPaths.appNodeModulesPath),
            ...(compiler.options.resolve?.modules || []),
          ],
        },
        module: compiler.options.module,
        externals,
        plugins: [
          new webpack.DefinePlugin({
            'process.type': '"worker"',
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
          }),
        ],
      };

      const childCompiler = webpack(workerConfig);

      compiler.hooks.make.tapAsync('WorkersPlugin', (compilation, callback) => {
        childCompiler.run((err, stats) => {
          if (err) {
            console.error(`Error compiling worker ${file}:`, err);
          }
          if (stats?.hasErrors()) {
            console.error(`Worker ${file} compilation errors:`, stats.toString({
              colors: true,
              chunks: false,
              modules: false,
            }));
          }

          childCompiler.close((closeErr) => {
            if (closeErr) {
              console.error(`Error closing compiler for ${file}:`, closeErr);
            }
            callback();
          });
        });
      });
    });
  }
}

export default WorkersPlugin;
