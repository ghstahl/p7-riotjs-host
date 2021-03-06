
const userCache = 'typicodeUserCache';

class Constants {}
Constants.NAME = 'typicode-user-store';
Constants.NAMESPACE = Constants.NAME + ':';
Constants.WELLKNOWN_EVENTS = {
  in: {
    typicodeInit: 'typicode-init',
    typicodeUninit: 'typicode-uninit',
    typicodeUsersFetchResult: 'typicode-users-fetch-result',
    typicodeUsersFetch: 'typicode-users-fetch',
    typicodeUserFetch: 'typicode-user-fetch'
  },
  out: {
    typicodeUsersChanged: 'typicode-users-changed',
    typicodeUserChanged: 'typicode-user-changed'
  }
};
window.P7HostCore.DeepFreeze.freeze(Constants);

export default class TypicodeUserStore extends window.P7HostCore.StoreBase {

  constructor() {
    super();
    riot.observable(this); // Riot provides our event emitter.
    this.name = 'TypicodeUserStore';
    riot.EVT.typicodeUserStore = Constants.WELLKNOWN_EVENTS;
    this.fetchException = null;
    this.riotHandlers = [
      {event: Constants.WELLKNOWN_EVENTS.in.typicodeUsersFetch, handler: this._onTypicodeUsersFetch},
      {event: Constants.WELLKNOWN_EVENTS.in.typicodeUserFetch, handler: this._onTypicodeUserFetch},
      {event: Constants.WELLKNOWN_EVENTS.in.typicodeUsersFetchResult, handler: this._onUsersResult}
    ];
    this.bindEvents();
  }
  static get constants() {
    return Constants;
  }
  _onTypicodeUsersFetch(query) {
    console.log(riot.EVT.typicodeUserStore.in.typicodeUsersFetch);
    let url = 'https://jsonplaceholder.typicode.com/users';
    let myAck = {
      evt: riot.EVT.typicodeUserStore.in.typicodeUsersFetchResult
    };

    if (query) {
      myAck.query = query;
    }

    riot.control.trigger(riot.EVT.fetchStore.in.fetch, url, null, myAck);
  }

  _onTypicodeUserFetch(query) {
    console.log(riot.EVT.typicodeUserStore.in.typicodeUserFetch);
    let restoredSession = JSON.parse(localStorage.getItem(userCache));
    let blah = riot.Cookies.get('blah-blah-blah');
    let id = parseInt(query.id, 10);  // query.id is a string

    if (restoredSession) {
      let result = restoredSession.filter(function (obj) {
        let found = obj.id === id;

        return found;
      });

      if (result && result.length > 0) {
        this.trigger(riot.EVT.typicodeUserStore.out.typicodeUserChanged, result[0]);
      }
    } else {
            // need to fetch.
      let myQuery = {
        type: 'riotControlTrigger',
        evt: riot.EVT.typicodeUserStore.in.typicodeUserFetch,
        query: query,
        blah: blah
      };

      riot.control.trigger(riot.EVT.typicodeUserStore.in.typicodeUsersFetch, myQuery);
    }
  }
  /**
     * Reset tag attributes to hide the errors and cleaning the results list
     */
  _resetData() {
    this.fetchException = null;
  };

  _onUsersResult(result, ack) {
    console.log(riot.EVT.typicodeUserStore.in.typicodeUsersFetchResult, result, ack);
    if (result.error == null && result.response.ok && result.json) {
            // good
      let data = result.json;

      riot.control.trigger(riot.EVT.localStorageStore.in.localstorageSet, {key: userCache, data: data});
      this.trigger(riot.EVT.typicodeUserStore.out.typicodeUsersChanged, data);
      if (ack.query) {
        let query = ack.query;

        if (query.type === 'riotControlTrigger') {
          riot.control.trigger(query.evt, query.query);
        }
      }
    } else {
            // Bad.. Wipe the local storage
      riot.control.trigger(riot.EVT.localStorageStore.in.localstorageRemove, {key: userCache});
      riot.control.trigger('ErrorStore:error-catch-all', {code: 'typeicode-143523'});
    }
  }

}

