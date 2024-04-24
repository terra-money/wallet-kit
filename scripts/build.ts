import path from 'path'
import { build } from 'rocket-punch'
import packages from '../.packages.json'

const { $schema, ...entry } = packages

export const cwd = path.resolve(__dirname, '..')

build({
  cwd,
  entry: { ...entry },
  transformPackageJson: (packageName) => (computedPackageJson) => {
    const {
      dependencies = {},
      peerDependencies = {},
      peerDependenciesMeta = {},
    } = computedPackageJson

    if ('react' in dependencies) {
      peerDependencies['react'] = dependencies['react']
      delete dependencies['react']
    }

    if ('react-dom' in dependencies) {
      peerDependencies['react-dom'] = dependencies['react-dom']
      delete dependencies['react-dom']
    }

    if ('react-router-dom' in dependencies) {
      peerDependencies['react-router-dom'] = dependencies['react-router-dom']
      delete dependencies['react-router-dom']
    }

    if ('styled-components' in dependencies) {
      peerDependencies['styled-components'] = dependencies['styled-components']
      delete dependencies['styled-components']
    }

    if ('rxjs' in dependencies) {
      dependencies['rxjs'] = '^7.0.0'
    }

    if ('@terra-money/feather.js' in dependencies) {
      //peerDependencies['@terra-money/feather.js'] = dependencies['@terra-money/feather.js'];
      delete dependencies['@terra-money/feather.js']
    }

    if ('@cosmjs/amino' in dependencies) {
      peerDependencies['@cosmjs/amino'] = dependencies['@cosmjs/amino']
      delete dependencies['@cosmjs/amino']
    }

    if ('axios' in dependencies) {
      peerDependencies['axios'] = dependencies['axios']
      delete dependencies['axios']
    }

    computedPackageJson.dependencies =
      Object.keys(dependencies).length > 0 ? dependencies : undefined

    computedPackageJson.peerDependencies =
      Object.keys(peerDependencies).length > 0 ? peerDependencies : undefined

    computedPackageJson.peerDependenciesMeta =
      Object.keys(peerDependenciesMeta).length > 0
        ? peerDependenciesMeta
        : undefined

    return computedPackageJson
  },
})
