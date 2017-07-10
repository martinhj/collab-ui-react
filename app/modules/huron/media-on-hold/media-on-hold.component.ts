import { IOption } from './../dialing/dialing.service';

class MediaOnHoldCtrl implements ng.IComponentController {
  public lineMoh: string;
  public selected: IOption;
  public lineMohOptions: IOption[];
  public onChangeFn: Function;
  public mediaMgrModal;

  /* @ngInject */
  public constructor(
    private $modal,
    private $scope: ng.IScope,
  ) {}

  public $onChanges(changes: { [bindings: string]: ng.IChangesObject<any> }): void {
    const {} = changes;
    this.selected = _.find(this.lineMohOptions, { value: this.lineMoh });
  }

  public openMediaMgrModal(): void {
    this.mediaMgrModal = this.$modal.open({
      scope: this.$scope,
      component: 'MediaMgrComponent',
      template: '<media-mgr close="$close()" dismiss="$dismiss()"></media-mgr>',
      type: 'full',
    });
  }

  public onLineMohChanged(): void {
    this.onChangeFn({
      lineMoh: _.get(this.selected, 'value'),
    });
  }
}

export class MediaOnHoldComponent implements ng.IComponentOptions {
  public controller = MediaOnHoldCtrl;
  public templateUrl = 'modules/huron/media-on-hold/media-on-hold.html';
  public bindings = {
    lineMoh: '<',
    lineMohOptions: '<',
    onChangeFn: '&',
  };
}
