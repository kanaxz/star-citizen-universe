const { Organization, Starmap, Star } = require('shared/types')
const { starmapRequest, gePositionFromLatLon } = require('./utils')
const { codify } = require('../../utils')
const Folder = require('storage/Folder')
const Right = require('ressourcing/Right')
const User = require('management/User')

module.exports = async (bootup, services) => {
  const types = require('./types')(services)

  const uploadFolder = await Folder.collection.findOne([{ $eq: ['$path', '/storage/upload'] }])
  const systemUser = await User.collection.findOne([{ $eq: ['$username', 'system'] }])

  const buildFromJson = async (json, parent) => {
    const name = (json.name || json.designation).split('(')[0].trim()
    const affiliation = json.affiliation[0]
    let organization
    if (affiliation) {
      organization = await Organization.collection.findByUniqueIndex({
        code: codify(affiliation.code),
      })
    }
    let image
    if (json.thumbnail) {
      image = await services.collections.storage.uploadUrl(json.thumbnail.source, {
        folder: uploadFolder.toJSON(null),
        read: new Right({
          type: 'public',
        }),
        edit: new Right({
          type: 'private',
          owners: [systemUser]
        })
      })
    }
    return {
      code: codify(name),
      starmap: new Starmap({
        id: json.id,
        position: gePositionFromLatLon(json),
        orbitPeriod: json.orbit_period && parseFloat(json.orbit_period),
        code: json.code,
      }),
      organization,
      name,
      wiki: json.description || name,
      designation: json.designation,
      description: json.description,
      image,
      parent,
    }
  }

  const processChilds = async (celestialObjects, parent) => {
    let isStar = false
    if (parent instanceof Star) {
      parent = parent.parent
      isStar = true
    }
    for (const celestialObject of celestialObjects) {

      console.log(
        celestialObject.id,
        celestialObject.code,
        celestialObject.parent_id,
        parent.starmap.id,
        parent.name,
      )
      /**/

      if (celestialObject.type !== 'STAR' && celestialObject.parent_id !== parent.starmap.id && !isStar) {
        continue
      }



      const type = Object.values(types).find((type) => type.check(celestialObject))
      if (!type) {

        console.log(celestialObject.type, celestialObject.subtype?.name)
        console.log(JSON.stringify(celestialObject))
        //process.exit()
        /**/
        continue
      }
      const { resultset: [json] } = await starmapRequest('celestial-objects/' + celestialObject.code)
      const entityJson = await buildFromJson(json, parent)

      const entity = await type.process(entityJson, json)
      if (!entity) { continue }
      if (json.children) {
        await processChilds(json.children, entity)
      }
    }
  }

  let starmapSystems = bootup.systems.resultset
  //starmapSystems = [starmapSystems[0]]
  const systems = []
  for (const starmapSystem of starmapSystems) {
    //if (starmapSystem.code !== 'TERRA') { continue }
    const { resultset: [json] } = await starmapRequest('star-systems/' + starmapSystem.code)
    const entity = await buildFromJson(json)
    const system = await types.system.process(entity, json)
    systems.push({ system, json })
    
  }
  console.log('STARTING CELESTIAL OBJECTS')
  for (const { system, json } of systems) {
    await processChilds(json.celestial_objects, system)
  }

}