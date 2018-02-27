import React, { Component } from 'react'
import { fm } from '../../data/utils'
import server from '../../data/server'

export default class extends Component {
  state = {
    progress: 0,
    reward: 10, // todo: read this from mj/meta
    minedBlocks: 0
  }

  async componentDidMount() {
    // call server and get last block header to start mining that block
    const res = await server.blocks.mine()
    const miningParams = await res.json()
    const alg = 'SHA-256'
    const enc = new TextEncoder('utf-8')
    const strBuffer = enc.encode(miningParams.str)
    let nonce = 0
    let nonceBuffer, fullStrBuffer, hashBuffer, hashArray, base64String

    console.log(`starting mining loop with difficulty ${miningParams.difficulty}`)
    while (true) {
      nonce++
      nonceBuffer = enc.encode(nonce.toString())
      fullStrBuffer = new Uint8Array(nonceBuffer.length + strBuffer.length)
      fullStrBuffer.set(nonceBuffer);
      fullStrBuffer.set(strBuffer, nonceBuffer.length)
      hashBuffer = await crypto.subtle.digest(alg, fullStrBuffer)
      hashArray = new Uint8Array(hashBuffer)
      if (hashArray[0] === 0 && hashArray[1] === 0) {
        base64String = btoa(String.fromCharCode(...hashArray))
        console.log(`mined block with difficulty: ${miningParams.difficulty}, nonce: ${nonce}, hash: ${base64String}`)
        break
      }
    }
  }

  handleStop = () => this.props.history.goBack()

  render() {
    return (
      <div className="mj-box flex-column">
        <div className="is-size-5 has-text-centered">Mining mj</div>

        <div><strong>Progress:</strong> {this.state.progress}%</div>
        <progress className="progress is-large is-info" value={this.state.progress} max="100"/>

        <div><strong>Earnings:</strong> mj{fm(this.state.reward * this.state.minedBlocks)}</div>
        <div><strong>Mined Blocks:</strong> {this.state.minedBlocks}</div>
        <div><strong>Reward per Block:</strong> mj{fm(this.state.reward)}</div>

        <div className="flex-row center-h m-t-l">
          <button className="button" onClick={this.handleStop}>Stop</button>
        </div>
      </div>
    )
  }
}
