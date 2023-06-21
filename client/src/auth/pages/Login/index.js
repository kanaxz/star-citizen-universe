const Page = require('hedera/page/Page')
const Empty = require('@app/layouts/Empty')
const template = require('./template.html')
const auth = require('../../service')
const navigator = require('@app/navigator')

require('./style.scss')

module.exports = class Home extends Page {
  async onSubmit() {
    console.log('submitting')
    const inputs = [...this.form.querySelectorAll('input')]
    const values = inputs.reduce((acc, input)=>{
      acc[input.name] = input.value
      return acc
    }, {})

    await auth.login(values)
    await navigator.navigate('/')
  }
}.define({
  name: 'login-page',
  template,
  layout: Empty,
})