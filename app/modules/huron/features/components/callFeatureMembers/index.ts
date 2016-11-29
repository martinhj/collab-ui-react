import './_call-feature-members.scss';
import './_call-feature-member-lookup.scss';

import { CallFeatureMembersComponent } from './callFeatureMembers.component';
import { callFeatureMemberPrimaryNumberFilter } from './callFeatureMemberPrimaryNumber.filter';
import { callFeatureMemberNumberFormatterFilter } from './callFeatureMemberNumberFormatter.filter';
import memberService from 'modules/huron/members';
import featureMemberService from 'modules/huron/features/services';
import noDirtyOverride from 'modules/huron/features/components/noDirtyOverride';

export default angular
  .module('huron.call-feature-members', [
    'atlas.templates',
    'collab.ui',
    'pascalprecht.translate',
    'dragularModule',
    'huron.telephoneNumber',
    memberService,
    featureMemberService,
    noDirtyOverride,
  ])
  .component('ucCallFeatureMembers', new CallFeatureMembersComponent())
  .filter('callFeatureMemberPrimaryNumberFilter', callFeatureMemberPrimaryNumberFilter)
  .filter('callFeatureMemberNumberFormatterFilter', callFeatureMemberNumberFormatterFilter)
  .name;
