import { InitiatingPeer, MatchingPeer } from './Peer'
import remoteServer from '../data/server'

export default class PeerNetwork {
  constructor (server) {
    this.server = server || remoteServer
  }

  peers = []

  connInitCounter = 0

  /**
   * Call this to send signaling server initialization data to establish a WebRTC connection to an available peer.
   */
  initPeer = () => {
    this.connInitCounter++
    const peer = new InitiatingPeer()

    peer.on('error', e => {
      console.error('peer connection errored:', e)
      this.peers.splice(this.peers.indexOf(peer), 1)
    })
    peer.on('close', () => {
      console.log('remote peer closed the connection', peer)
      this.peers.splice(this.peers.indexOf(peer), 1)
    })
    peer.on('signal', data => this.server.peers.signal(this.connInitCounter, data))
    peer.on('connect', () => console.log('peer successfully initialized:', this.connInitCounter, peer))
    peer.on('data', this.onData)

    this.peers.push({connId: this.connInitCounter, peer})
  }

  /**
   * When a WebRTC connection initialization signal data is delivered to us by the server.
   */
  onServerSignal = data => {
    this.connInitCounter++
    const peer = new MatchingPeer()

    // todo: handle events

    peer.signal(data)
    this.peers.push({connId: this.connInitCounter, peer})
  }

  /**
   * Handle incoming peer data.
   * @param data - A JSON-RPC 2.0 object: https://en.wikipedia.org/wiki/JSON-RPC#Version_2.0
   */
  onData = data => {
    switch (data.method) {
      case 'txs':
        this.onReceiveTxs(data.params)
        break
      case 'blocks':
        this.onReceiveBlocks(data.params)
        break
      default:
        console.error('peer send malformed data:', data)
    }
  }

  onReceiveTxs = txs => {
    // no duplicates
    // no balance below 0
    // valid signatures
  }

  onReceiveBlocks = () => {
    // validate each tx signature unless block is signed by a trusted key
  }
}
