const mixer = require('core/mixer')
const Branch = require('core/modeling/types/Branch')
const GameModel = require('../GameModel')
const Organization = require('../Organization')
const HasMany = require('core/modeling/types/HasMany')

class Entity extends mixer.extends(GameModel) {

}

Entity
  .define({
    name: 'entity',
    pluralName: 'entities',
    abstract: true,
    root: true,
  })

  .properties({
    organization: Organization,
    parent: Entity,
    parents: {
      type: Branch.of(Entity),
      on: 'parent',
    },

    children: {
      type: HasMany.of(Entity),
      on: 'parent',
    }

  })


module.exports = Entity
