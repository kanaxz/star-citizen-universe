const mixer = require("./mixer")
const symbol = Symbol("BindedFunctions")

module.exports = mixer.mixin((baseClass) => {
  
  return class Bindeable extends baseClass {
    constructor(...args) {
      super(...args)
      this[symbol] = []
    }

    b(fn) {
      const existing = this[symbol].find((bf) => {
        return bf.initialFunction == fn;
      })
      if (existing)
        return existing.fn
      const bindedFunction = fn.bind(this)
      this[symbol].push({
        initialFunction: fn,
        fn: bindedFunction
      });
      return bindedFunction
    }
  }
})