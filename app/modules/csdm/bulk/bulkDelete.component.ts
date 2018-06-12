import { IStateService } from 'angular-ui-router';
import { BulkAction, CsdmBulkService } from '../services/csdmBulk.service';
import { IComponentController, IComponentOptions } from 'angular';
import { BulkActionName, ICsdmAnalyticHelper } from '../services/csdm-analytics-helper.service';

class BulkDeleteCtrl implements IComponentController {
  private dismiss: Function;
  public title: string;
  private deleteEmptyPlaces: boolean;
  private testDelete: boolean = true;

  public get numberOfDevices() {
    return _.size(this.$state.params.selectedDevices);
  }

  /* @ngInject */
  constructor(private $state: IStateService,
              private CsdmBulkService: CsdmBulkService,
              private CsdmAnalyticsHelper: ICsdmAnalyticHelper,
              private $q) {
    this.title = this.$state.params.title;
  }

  public delete() {
    const bulkAction = new BulkAction(
      this.$q,
      this.CsdmBulkService,
      this.CsdmBulkService.delete.bind(this.CsdmBulkService,
        _.keys(this.$state.params.selectedDevices),
        this.deleteEmptyPlaces,
        !this.testDelete),
      this.$state.params.devicesDeleted,
      this.$state.params.selectedDevices,
      'deviceBulk.deleted');
    this.$state.go('deviceBulkFlow.perform',
      {
        title: this.title,
        bulkAction: bulkAction,
      },
    );
    this.CsdmAnalyticsHelper.trackBulkAction(
      BulkActionName.DELETE,
      {
        mainAction: this.testDelete ? BulkActionName.DELETE_FAKE : BulkActionName.DELETE,
        selectedDevices: _.size(this.$state.params.selectedDevices),
      });
  }

  public close() {
    this.dismiss();
  }
}

export class BulkDeleteComponent implements IComponentOptions {
  public controller = BulkDeleteCtrl;
  public template = require('modules/csdm/bulk/bulkDelete.html');
  public bindings = {
    dismiss: '&',
  };
}