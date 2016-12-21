import callingOptions from './callingOptions';
import callingModes from './callingModes';

export default function mapOptionToMode(callWith) {
  switch (callWith) {

    case callingOptions.softphone:
      return callingModes.softphone;

    case callingOptions.myphone:
    case callingOptions.otherphone:
    case callingOptions.customphone:
      return callingModes.ringout;

    default:
      return callingModes.softphone;

  }
}
