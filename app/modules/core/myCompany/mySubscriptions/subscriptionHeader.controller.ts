import { IBmmpAttr } from 'modules/online/upgrade/upgrade.service';

export class SubscriptionHeaderCtrl {
  public isTrial: boolean = false;
  public isOnline: boolean = false;
  public numSubscriptions: number = 0;
  public productInstanceId: string;
  public upgradeTrialUrl: string;
  public bmmpAttr: IBmmpAttr;

  /* @ngInject */
  constructor(
    private $scope: ng.IScope,
  ) {
    this.$scope.$on('SUBSCRIPTION::upgradeData', (_event, response) => {
      this.numSubscriptions = response.numSubscriptions;
      if (response.numSubscriptions === 1) {
        this.isTrial = response.isTrial;
        this.isOnline = response.isOnline;
        this.productInstanceId = response.productInstanceId;
        this.upgradeTrialUrl = response.upgradeTrialUrl;
        this.bmmpAttr = {
          subscriptionId: response.subId,
          productInstanceId: response.productInstanceId,
          changeplanOverride: response.changeplanOverride,
        };
      }
    });
  }
}