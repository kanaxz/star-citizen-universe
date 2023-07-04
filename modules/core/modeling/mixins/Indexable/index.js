const mixer = require("../../../mixer");
const Equalable = require("../../../mixins/Equalable");
const Indexes = require('./Indexes')

module.exports = mixer.mixin([Equalable], (base) => {
  return class Indexable extends base {
    static define(definition) {
      super.define(definition)
      this.indexes = new Indexes(this)
      return this
    }

    static equals(value1, value2) {
      return value1.anyUniqueIndexMatch(value2)
    }

    anyUniqueIndexMatch(object) {
      return this.constructor.indexes
        .filter((index) => index.unique)
        .find((index) => {
          const matchingProperties = index.properties.filter((p) => this[p] === object[p] && this[p] != undefined)
          return matchingProperties.length === index.properties.length
        })
    }

    getFirstUniqueIndex() {
      const indexes = this.constructor.indexes.filter((i) => i.unique)
      for (const index of indexes) {
        const values = this.getIndex(index)
        if (values) {
          return values
        }
      }
      return null
    }

    getIndex(index) {
      if (typeof index === 'string') {
        index = this.constructor.indexes.find((i) => i.name === index)
      }

      if (!index) {
        throw new Error('Index not found')
      }

      const values = index.properties.reduce((acc, p) => {
        const value = this[p]
        if (value != null) {
          acc[p] = this[p]
        }
        return acc
      }, {})

      if (Object.keys(values).length !== index.properties.length) {
        return null
      }
      return values
    }
  }
})

