import React from 'react'
import mj from '../../res/mj.png'
import ExchangeRatesWidget from '../shared/ExchangeRatesWidget'
import server from '../../data/server'
import config from '../../data/config'
import { Link } from 'react-router-dom'

export default [
  {
    id: 'majorna',
    name: 'Majorna',
    description: () => <React.Fragment>
      Buy Majorna using Card or Bitcoin, Ethereum, or other cryptos.
      Amount sent will be converted to mj and deposited in your account within 15 minutes.
      By purchasing Majorna, you agree to the <Link to="/about/terms">Terms and Conditions</Link>, so make sure to review it.
      You can report problems about purchases to <a href={'mailto:support@' + config.hosting.domain} target="_blank" rel="noopener noreferrer">support@{config.hosting.domain}</a>.
    </React.Fragment>,
    imageUrl: mj,
    stripeScriptUrl: 'https://js.stripe.com/v3/',
    stripeCheckoutScriptUrl: 'https://checkout.stripe.com/checkout.js',
    stripeConfig: {
      name: 'Majorna',
      description: 'Buy Majorna using card (via Stripe).',
      currency: 'usd',
      allowRememberMe: false,
      amount: 0
    },
    coinbaseUrlFn: server.shop.getCoinbaseCommerceChargeUrl,
    widget: ExchangeRatesWidget
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    unavailable: true,
    description: 'Buy Bitcoin using your Majorna balance.',
    fontIcon: 'fab fa-bitcoin'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    unavailable: true,
    description: 'Buy Ethereum using your Majorna balance.',
    fontIcon: 'fab fa-ethereum'
  },
  {
    id: 'usdollar',
    name: 'US Dollar',
    unavailable: true,
    description: 'Buy US Dollar using your Majorna balance.',
    fontIcon: 'fas fa-dollar-sign'
  },
  {
    id: 'euro',
    name: 'Euro',
    unavailable: true,
    description: 'Buy Euro using your Majorna balance.',
    fontIcon: 'fas fa-euro-sign'
  },
  {
    id: 'reddit',
    name: 'Send to Reddit',
    unavailable: true,
    description: 'Send Majorna to a Reddit comment or post author.',
    fontIcon: 'fab fa-reddit'
  },
  {
    id: 'crowner',
    name: 'Crowner',
    unavailable: true,
    description: 'Choose your own adventure: rule your kingdom of prosperity... or ruins. Click on Google Play icon for game details.',
    imageUrl: 'https://lh3.googleusercontent.com/A8TzrOKsyHUWTEg0-2Qr6aFLvWhCJUq37M4E_BC3qB9JXAjxTnu4GXel3sSa-ysnx_cz=s360',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.soygul.crowner'
  },
]