
const registries = {

}

const register = (type, name, component, load) => {
  if (!registries[name]) {
    registries[name] = []
  }
  registries[name].push({
    type,
    component,
    load
  })
}

const get = (type, name) => {
  const registry = registries[name]
  const find = registry.find((r) => r.type === type)
  if (find) {
    return find.component
  }

  const parents = type.definition?.parents
  if (!parents) { return null }
  for (const parent of parents) {
    const parentFind = get(parent, name)
    if (parentFind) {
      return parentFind
    }
  }
  throw new Error(`Could not find component ${card} for ${type.name}`)
}

module.exports = {
  register,
  get,
}