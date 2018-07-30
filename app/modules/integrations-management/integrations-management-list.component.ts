
import { Notification } from 'modules/core/notifications/notification.service';
import { IntegrationsManagementFakeService } from './integrations-management.fake-service';
import { IApplicationUsage, IGlobalPolicy, IListOptions, PolicyAction, SortOrder } from './integrations-management.types';
import { IToolkitModalService, IToolkitModalSettings } from 'modules/core/modal';

export interface IGridApiScope extends ng.IScope {
  gridApi?: uiGrid.IGridApi;
}

export enum StatusEnum {
  SUCCESS = 'success',
  DANGER = 'danger',
}

enum ModalButtonType {
  ALERT = 'alert',
  PRIMARY = 'primary',
}

export class IntegrationsManagementListController implements ng.IComponentController {
  public gridOptions: uiGrid.IGridOptionsOf<IApplicationUsage> = {};
  public gridApi: uiGrid.IGridApi;

  public isGridLoading = true;
  private cellTemplates = {
    accessStatusCellTemplate: require('./list-cell-templates/access-status-cell-template.html'),
    appNameCellTemplate: require('./list-cell-templates/app-name-cell-template.html'),
  };
  private hasDataLoaded = false;
  public listOptions: IListOptions = {
    start: 0,
    count: 20,
  };
  public timeoutVal: number = 500;
  private timer: ng.IPromise<void> | undefined = undefined;

  public dateFormat = 'LLLL';
  private lastUpdate = moment(); //algendel TODO: where do we get this data??
  public PolicyActionEnum = PolicyAction;
  public globalAccessPolicy: IGlobalPolicy | undefined;
  public globalAccessPolicyAction: PolicyAction;

  /* @ngInject */
  public constructor(
    private uiGridConstants: uiGrid.IUiGridConstants,
    private ModalService: IToolkitModalService,
    private $q: ng.IQService,
    private $state: ng.ui.IStateService,
    private $translate: ng.translate.ITranslateService,
    private IntegrationsManagementFakeService: IntegrationsManagementFakeService,
    private $timeout: ng.ITimeoutService,
    private Notification: Notification,
  ) {
  }

  public $onInit() {
    this.initGridOptions();
    this.populateGridData();
    this.setGlobalAccessPolicy();
  }

  private setGlobalAccessPolicy(): ng.IPromise<void> {
    return this.IntegrationsManagementFakeService.getGlobalAccessPolicy()
      .then(globalAccessPolicy => {
        this.globalAccessPolicy = _.clone(globalAccessPolicy);
        this.globalAccessPolicyAction = globalAccessPolicy ? globalAccessPolicy.action : PolicyAction.DENY;
      });
  }

  public get l10nGlobalAccessPolicyString(): string {
    return _.get(this.globalAccessPolicy, 'action') === PolicyAction.ALLOW ? 'common.on' : 'common.off';
  }

  public onGlobalAccessChange(newPolicyAction: PolicyAction): ng.IPromise<void> {
    const options: IToolkitModalSettings = {
      type: 'dialog',
      title: this.$translate.instant('integrations.list.globalAccess.modalTitle'),
      message: (newPolicyAction === PolicyAction.ALLOW) ? this.$translate.instant('integrations.list.globalAccess.modalOnBody') : this.$translate.instant('integrations.list.globalAccess.modalOffBody'),
      close: this.$translate.instant('common.yes'),
      dismiss: this.$translate.instant('common.no'),
      btnType: (newPolicyAction === PolicyAction.ALLOW) ? ModalButtonType.PRIMARY :  ModalButtonType.ALERT,
    } as IToolkitModalSettings;
    return this.ModalService.open(options).result
      .then(() => {
        if (this.globalAccessPolicy === undefined) {
          return this.IntegrationsManagementFakeService.createGlobalAccessPolicy(newPolicyAction).then(() => {
            this.setGlobalAccessPolicy();
          });
        } else {
          return this.IntegrationsManagementFakeService.updateGlobalAccessPolicy(this.globalAccessPolicy.id, newPolicyAction).then(() => {
            if (this.globalAccessPolicy) {
              this.globalAccessPolicy.action = newPolicyAction;
            }
          });
        }
      })
      .catch(() => {
        this.globalAccessPolicyAction = (newPolicyAction === PolicyAction.ALLOW) ? PolicyAction.DENY : PolicyAction.ALLOW;
      });
  }

