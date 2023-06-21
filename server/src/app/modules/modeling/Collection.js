const { buildPipeline, buildLookups, unloadLookup } = require('./utils')
const Scope = require('./Scope')
const { nanoid } = require('nanoid')
const { chain } = require('core/utils/array')
const mixer = require('core/mixer')

const objectDiff = (paths1, paths2) => {
  return Object.entries(paths1)
    .reduce((acc, [propertyName, value1]) => {
      let value2 = paths2[propertyName]
      if (!value2) {
        acc[propertyName] = true
      } else {
        if (value2 === true) {
          value2 = {}
        }
        if (value1 === true) {
          value1 = {}
        }
        const subDiff = objectDiff(value1, value2)
        if (Object.keys(subDiff).length) {
          acc[propertyName] = subDiff
        }
      }
      return acc
    }, {})
}


const merge = (load1, load2) => {
  const unload = objectDiff(load1, load2)
  const load = objectDiff(load2, load1)
  return { load, unload }
}


const patchesMap = {
  '$set': (object, value) => {
    Object.assign(object, value)
  }
}

const applyPatches = (object, pathes) => {
  Object.entries(pathes)
    .forEach(([k, v]) => {
      patchesMap[k](object, v)
    })
}

module.exports = class Collection {
  constructor(mongodb, type, controllers) {
    this.mongodb = mongodb
    this.mongoCollection = mongodb.collection(type.definition.pluralName)
    this.type = type
    this.controllers = controllers
  }

  getTypeControllers(type) {
    const controllers = this.controllers
      .filter((controller) => {
        return type === controller.type || mixer.is(type.prototype, controller.type)
      })
      .map((c) => c.controller)

    return controllers
  }

  async findOne(req, query, options) {
    const [result] = await this.find(req, query, {
      ...options,
      limit: 1,
    })

    return result
  }

  async find(req, query, options) {
    if (!options) {
      options = {}
    }
    let type = this.type
    if (options.type) {
      type = this.type.findChild((c) => c.definition.name === options.type)
    }

    if (!type) {
      throw new Error('Type not found')
    }
    const scope = new Scope()
    scope.variables.this = {
      sourceType: 'var',
      name: 'this',
      value: '$$CURRENT',
      type: type,
    }
    const pipeline = buildPipeline(scope, query)
    if (!options.load) {
      options.load = {}
    }
    const { load, unload } = merge(scope.paths, options.load)
    pipeline.push(
      {
        $limit: Math.min(options.limit || 100)
      },
      ...unloadLookup(type, unload),
      ...buildLookups(type, load),
    )

    console.log(JSON.stringify(pipeline, null, ' '))

    const models = await this.mongoCollection
      .aggregate(pipeline)
      .toArray()
    /*
    console.log(JSON.stringify({ models }, null, ' '))
    process.exit()
    /**/


    return models.map((m) => type.parse(m))
  }

  async create(req, modelJson) {
    modelJson._id = nanoid()
    const model = this.type.parse(modelJson)
    const controllers = this.getTypeControllers(model.constructor)
    await chain(controllers, async (controller, next) => {
      if (!controller.create) {
        return next()
      }
      return controller.create(req, model, next)
    }, async () => {
      const json = model.toJSON()
      await this.mongoCollection.insertOne(json)
    })

    return model
  }

  async innerUpdate(req, model, patches) {
    const modelJson = model.toJSON()
    const editModel = new model.constructor(modelJson)
    applyPatches(editModel, patches)
    await this.mongoCollection.updateOne({
      _id: model._id,
    }, {
      $set: editModel.toJSON()
    })
    return editModel
  }


  async update(req, query, patches) {
    const [model] = await this.find(query, { limit: 1 })
    if (!model) {
      throw new Error()
    }
    const result = await this.innerUpdate(req, model, patches)
    return result
  }

  async createOrUpdate(req, query, modelJson) {
    const type = modelJson['@type']
    if (!type) {
      throw new Error()
    }
    const [existingModel] = await this.find(req, query, { limit: 1, type })
    if (existingModel) {
      const result = await this.innerUpdate(req, existingModel, {
        $set: modelJson
      })
      return result
    } else {
      const result = await this.create(req, modelJson)
      return result
    }
  }
}