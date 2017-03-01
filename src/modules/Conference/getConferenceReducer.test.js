import { expect } from 'chai';
import actionTypes from './actionTypes';
import getConferenceReducer, {
    getDataReducer
} from './getConferenceReducer';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';


describe('getDataReducer', () => {
  it('should be a function', () => {
    expect(getDataReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getDataReducer(actionTypes)).to.be.a('function');
  });
  describe('dataReducer', () => {
    const reducer = getDataReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.equal(null);
    });
    it('should return originalState if type is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' })).to.equal(originalState);
    });
    it('should return null if type is resetSuccess', () => {
      const originalState = {};
      expect(reducer(originalState, { type: actionTypes.resetSuccess })).to.equal(null);
    });
    it('should return data on actionTypes.regionChange', () => {
      const data = {
        phoneNumber: '123',
        phoneNumbers: [{
          country: {
            isoCode: 'foo'
          },
          phoneNumber: '456'
        }
        ] };
      const resultState = {
        phoneNumber: '456',
        phoneNumbers: [{
          country: {
            isoCode: 'foo'
          },
          phoneNumber: '456'
        }
        ] };
      expect(reducer(undefined, {
        type: actionTypes.regionChange,
        data,
        isoCode: 'foo'
      })).to.deep.equal(resultState);
    });
    it('should return data on actionTypes.fetchSuccess', () => {
      expect(reducer(undefined, {
        type: actionTypes.fetchSuccess,
        data: 'foo'
      })).to.equal('foo');
    });
  });
});
describe('getConferenceReducer', () => {
  it('should be a function', () => {
    expect(getConferenceReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getConferenceReducer(actionTypes)).to.be.a('function');
  });
});
describe('conferenceReducer', () => {
  const reducer = getConferenceReducer(actionTypes);
  const statusReducer = getModuleStatusReducer(actionTypes);
  const dataReducer = getDataReducer(actionTypes);
  it('should return the combined initialState', () => {
    expect(reducer(undefined, {})).to.deep.equal({
      status: statusReducer(undefined, {}),
      data: dataReducer(undefined, {}),
    });
  });
});