  public get lastUpdateDate(): string {
    //algendel TODO: which service call gets this value?
    return moment(this.lastUpdate).format(this.dateFormat);
  }

  public filterList(str) {
    if (this.timer) {
      this.$timeout.cancel(this.timer);
      this.timer = undefined;
    }
    this.timer = this.$timeout(() => {
      if (str.length >= 3 || str === '') {
        this.listOptions.searchStr = str;
        this.listOptions.start = 0;
        this.populateGridData();
      }
    }, this.timeoutVal);
  }

  private populateGridData(): ng.IPromise<boolean> {
    this.isGridLoading = true;
    return this.IntegrationsManagementFakeService.listIntegrations(this.listOptions)
      .then(result => {
        if (this.listOptions.start === 0 || _.isEmpty(this.gridOptions.data)) {
          this.gridOptions.data = _.clone(result);
        } else {
          this.gridOptions.data = [...this.gridOptions.data as IApplicationUsage[], ...result];
        }
        this.hasDataLoaded = true;
        return !_.isEmpty(result);
      })
      .catch(response => {
        this.Notification.errorResponse(response, 'integrations.list.getIntegrationListError');
        return false;
      })
      .finally(() => {
        this.isGridLoading = false;
      });
  }

  public mapPolicyAction(action: PolicyAction): string {
    if (action === PolicyAction.ALLOW) {
      return StatusEnum.SUCCESS;
    } else {
      return StatusEnum.DANGER;
    }
  }

  private initGridOptions(): void {
    const columnDefs: uiGrid.IColumnDef[] = [{
      width: '34%',
      cellTemplate: this.cellTemplates.appNameCellTemplate,
      field: 'appName',
      displayName: this.$translate.instant('integrations.list.integrationName'),
    }, {
      width: '33%',
      field: 'policyAction',
      cellTemplate: this.cellTemplates.accessStatusCellTemplate,
      displayName: this.$translate.instant('integrations.list.accessStatus'),
    }, {
      field: 'appUserAdoption',
      displayName: this.$translate.instant('integrations.list.userAdoption'),
    }];

    this.gridOptions = {
      rowHeight: 44,
      multiSelect: false,
      columnDefs: columnDefs,
      enableColumnMenus: false,
      enableColumnResizing: true,
      enableRowSelection: true,
      enableRowHeaderSelection: false,
      useExternalSorting: true,
    };
    this.gridOptions.appScopeProvider = this;
    this.gridOptions.onRegisterApi = (gridApi: uiGrid.IGridApi) => {
      this.gridApi = gridApi;
      gridApi.selection.on.rowSelectionChanged(null as any, (row: uiGrid.IGridRow) => {
        this.showDetail(row.entity);
      });
      gridApi.infiniteScroll.on.needLoadMoreData(null, () => {
        this.gridApi.infiniteScroll.saveScrollPercentage();
        this.loadMoreData();
      });
      gridApi.core.on.sortChanged(null as any, (_anything, sortColumns) => {
        this.sortColumn(sortColumns);
      });
    };
  }

  public loadMoreData(): ng.IPromise<void> {
    if (!this.hasDataLoaded) {
      return this.$q.resolve();
    } else {
      this.listOptions.start = (this.listOptions.start || 0) + (this.listOptions.count || 0);
      this.hasDataLoaded = false;
      return this.populateGridData()
        .then((hasMore) => {
          this.gridApi.infiniteScroll.dataLoaded(false, hasMore);
        });
    }
  }

  public sortColumn(sortColumns) {
    if (_.isUndefined(_.get(sortColumns, '[0]'))) {
      return;
    }
    this.listOptions.sortOrder = this.getSortDirection(sortColumns[0].sort.direction);
    this.listOptions.sortBy = sortColumns[0].field;
    this.listOptions.start = 0;
    this.hasDataLoaded = false;
    this.populateGridData();
  }

  private getSortDirection(direction: string): SortOrder {
    return (direction === this.uiGridConstants.DESC) ? SortOrder.DESC : SortOrder.ASC;
  }

  private showDetail(entity: IApplicationUsage) {
    this.$state.go('integrations-management.overview', {
      globalAccessPolicy: this.globalAccessPolicy && this.globalAccessPolicy.action,
      integration: entity,
    });
  }
}

export class IntegrationsManagementListComponent implements ng.IComponentOptions {
  public controller = IntegrationsManagementListController;
  public template = require('./integrations-management-list.html');
  public bindings = {};
}