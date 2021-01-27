// helper function to output a clearer visualization
// of the current node and its descendents

const util = require('util')

class ArboristNode {
  constructor (tree, path) {
    this.name = tree.name
    if (tree.package.name && tree.package.name !== this.name)
      this.packageName = tree.package.name
    if (tree.version)
      this.version = tree.version
    this.location = tree.location
    this.path = tree.path
    if (tree.realpath !== this.path)
      this.realpath = tree.realpath
    if (tree.resolved !== null)
      this.resolved = tree.resolved
    if (tree.extraneous)
      this.extraneous = true
    if (tree.dev)
      this.dev = true
    if (tree.optional)
      this.optional = true
    if (tree.devOptional && !tree.dev && !tree.optional)
      this.devOptional = true
    if (tree.peer)
      this.peer = true
    if (tree.inBundle)
      this.bundled = true
    if (tree.error)
      this.error = treeError(tree.error)
    if (tree.errors && tree.errors.length)
      this.errors = tree.errors.map(treeError)

    // edgesOut sorted by name
    if (tree.edgesOut.size) {
      this.edgesOut = new Map([...tree.edgesOut.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, edge]) => [name, new EdgeOut(edge)]))
    }

    // edgesIn sorted by location
    if (tree.edgesIn.size) {
      this.edgesIn = new Set([...tree.edgesIn]
        .sort((a, b) => a.from.location.localeCompare(b.from.location))
        .map(edge => new EdgeIn(edge)))
    }

    // fsChildren sorted by path
    if (tree.fsChildren.size) {
      this.fsChildren = new Set([...tree.fsChildren]
        .sort(({path: a}, {path: b}) => a.localeCompare(b))
        .map(tree => printableTree(tree, path)))
    }

    // children sorted by name
    if (tree.children.size) {
      this.children = new Map([...tree.children.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, tree]) => [name, printableTree(tree, path)]))
    }
  }
}

class ArboristLink extends ArboristNode {
  constructor (tree, path) {
    super(tree, path)
    this.target = printableTree(tree.target, path)
  }
}

const treeError = ({code, path}) => ({
  code,
  ...(path ? { path } : {}),
})

// print out edges without dumping the full node all over again
// this base class will toJSON as a plain old object, but the
// util.inspect() output will be a bit cleaner
class Edge {
  constructor (edge) {
    this.type = edge.type
    this.name = edge.name
    this.spec = edge.spec || '*'
    if (edge.error)
      this.error = edge.error
  }
}

// don't care about 'from' for edges out
class EdgeOut extends Edge {
  constructor (edge) {
    super(edge)
    this.to = edge.to && edge.to.location
  }

  [util.inspect.custom] () {
    return `{ ${this.type} ${this.name}@${this.spec}${
      this.to ? ' -> ' + this.to : ''
    }${
      this.error ? ' ' + this.error : ''
    } }`
  }
}

// don't care about 'to' for edges in
class EdgeIn extends Edge {
  constructor (edge) {
    super(edge)
    this.from = edge.from && edge.from.location
  }

  [util.inspect.custom] () {
    return `{ ${this.from || '""'} ${this.type} ${this.name}@${this.spec}${
      this.error ? ' ' + this.error : ''
    } }`
  }
}

const printableTree = (tree, path = []) => {
  if (path.includes(tree))
    return { location: tree.location }
  path.push(tree)
  const Cls = tree.isLink ? ArboristLink : ArboristNode
  return new Cls(tree, path)
}

module.exports = printableTree