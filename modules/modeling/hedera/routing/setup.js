
const setup = {
  layout: {
    header: {
      before: []
    }
  },
  actions: [
    {
      name: 'explorer',
      url: '/explorer',
      content: '<i class="fa-solid fa-list"></i>',
      async execute(req, res, next) {
        await res.page(import('./pages/Explorer'), req.model)
      }
    },
    {
      name: 'edit',
      url: '/edit',
      content: '<i class="fa-solid fa-pen"></i>',
      async check(model) {
        return await model.canUpdate()
      },
      async execute(req, res, next) {
        console.log('editing', req.model)
        await res.page(import('./pages/Edit'), req.model)
      }
    },
    {
      name: 'delete',
      content: '<i class="red fa-solid fa-trash"></i>',
      class: 'warning',
      async check(model) {
        return await model.canDelete()
      },
      async execute(model) {
        await model.delete()
      }
    }
  ]
}

module.exports = setup