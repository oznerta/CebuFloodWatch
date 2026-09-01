const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Extend watchFolders to include workspace root
config.watchFolders = Array.from(
  new Set([...(config.watchFolders || []), workspaceRoot])
);

// 2. Ensure Metro resolves modules in mobile's node_modules first
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve react, react-dom, and react-native strictly to mobile's node_modules
// This eliminates duplicate React versions in the monorepo (React 18 in web vs React 19 in mobile).
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    const subpath = moduleName === 'react' ? '' : moduleName.replace(/^react\//, '');
    return {
      filePath: subpath
        ? require.resolve(`react/${subpath}`, { paths: [projectRoot] })
        : require.resolve('react', { paths: [projectRoot] }),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'react-dom' || moduleName.startsWith('react-dom/')) {
    const subpath = moduleName === 'react-dom' ? '' : moduleName.replace(/^react-dom\//, '');
    return {
      filePath: subpath
        ? require.resolve(`react-dom/${subpath}`, { paths: [projectRoot] })
        : require.resolve('react-dom', { paths: [projectRoot] }),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'react-native' || moduleName.startsWith('react-native/')) {
    const subpath = moduleName === 'react-native' ? '' : moduleName.replace(/^react-native\//, '');
    return {
      filePath: subpath
        ? require.resolve(`react-native/${subpath}`, { paths: [projectRoot] })
        : require.resolve('react-native', { paths: [projectRoot] }),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
