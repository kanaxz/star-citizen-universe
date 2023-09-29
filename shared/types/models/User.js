const { Model, String } = require('core/modeling/types')
const Roles = require('../objects/Roles')

const ownershipRule = (user, currentUser) => {
  return user._id === currentUser._id || currentUser.roles.admin
}

module.exports = class User extends Model {

}
  .define({
    name: 'user',
    pluralName: 'users',
  })
  .indexes({
    username: {
      properties: ['username'],
      unique: true,
    }
  })
  .controllers({
    update: {
      check({ user }) { return ownershipRule(this, user) }
    },
    delete: {
      check({ user }) { return ownershipRule(this, user) }
    }
  })
  .properties({
    username: String,
    password: String,
    roles: Roles
  })