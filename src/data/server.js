import config from './config'

/**
 * Server API client. Uses window.fetch.
 * All functions in this object is asynchronous wince window.fetch uses promises.
 */
export default {
  debug: {
    ping: () => get('/ping')
  },
  users: {
    init: () => get('/users/init')
  },
  txs: {
    make: (to, amount) => postJson('/txs', {to, amount})
  }
}

const get = url => fetch(config.server.url + url, {
  method: 'GET',
  headers: new Headers({Authorization: `Bearer ${config.server.token}`})
})

const postJson = (url, data) => fetch(config.server.url + url, {
  method: 'POST',
  headers: new Headers({
    Authorization: `Bearer ${config.server.token}`,
    'Content-Type': 'application/json'
  }),
  body: JSON.stringify(data)
})