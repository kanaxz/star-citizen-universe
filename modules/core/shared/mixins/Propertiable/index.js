const mixer = require("../../mixer");
const Destroyable = require("../Destroyable")
const Eventable = require('../Eventable')
const Properties = require('./Properties')

const mixin = mixer.mixin([Eventable, Destroyable], (base) => {
  return class Propertiable extends base {
    static sanitizeProperty(property) {

    }

    defineProperty(property) {
      Object.defineProperty(this, property.name, {
        get: function () {
          return this.values[property.name]
        },
        set: async function (newValue) {
          //console.log('setting', property, newValue)
          if (this[Destroyable.symbol]) { return }
          if (newValue === this[property.name]) { return }
          await this.setPropertyValue(property, newValue)
        },
        enumerable: true,
      })
    }

    static define(definition) {
      super.define(definition)
      this.properties = new Properties(this)
      return this
    }

    constructor(...args) {
      super(...args)
      const properties = this.constructor.properties
      if (properties) {
        try {
          properties.forEach((p) => this.defineProperty(p))
        } catch (err) {
          console.error(this, [...properties])
          throw err
        }
      }

      Object.defineProperty(this, 'values', { enumerable: false, writable: true, value: {} })
    }

    async set(values) {
      await Promise.all(Object.entries(values).map(async ([k, v]) => {
        const property = this.constructor.properties.find((p) => p.name === k)
        await this.setPropertyValue(property, v)
      }))
    }

    async propertyChanged(property, value, oldValue) {
      await Promise.all([
        this.emit('propertyChanged', [property, value, oldValue]),
        this.emit(`propertyChanged:${property.name}`, [value, oldValue])
      ])
    }

    async setPropertyValue(property, value) {
      if (!this.values) {
        this.values = {}
      }
      const oldValue = this.values[property.name]
      this.values[property.name] = value
      await this.propertyChanged(property, value, oldValue)
    }

    destroy() {
      this.constructor.properties.forEach((p) => {
        this[p.name] = null
      })
      super.destroy()
    }
  }
})

module.exports = mixin