function toJS (obj) {
  if (typeof obj !== 'object') {
    return obj
  }
  if (obj.map) {
    return obj.map(i => toJS(i))
  }
  if (!obj.$mobx) {
    return obj
  }

  const ret = {}
  for (const key in obj.$mobx.values) {
    ret[key] = toJS(obj[key])
  }

  return ret
}

export { toJS }
