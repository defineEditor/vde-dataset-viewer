import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import baseConfig from './webpack.config.base';

class WorkersPlugin {
  apply(compiler: webpack.Compiler) {
    const workersDir = path.resolve(compiler.context, 'src/main/workers');

    if (!fs.existsSync(workersDir)) return;

    const workerFiles = fs.readdirSync(workersDir);

    workerFiles.forEach((file) => {
      if (!file.endsWith('.ts') && !file.endsWith('.js')) return;

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
        resolve: compiler.options.resolve,
        module: compiler.options.module,
        plugins: [
          new webpack.DefinePlugin({
            'process.type': '"worker"',
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
