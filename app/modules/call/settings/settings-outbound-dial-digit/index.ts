import { OutboundDialDigitComponent } from './settings-outbound-dial-digit.component';

export default angular
  .module('call.settings.outbound-dial-digit', [
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    require('angular-translate'),
  ])
  .component('ucOutboundDialDigit', new OutboundDialDigitComponent())
  .name;