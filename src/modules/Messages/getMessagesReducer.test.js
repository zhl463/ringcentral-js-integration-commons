// import { expect } from 'chai';
// import getMessagesReducer, {
//   getCurrentMessagesReducer,
//   getCurrentPageReducer,
//   getLastUpdatedAtReducer,
//   getMessageStoreUpdatedAt,
//   getSearingStringReducer,
//   getSearchingResultsReducer,
// } from './getMessagesReducer';

// import actionTypes from './actionTypes';

// describe('Messages :: getCurrentMessagesReducer', () => {
//   it('getCurrentMessagesReducer should be a function', () => {
//     expect(getCurrentMessagesReducer).to.be.a('function');
//   });
//   it('getCurrentMessagesReducer should return a reducer', () => {
//     expect(getCurrentMessagesReducer()).to.be.a('function');
//   });
//   describe('messagesReducer', () => {
//     const reducer = getCurrentMessagesReducer(actionTypes);
//     it('should have initial state of empty array', () => {
//       expect(reducer(undefined, {})).to.deep.equal([]);
//     });
//     it('should return original state of actionTypes is not recognized', () => {
//       const originalState = {};
//       expect(reducer(originalState, { type: 'foo' }))
//       .to.equal(originalState);
//     });

//     it('should return messages on updateMessages', () => {
//       [
//         actionTypes.updateMessages
//       ].forEach(type => {
//         const messages = ['1', '3'];
//         expect(reducer('foo', {
//           type,
//           messages,
//         })).to.deep.equal(messages);
//       });
//     });
//     it('should return concated messages on pushMessages', () => {
//       [
//         actionTypes.pushMessages,
//       ].forEach(type => {
//         const originalMessages = ['1', '3'];
//         const messages = ['2', '1'];
//         const exceptMessages = originalMessages.concat(messages);
//         expect(reducer(originalMessages, {
//           type,
//           messages
//         })).to.deep.equal(exceptMessages);
//       });
//     });
//   });
// });

// describe('Messages :: getCurrentPageReducer', () => {
//   it('getCurrentPageReducer should be a function', () => {
//     expect(getCurrentPageReducer).to.be.a('function');
//   });
//   it('getCurrentPageReducer should return a reducer', () => {
//     expect(getCurrentPageReducer()).to.be.a('function');
//   });
//   describe('currentPageReducer', () => {
//     const reducer = getCurrentPageReducer(actionTypes);
//     it('should have initial state of one', () => {
//       expect(reducer(undefined, {})).to.equal(1);
//     });

//     it('should return original state of actionTypes is not recognized', () => {
//       const originalState = 3;
//       expect(reducer(originalState, { type: 'foo' }))
//       .to.equal(originalState);
//     });

//     it('should return next page on nextPage', () => {
//       [
//         actionTypes.nextPage
//       ].forEach(type => {
//         expect(reducer(2, {
//           type,
//         })).to.equal(3);
//       });
//     });

//     it('should return one on resetPage', () => {
//       [
//         actionTypes.resetPage,
//       ].forEach(type => {
//         expect(reducer(3, {
//           type,
//         })).to.equal(1);
//       });
//     });
//   });
// });

// describe('Messages :: getLastUpdatedAtReducer', () => {
//   it('getLastUpdatedAtReducer should be a function', () => {
//     expect(getLastUpdatedAtReducer).to.be.a('function');
//   });
//   it('getLastUpdatedAtReducer should return a reducer', () => {
//     expect(getLastUpdatedAtReducer()).to.be.a('function');
//   });
//   describe('lastUpdatedAtReducer', () => {
//     const reducer = getLastUpdatedAtReducer(actionTypes);
//     it('should have initial state of null', () => {
//       expect(reducer(undefined, {})).to.equal(null);
//     });

//     it('should return original state of actionTypes is not recognized', () => {
//       const originalState = '123';
//       expect(reducer(originalState, { type: 'foo' }))
//       .to.equal(originalState);
//     });

