require('core')
const navigator = require('./navigator')
const pageMiddleware = require('@core/page/middleware')

require('@core')
require('./notifications/List')
require('./auth')
require('./form')
require('./locations')
require('./main')
require('./affiliation')
require('./modeling')
require('./style.scss')
require('./api')


const config = require('./config')

console.log({ config })

const start = async () => {
  console.log('Starting app')
  const app = {}
  const root = document.getElementById("root")
  await root.start(app, { navigator })
  navigator.root.use(pageMiddleware(app.presenter))
  await navigator.start()
}

start()