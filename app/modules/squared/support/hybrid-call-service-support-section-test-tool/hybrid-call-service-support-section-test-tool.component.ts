import { IToolkitModalService } from 'modules/core/modal/index';

class HybridCallServiceSupportSectionTestToolCtrl implements ng.IComponentController {

  public callServiceConnectIsEnabled = false;

  /* @ngInject */
  constructor(
    private $modal: IToolkitModalService,
    private ServiceDescriptor,
  ) { }

  public $onInit() {
    this.ServiceDescriptor.isServiceEnabled('squared-fusion-ec')
      .then((isEnabled: boolean) => {
        this.callServiceConnectIsEnabled = isEnabled;
      });
  }

  public openTool(): void {
    this.$modal.open({
      templateUrl: 'modules/hercules/user-sidepanel/hybrid-call-service-test-call-tool/hybrid-call-service-test-call-tool-modal.html',
      controller: 'HybridCallServiceTestToolModalController',
      controllerAs: 'vm',
      resolve: {
        incomingCallerUserId: () => undefined,
        allowChangingCaller: () => true,
      },
    });
  }

}


export class HybridCallServiceSupportSectionTestToolComponent implements ng.IComponentOptions {
  public controller = HybridCallServiceSupportSectionTestToolCtrl;
  public templateUrl = 'modules/squared/support/hybrid-call-service-support-section-test-tool/hybrid-call-service-support-section-test-tool.component.html';
}
