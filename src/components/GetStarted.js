import React, { Component } from 'react';

export default class GetStarted extends Component {
  handleClick = () => {}

  render() {
    return (
      <div className="hero is-medium is-light">
        <div className="hero-body has-text-centered">
          <h1 className="title is-size-1" style={{marginBottom: '3rem'}}>Send and Receive Majorna</h1>
          <h2 className="subtitle" style={{marginBottom: '3rem'}}>Simple crypto currency with built-in services.</h2>
          <div className="field is-grouped is-grouped-centered">
            <p className="control is-hidden-mobile"><input className="input is-medium" type="text" placeholder="Enter your email" /></p>
            <p className="control"><a className="button is-medium is-info">Get Started</a></p>
          </div>
        </div>
      </div>
    );
  }
}
