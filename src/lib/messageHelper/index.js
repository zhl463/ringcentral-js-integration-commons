import messageTypes from '../../enums/messageTypes';

export function filterNumbers(numbers, filterNumber) {
  return numbers.filter((number) => {
    if (filterNumber.phoneNumber) {
      return filterNumber.phoneNumber !== number.phoneNumber;
    }
    return filterNumber.extensionNumber !== number.extensionNumber;
  });
}

export function messageIsDeleted(message) {
  return message.availability === 'Deleted';
}

export function messageIsTextMessage(message) {
  return (message.type !== messageTypes.fax && message.type !== messageTypes.voiceMail);
}

export function messageIsFax(message) {
  return (message.type === messageTypes.fax);
}

export function messageIsVoicemail(message) {
  return (message.type === messageTypes.voiceMail);
}

export function messageIsAcceptable(message) {
  // do not show outbound faxes
  // do not show deleted messages
  return (message.type !== messageTypes.fax || message.direction === 'Inbound') &&
    (!messageIsDeleted(message));
}

export function getMyNumberFromMessage({ message, myExtensionNumber }) {
  if (!message) {
    return null;
  }
  if (message.direction === 'Outbound') {
    return message.from;
  }
  if (message.type === messageTypes.pager) {
    const myNumber = message.to.find(number => (
      number.extensionNumber === myExtensionNumber
    ));
    if (myNumber) {
      return myNumber;
    }
    return { extensionNumber: myExtensionNumber };
  }
  return message.to[0];
}

export function uniqueRecipients(recipients, filter = () => true) {
  const recipientMap = {};
  recipients.forEach((recipient) => {
    if (filter(recipient)) {
      const key = recipient.extensionNumber || recipient.phoneNumber;
      recipientMap[key] = recipient;
    }
  });
  return Object.values(recipientMap);
}

export function getRecipientNumbersFromMessage({ message, myNumber }) {
  if (!message) {
    return [];
  }
  if (message.type === messageTypes.sms) {
    if (message.direction === 'Outbound') {
      return message.to;
    }
    return [message.from];
  }
  const allRecipients = [message.from].concat(message.to);
  const recipients = filterNumbers(allRecipients, myNumber);
  if (recipients.length === 0) {
    recipients.push(myNumber);
  }
  return uniqueRecipients(recipients);
}

export function getRecipients({ message, myExtensionNumber }) {
  const myNumber = getMyNumberFromMessage({
    message,
    myExtensionNumber,
  });
  return getRecipientNumbersFromMessage({
    message,
    myNumber,
  });
}

export function getNumbersFromMessage({ extensionNumber, message }) {
  if (message.type === messageTypes.pager) {
    // It is safer and simpler to just put all known contacts into array and filter self out
    const contacts = (message.to && message.to.slice()) || [];
    if (message.from) contacts.push(message.from);
    const correspondents = uniqueRecipients(contacts,
      contact => contact.extensionNumber !== extensionNumber
    );
    // to support send message to myself.
    if (correspondents && correspondents.length === 0) {
      const myPhoneLength =
        contacts.filter(contact => contact.extensionNumber === extensionNumber).length;
      if (myPhoneLength > 0 && contacts.length === myPhoneLength) {
        correspondents.push({
          extensionNumber,
        });
      }
    }
    return {
      self: {
        extensionNumber
      },
      correspondents: correspondents || [],
    };
  }

  const inbound = message.direction === 'Inbound';
  const fromField = (
    message.from &&
      Array.isArray(message.from) ?
      message.from :
      [message.from]
  ) || [];
  const toField = (
    message.to &&
      Array.isArray(message.to) ?
      message.to :
      [message.to]
  ) || [];
  if (inbound) {
    return {
      self: toField[0],
      correspondents: fromField,
    };
  }
  return {
    self: fromField[0],
    correspondents: toField,
  };
}

export function sortByDate(a, b) {
  const ta = new Date(a.creationTime).getTime();
  const tb = new Date(b.creationTime).getTime();
  return tb - ta;
}

export function sortSearchResults(a, b) {
  if (a.matchOrder === b.matchOrder) return sortByDate(a, b);
  return a.matchOrder > b.matchOrder ? 1 : -1;
}
