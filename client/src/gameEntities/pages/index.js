const navigator = require('@app/navigator')
const api = require('@app/api')
const { GameEntity, Entity } = require('shared/models')

const childs = GameEntity
  .getAllChilds()
  .filter((c) => !c.definition.abstract)

const childsNames = childs.map((m) => m.definition.name)
const showRegex = new RegExp(`/(${childsNames.join('|')})/(.*)`)
console.log({ showRegex })
navigator.route(showRegex, async (req, res) => {
  console.log('match', req.match)
  const entityName = req.match[1]
  const code = req.match[2]
  console.log({ entityName, code })
  const entityType = childs.find((c) => c.definition.name === entityName)
  const entity = new entityType({
    code,
  })

  await entity.load()
  await res.page(import('./Show'), { entity })
})