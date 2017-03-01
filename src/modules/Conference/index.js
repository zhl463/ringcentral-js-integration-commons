import mask from 'json-mask';
import DataFetcher from '../../lib/DataFetcher';
import actionTypes from './actionTypes';
import getConferenceReducer from './getConferenceReducer';

const DEFAULT_MASK = 'phoneNumber,hostCode,participantCode,phoneNumbers(country,phoneNumber)';

export default class Conference extends DataFetcher {
  constructor({
       auth,
       client,
       ...options,
    }) {
    super({
      name: 'conference',
      client,
      actionTypes,
      fetchFunction: async () => mask(
                        await client.account().extension().conferencing().get(), DEFAULT_MASK
                     ),
      ...options,
    });
    this._auth = auth;
    this._client = client;
    this.addSelector(
       'conferenceNumber',
       () => this.data,
       (data) => {
         const info = data;
         if (!info) {
           return info;
         }
         return {
           ...data,
           phoneNumbers: info.phoneNumbers.filter(value => value.phoneNumber !== info.phoneNumber),
         };
       }
    );
    this._reducer = getConferenceReducer(this.actionTypes);
  }
  onRegionChange(isoCode) {
    this.store.dispatch({
      type: this.actionTypes.regionChange,
      data: this.data,
      isoCode
    });
  }
  // inviteWithText() {
  //   let text = 'Please join the RingCentral conference.';
  //   text += `Dial-In Numbers:${this.phoneNumber}`;
  //   text += `Participant Access: ${this.participantCode}`;
  //   text += 'Need an international dial-in phone number? Please visit http://www.ringcentral.com/conferencing';
  //   text += 'This conference call is brought to you by RingCentral Conferencing.';
  //   return text;
  // }
  get data() {
    return this.state.data;
  }
  get conferenceNumber() {
    return this._selectors.conferenceNumber();
  }

}
