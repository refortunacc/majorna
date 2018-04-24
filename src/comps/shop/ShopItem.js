import React from 'react'
import builtInItems from './BuiltInItems'

export default props => {
  const item = builtInItems.find(i => i.id === props.match.params.id)
  if (item.id === 'majorna') {
    // todo: use component did mount
    window.requestAnimationFrame(() => {
      const script = document.createElement('script')
      script.src = 'https://commerce.coinbase.com/v1/checkout.js'
      document.getElementById('action-buttons').appendChild(script)
    })
  }

  function handleBuy () {
    if (!item.externalUrl) {
      // no external url to redirect the user to so handle exchange internally
    }
  }

  return (
    <div className="mj-box flex-column center-all box-center w-m">
      <div className="is-size-5 has-text-centered">Buy - {item.name}</div>

      {item.fontIcon && <i className={item.fontIcon + ' m-t-m'} style={{width: 150, height: 150}}/>}

      {item.imageUrl && <img className="m-t-m" width="150" height="150" src={item.imageUrl} alt={item.name}/>}

      {item.googlePlayUrl &&
        <a href={item.googlePlayUrl} target="_blank" rel="noopener noreferrer">
          <img className="m-t-m" width="150" src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png" alt="Get it on Google Play"/>
        </a>
      }

      <strong className="m-t-m">Description</strong>
      <div>{item.description}</div>

      {item.unavailable && <strong className="m-t-m">Status: <span className="has-text-warning">Unavailable</span></strong>}

      <div id="action-buttons" className="flex-row m-t-l">
        <a className="button is-info donate-with-crypto" disabled={item.unavailable} href={item.externalUrl} onClick={handleBuy}>Buy</a>
        <button className="button m-l-m" onClick={props.history.goBack}>Cancel</button>
      </div>
    </div>
  )
}