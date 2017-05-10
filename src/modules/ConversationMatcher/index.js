import DataMatcher from '../../lib/DataMatcher';

export default class ConversationMatcher extends DataMatcher {
  constructor({
    ...options
  }) {
    super({
      name: 'conversationMatcher',
      ...options
    });
  }
}
