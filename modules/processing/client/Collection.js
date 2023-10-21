const axios = require('axios')
const Context = require('modeling-client/Context')
const Models = require('./Models')

const getArgs = (args) => {
  return args.filter((arg) => !(arg instanceof Context))
}

module.exports = class Collection {
  constructor(values) {
    Object.assign(this, values)
    this.instances = []
  }

  hold(model) {
    if (this.autoHold) {
      model.hold(this)
      this.instances.push(model)
    }
  }

  releaseAll() {
    this.instances.forEach((instance) => instance.release(this))
    this.instances = []
  }

  async request(action, body, options = {}) {

    //console.log(`Requesting /api${action}`, body)
    const url = `${this.url}/api/collections/${this.type.definition.pluralName}${action}`
    console.log(action, body, options)
    try {
      const response = await axios({
        url,
        method: 'POST',
        //mode: 'no-cors',
        data: body,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      const result = response.data
      //console.log(action, ...args, result)
      return result
    } catch (err) {
      throw new Error(`API error: ${err.message}`,)
    }
  }

  async findOne(...args) {
    const [query, options] = getArgs(args)
    const [result] = await this.find(query, {
      ...options,
      limit: 1,
    })

    return result
  }

  async find(...args) {

    const [query, options = {}] = getArgs(args)
    const modelsJson = await this.request('/find', { query, options })
    const modelsArray = modelsJson.map((modelJson) => {

      const model = this.type.parse(modelJson)
      model.setLoadState(options.load || {})
      this.hold(model)
      return model
    })
    const models = new (Models.of(this.type))(modelsArray, { query, options })
    return models
  }

  async create(modelJson, options = {}) {
    if (modelJson.toJSON) {
      modelJson = modelJson.toJSON()
    }
    const json = await this.request('/create', modelJson, options)
    const resultModel = this.type.parse(json)
    this.hold(resultModel)
    return resultModel
  }

  onModelUpdated(query) {
    Models.instances.forEach((i) => i.onModelUpdated(model))
  }

  async update(query, patches) {
    const json = await this.request('/update', { query, patches })
    const resultModel = this.type.parse(json)
    this.hold(resultModel)
    return resultModel
  }

  async createOrUpdate(...args) {
    let modelJson
    let query
    if (args.length === 2) {
      [query, modelJson] = args
    } else {
      const [model] = args
      const index = model.getFirstUniqueIndex()
      if (!index) {
        console.log(JSON.stringify(model.toJSON(), null, ' '))
        throw new Error()
      }

      modelJson = model
      query = [index]
    }
    if (modelJson.toJSON) {
      modelJson = modelJson.toJSON()
    }
    const json = await this.request('/create-or-update', { query, modelJson })
    console.log('create-or-update', json)
    const resultModel = this.type.parse(json)
    this.hold(resultModel)
    return resultModel
  }
}
