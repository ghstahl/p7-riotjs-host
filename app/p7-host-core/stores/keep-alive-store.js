import DeepFreeze from '../utils/deep-freeze.js';
import StoreBase from './store-base.js';

class Constants {}
Constants.NAME = 'keep-alive-store';
Constants.NAMESPACE = Constants.NAME + ':';
Constants.WELLKNOWN_EVENTS = {
  in: {
    fetchHeadResult: Constants.NAMESPACE + 'fetch-head-result',
    enable: Constants.NAMESPACE + 'enable',
    disable: Constants.NAMESPACE + 'disable'
  },
  out: {
    keptAlive: Constants.NAMESPACE + 'kept-alive'
  }
};
DeepFreeze.freeze(Constants);

export default class KeepAliveStore extends StoreBase {
  static get constants() {
    return Constants;
  }
  constructor() {
    super();
    let self = this;

    riot.observable(this);
    this.riotHandlers = [
      {event: Constants.WELLKNOWN_EVENTS.in.fetchHeadResult, handler: this._onFetchHeadResult},
      {event: Constants.WELLKNOWN_EVENTS.in.enable, handler: this._onEnable},
      {event: Constants.WELLKNOWN_EVENTS.in.disable, handler: this._onDisable}
    ];
    self.bindEvents();
    self._keepAlive = false;
  }

  _onEnable() {
    let self = this;
    let w = riot.global.window;

    w._oldOpen = XMLHttpRequest.prototype.open;
    let onStateChange = (event) =>{
      if (event.currentTarget.readyState === 4) {
        self._onHttpMonitor(event.currentTarget.responseURL, event.currentTarget.status);
      }
    };

    XMLHttpRequest.prototype.open = () =>{
        // when an XHR object is opened, add a listener for its readystatechange events
      this.addEventListener('readystatechange', onStateChange);
        // run the real `open`
      w._oldOpen.apply(this, arguments);
    };

    if (!w.fetch.polyfill) {
      w._oldFetch = w.fetch;

      w.fetch = (input, init) =>{
        return w._oldFetch(input, init).then(response =>{
          self._onHttpMonitor(response.url, response.status);
          return response;
        });
      };
    }

    self.timer = setInterval(()=>{
      self._onTimer();
    }, 5000);

  }

  _onDisable() {
    let self = this;
    let w = riot.global.window;

    if (self.timer) {
      clearInterval(this.timer);
    }

    if (w._oldFetch) {
      w.fetch = w._oldFetch;
      w._oldFetch = null;
    }
    if (w._oldOpen) {
      XMLHttpRequest.prototype.open = w._oldOpen;
      w._oldOpen = null;
    }
  }

  _onHttpMonitor(url, status) {
    let n = url.startsWith(window.location.origin);

    if (n === false) {
      this._keepAlive = true;
    }
  }
  _onTimer() {
    if (this._keepAlive) {
      this._keepAlive = false;
      let myAck = {
        evt: Constants.WELLKNOWN_EVENTS.in.fetchHeadResult
      };

      riot.control.trigger(riot.EVT.fetchStore.in.fetch, riot.state.keepAlive.url,
                                {method: 'HEAD'}, myAck);
    }
  }
  _onFetchHeadResult(result, ack) {
    console.log(Constants.NAME, Constants.WELLKNOWN_EVENTS.in.fetchHeadResult,
      result, ack);
    this.trigger(Constants.WELLKNOWN_EVENTS.out.keptAlive);
  }

}

