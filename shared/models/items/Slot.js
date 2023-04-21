const { typeOf } = require('../../core/modeling/utils')
const Type = require('../../core/modeling/Type')
const ShipComponent = require('./ShipComponent')

module.exports = class Slot extends Type.of(ShipComponent) {

}
  .properties({
    name: 'string',
    size: 'number',
  })