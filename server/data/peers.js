// todo: purge offline miners (heroku restart does the business for the moment)
const miners = []

/**
 * Adds a miner to the miner map. If the miner exists on the map, the coordinates are updated.
 * Returns list of miners with lat & lon properties.
 */
exports.addMiner = (id, lat, lon) => {
  const miner = miners.find(m => m.id === id)
  if (miner) {
    miner.lat = lat
    miner.lon = lon
  } else {
    miners.push({ id, lat, lon, seen: new Date() })
  }

  return miners.map(m => ({ lat: m.lat, lon: m.lon }))
}

exports.initPeer = (localConnId, signalData) => {
  // todo: how to clear notification: [...] data from receiving end after use (user calls it from client side after notification is handled?)
  // todo: return signalData from a matching peer or send back a notification with 'onInitPeerResponse'?
}
