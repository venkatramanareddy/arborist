const t = require('tap')
const Node = require('../lib/node.js')

t.test('basic instantiation', t => {
  const root = new Node({
    pkg: { name: 'root' },
    path: '.',
    realpath: '/home/user/projects/root',
  })

  t.equal(root.isTop, true, 'root is top')
  t.equal(root.isLink, false, 'root is not a link')

  t.matchSnapshot(root, 'just a lone root node')
  t.end()
})

t.test('testing with dep tree', t => {
  const root = new Node({
    pkg: {
      name: 'root',
      bundleDependencies: [ 'bundled' ],
      dependencies: { prod: '', bundled: '', missing: '' },
      devDependencies: { dev: '', overlap: '' },
      optionalDependencies: { optional: '', overlap: '' },
    },
    path: '.',
    realpath: '/home/user/projects/root',
  })
  const prod = new Node({
    pkg: {
      name: 'prod',
      version: '1.2.3',
      dependencies: { meta: '' },
      peerDependencies: { peer: '' },
    },
    path: './node_modules/prod',
    realpath: '/home/user/projects/root/node_modules/prod',
    parent: root,
  })
  const meta = new Node({
    pkg: {
      name: 'meta',
      version: '1.2.3',
    },
    path: './node_modules/prod/node_modules/meta',
    realpath: '/home/user/projects/root/node_modules/prod/node_modules/meta',
    parent: prod,
  })
  const bundled = new Node({
    pkg: {
      name: 'bundled',
      version: '1.2.3',
    },
    path: './node_modules/bundled',
    realpath: '/home/user/projects/root/node_modules/bundled',
    parent: root,
  })
  const dev = new Node({
    pkg: { name: 'dev', version: '1.2.3' },
    path: './node_modules/dev',
    realpath: '/home/user/projects/root/node_modules/dev',
    parent: root,
  })
  const opt = new Node({
    pkg: { name: 'optional', version: '1.2.3' },
    path: './node_modules/optional',
    realpath: '/home/user/projects/root/node_modules/optional',
    parent: root,
  })
  const peer = new Node({
    pkg: { name: 'peer', version: '1.2.3' },
    path: './node_modules/peer',
    realpath: '/home/user/projects/root/node_modules/peer',
    parent: root,
  })
  const extraneous = new Node({
    pkg: { name: 'extraneous', version: '1.2.3' },
    path: './node_modules/extraneous',
    realpath: '/home/user/projects/root/node_modules/extraneous',
    parent: root,
  })
  t.equal(prod.top, root, 'root is top of tree')
  t.equal(extraneous.extraneous, true, 'extraneous is extraneous')
  t.matchSnapshot(root, 'initial load with some deps')

  // move dep to top level
  meta.parent = root
  t.matchSnapshot(root, 'move meta to top level')

  const newMeta = new Node({
    pkg: {
      name: 'meta',
      version: '2.3.4'
    },
    path: './node_modules/prod/node_modules/meta',
    realpath: '/home/user/projects/root/node_modules/prod/node_modules/meta',
    parent: prod,
  })
  const metaMeta = new Node({
    pkg: {
      name: 'metameta',
      version: '1.2.3',
    },
    path: newMeta.path + '/node_modules/metameta',
    realpath: newMeta.realpath + '/node_modules/metameta',
    parent: newMeta,
  })

  t.matchSnapshot(root, 'add new meta under prod')

  newMeta.parent = root
  t.equal(meta.parent, null, 'old meta parent removed')
  t.equal(root.children.indexOf(meta), -1, 'root.children no longer has old meta')
  t.matchSnapshot(root, 'move new meta to top level')

  newMeta.parent = root
  t.matchSnapshot(root, 'move new meta to top level second time (no-op)')

  t.end()
})

t.test('edge cases for branch coverage', t => {
  const noPkg = new Node({
    path: '.',
    realpath: '/home/user/projects/root',
  })
  t.same(noPkg.package, {}, 'default package is empty object')
  t.equal(noPkg.name, 'root', 'root default name is . if package empty')

  const noPath = new Node({
    realpath: '/home/user/projects/root',
  })
  t.equal(noPath.name, 'root', 'pathless gets named for realpath')

  t.end()
})