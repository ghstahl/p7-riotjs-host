
/*
var registerRecord = {
  name:'riotjs-partial-spa',
  views:[
    {view:'my-component-page'},
    {view:'typicode-user-detail'}
  ],
  stores:[
    {store: new TypicodeUserStore()}
  ],
  postLoadEvents:[
    {event:'typicode-init',data:{}}
  ],
  preUnloadEvents:[
    {event:'typicode-uninit',data:{}}
  ]
};
riot.control.trigger('plugin-registration',registerRecord);

*/
import DeepFreeze from '../utils/deep-freeze.js';
import RiotControlStore from './riotcontrol-store.js';

const RCSWKE = RiotControlStore.getConstants().WELLKNOWN_EVENTS;

class Constants {}
Constants.NAME = 'plugin-registration-store';
Constants.NAMESPACE = Constants.NAME + ':';
Constants.WELLKNOWN_EVENTS = {
  in: {
    pluginRegistration: 'plugin-registration',
    pluginUnregistration: 'plugin-unregistration'
  },
  out: {
    pluginRegistrationChanged: 'plugin-registration-changed',
    pluginRegistrationAck: 'plugin-registration-ack',
    pluginUnregistrationAck: 'plugin-unregistration-ack',
    riotContolRemoveStore: RCSWKE.in.riotContolRemoveStore,
    riotContolAddStore: RCSWKE.in.riotContolAddStore
  }
};
DeepFreeze.freeze(Constants);

export default class PluginRegistrationStore {
  static getConstants() {
    return Constants;
  }
  constructor(riotControlStore) {
    riot.observable(this);
    this.riotControlStore = riotControlStore;
    this._bound = false;
    this.bindEvents();
    riot.state.registeredPlugins = new Set();

  }
  bindEvents() {
    if (this._bound === false) {
      this.on(Constants.WELLKNOWN_EVENTS.in.pluginRegistration, this._registerPlugin);
      this.on(Constants.WELLKNOWN_EVENTS.in.pluginUnregistration, this._unregisterPlugin);
      this._bound = !this._bound;
    }
  }
  unbindEvents() {
    if (this._bound === true) {
      this.off(Constants.WELLKNOWN_EVENTS.in.pluginRegistration, this._registerPlugin);
      this.off(Constants.WELLKNOWN_EVENTS.in.pluginUnregistration, this._unregisterPlugin);
      this._bound = !this._bound;
    }
  }

  _findRegistration(registrationName) {

    var mySet = riot.state.registeredPlugins;

    for (let item of mySet) {
      if (item.name === registrationName) {return item;}
    }
    return null;
  }
  _removeRegistration(registrationName) {

    var mySet = riot.state.registeredPlugins;

    for (let item of mySet) {
      if (item.name === registrationName) {
        mySet.delete(item);
        break;
      }
    }
    return null;
  }
  _unregisterPlugin(registration) {

    var foundRegistration = this._findRegistration(registration.name);

    if (foundRegistration === null) {
      this.trigger(Constants.WELLKNOWN_EVENTS.out.pluginUnregistrationAck,
        {
          state: false,
          registration: registration,
          error: 'plugin already unregistered!'
        });
    } else {
      // reverse unload
      // 1. PreUnload Events first
      for (let i = 0; i < foundRegistration.preUnloadEvents.length; i++) {
        foundRegistration.stores[i].store.uninitialize();
        riot.control.trigger(foundRegistration.preUnloadEvents[i].event, foundRegistration.preUnloadEvents[i].data);
      }
      // 2. Remove the stores.
      for (let i = 0; i < foundRegistration.stores.length; i++) {
        this.riotControlStore._onRemove(foundRegistration.stores[i].name);
        // riot.control.trigger(Constants.WELLKNOWN_EVENTS.out.riotContolRemoveStore, foundRegistration.stores[i].name);
      }

      this._removeRegistration(registration.name);
      this.trigger(Constants.WELLKNOWN_EVENTS.out.pluginUnregistrationAck,
        {
          state: true,
          registration: registration
        });

      riot.control.trigger(Constants.WELLKNOWN_EVENTS.out.pluginRegistrationChanged);
    }
  }

  _registerPlugin(registration) {

    var foundRegistration = this._findRegistration(registration.name);

    if (foundRegistration === null) {
      riot.state.registeredPlugins.add(registration);

      // 1. Add the stores
      for (let i = 0; i < registration.stores.length; i++) {
        registration.stores[i].name = registration.name + '-store-' + i; // need this for my own tracking
        registration.stores[i].store.initialize();
        this.riotControlStore._onAdd(registration.stores[i].name, registration.stores[i].store);
        /*
        riot.control.trigger(Constants.WELLKNOWN_EVENTS.out.riotContolAddStore,
          registration.stores[i].name, registration.stores[i].store);
          */
      }
      // 2. fire post load events
      for (let i = 0; i < registration.postLoadEvents.length; i++) {
        riot.control.trigger(registration.postLoadEvents[i].event, registration.postLoadEvents[i].data);
      }
      this.trigger(Constants.WELLKNOWN_EVENTS.out.pluginRegistrationAck, {state: true, registration: registration});
      riot.control.trigger(Constants.WELLKNOWN_EVENTS.out.pluginRegistrationChanged);
    } else {
      this.trigger(Constants.WELLKNOWN_EVENTS.out.pluginRegistrationAck,
        {state: false, registration: registration, error: 'plugin already registered!'});
    }
  }
}
