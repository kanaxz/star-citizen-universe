const Virtual = require('../Virtual')

module.exports = class Exit extends Virtual {
  constructor(el, value) {
    super(el)
    const [callback, when] = value.split(/ when /)
    this.el.setAttribute(':v.exit.callback', `()=>${callback}`)
    this.el.setAttribute(':v.exit.when', when)
    this.listen(window, 'click', this.onWindowClicked, true)
    this.listen(window, 'keydown', this.onWindowKeyDown, true)
  }

  onInit() {
    if (this.when === undefined) {
      this.when = true
    }
  }

  onWindowKeyDown(e) {
    if (e.key === "Escape") {
      this.trigger()
    }
  }

  onWindowClicked(e) {
    if (!this.el.contains(e.target)) {
      this.trigger()
    }
  }

  trigger() {
    if (!this.when) { return }
    this.callback()
  }
}
  .define({
    name: 'exit'
  })
  .properties({
    callback: 'any',
  })