//     it('should return new timestamp on pushMessages and updateMessages', () => {
//       [
//         actionTypes.pushMessages,
//         actionTypes.updateMessages,
//       ].forEach(type => {
//         const now = Date.now();
//         expect(reducer('', {
//           type,
//         })).to.least(now);
//       });
//     });
//   });
// });

// describe('Messages :: getMessageStoreUpdatedAt', () => {
//   it('getMessageStoreUpdatedAt should be a function', () => {
//     expect(getMessageStoreUpdatedAt).to.be.a('function');
//   });
//   it('getMessageStoreUpdatedAt should return a reducer', () => {
//     expect(getMessageStoreUpdatedAt()).to.be.a('function');
//   });
//   describe('messageStoreUpdatedAt', () => {
//     const reducer = getMessageStoreUpdatedAt(actionTypes);
//     it('should have initial state of null', () => {
//       expect(reducer(undefined, {})).to.equal(null);
//     });

//     it('should return original state of actionTypes is not recognized', () => {
//       const originalState = '123';
//       expect(reducer(originalState, { type: 'foo' }))
//       .to.equal(originalState);
//     });

//     it('should return new messagesTimestamp on pushMessages and updateMessages', () => {
//       [
//         actionTypes.pushMessages,
//         actionTypes.updateMessages
//       ].forEach(type => {
//         const messagesTimestamp = '123321';
//         expect(reducer('', {
//           type,
//           messagesTimestamp,
//         })).to.equal(messagesTimestamp);
//       });
//     });
//   });
// });

// describe('Messages :: getSearingStringReducer', () => {
//   it('getSearingStringReducer should be a function', () => {
//     expect(getSearingStringReducer).to.be.a('function');
//   });
//   it('getSearingStringReducer should return a reducer', () => {
//     expect(getSearingStringReducer()).to.be.a('function');
//   });
//   describe('searingStringReducer', () => {
//     const reducer = getSearingStringReducer(actionTypes);
//     it('should have initial state of blank string', () => {
//       expect(reducer(undefined, {})).to.equal('');
//     });

//     it('should return original state of actionTypes is not recognized', () => {
//       const originalState = '123';
//       expect(reducer(originalState, { type: 'foo' }))
//       .to.equal(originalState);
//     });

//     it('should return new searchingString on updateSearchingString', () => {
//       [
//         actionTypes.updateSearchingString
//       ].forEach(type => {
//         const searchingString = '123321';
//         expect(reducer('', {
//           type,
//           searchingString
//         })).to.equal(searchingString);
//       });
//     });
//     it('should return blank string on cleanSearchingString', () => {
//       [
//         actionTypes.cleanSearchingString
//       ].forEach(type => {
//         expect(reducer('123', {
//           type,
//         })).to.equal('');
//       });
//     });
//   });
// });

// describe('Messages :: getSearchingResultsReducer', () => {
//   it('getSearchingResultsReducer should be a function', () => {
//     expect(getSearchingResultsReducer).to.be.a('function');
//   });
//   it('getSearchingResultsReducer should return a reducer', () => {
//     expect(getSearchingResultsReducer()).to.be.a('function');
//   });
//   describe('searchingResultsReducer', () => {
//     const reducer = getSearchingResultsReducer(actionTypes);
//     it('should have initial state of empty array', () => {
//       expect(reducer(undefined, {})).to.deep.equal([]);
//     });

//     it('should return original state of actionTypes is not recognized', () => {
//       const originalState = ['123'];
//       expect(reducer(originalState, { type: 'foo' }))
//       .to.deep.equal(originalState);
//     });

//     it('should return new searchResults on updateSearchResults', () => {
//       [
//         actionTypes.updateSearchResults
//       ].forEach(type => {
//         const searchResults = ['123', '321'];
//         expect(reducer([], {
//           type,
//           searchResults
//         })).deep.to.equal(searchResults);
//       });
//     });
//   });
// });
