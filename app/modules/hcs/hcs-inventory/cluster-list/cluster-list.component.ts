import { IToolkitModalService } from 'modules/core/modal';
import { HcsUpgradeService, HcsControllerService, GROUP_TYPE_UNASSIGNED, IApplicationItem, IClusterItem, IHcsClusterSummaryItem, INodeSummaryItem, IHcsCustomer, IHcsUpgradeCustomer, ISoftwareProfilesObject, ISoftwareProfile } from 'modules/hcs/hcs-shared';
import { Notification } from 'modules/core/notifications';
import { ISelectOption, IHeaderTab, STATUS_UPGRADE_IN_PROGRESS, STATUS_UPGRADE_SCHEDULED } from '../shared/hcs-inventory';

export class ClusterListComponent implements ng.IComponentOptions {
  public controller = ClusterListCtrl;
  public template = require('./cluster-list.component.html');
  public bindings = {
    groupId: '<',
  };
}

export class ClusterListCtrl implements ng.IComponentController {
  public groupId: string;
  public groupName: string;
  public tabs: IHeaderTab[] = [];
  public back: boolean = true;
  public backState: string = 'hcs.shared.inventoryList';
  public clusterList: IClusterItem[];

  public clusterToBeDeleted: IClusterItem;
  public customerId: string | undefined;
  public softwareVersionSelected: ISelectOption | null;
  public softwareVersionProfiles: ISelectOption[];
  public loading: boolean;
  public typeUnassigned: string = GROUP_TYPE_UNASSIGNED;
  public disableSwProfileSelect: boolean = false;
  public warningMsgSwProfileSelect: string;

  /* @ngInject */
  constructor(
    private $translate: ng.translate.ITranslateService,
    private $state: ng.ui.IStateService,
    private $modal: IToolkitModalService,
    private HcsUpgradeService: HcsUpgradeService,
    private Notification: Notification,
    private HcsControllerService: HcsControllerService,
  ) {}

  public $onInit() {
    this.loading = true;
    if (this.groupId !== this.typeUnassigned.toLowerCase()) {
      this.tabs.push({
        title: this.$translate.instant('hcs.clustersList.title'),
        state: `hcs.clusterList({groupId: '${this.groupId}'})`,
      }, {
        title: this.$translate.instant('hcs.upgradePage.title'),
        state: `hcs.upgradeCluster({groupId: '${this.groupId}'})`,
      });
    }

    this.clusterList = [];
    this.softwareVersionSelected = null;
    this.softwareVersionProfiles = [];

    this.initCustomer();
    this.initClusters();
  }

  public cardSelected(cluster: IClusterItem): void {
    this.$state.go('hcs.clusterDetail', { groupId: this.groupId, clusterId: cluster.id });
  }

  public closeCard(cluster: IClusterItem, $event: Event): void {
    $event.preventDefault();
    $event.stopImmediatePropagation();
    this.clusterToBeDeleted = cluster;
    this.$modal.open({
      template: '<hcs-delete-modal delete-fn="$ctrl.deleteFn()" dismiss="$dismiss()" modal-title="$ctrl.title" modal-description="$ctrl.description"></hcs-delete-modal>',
      controller: () => {
        return {
          deleteFn: () => this.deleteCluster(cluster.id),
          title: this.$translate.instant('hcs.clustersList.deleteClusterModal.title', { clusterName: cluster.name }),
          description: this.$translate.instant('hcs.clustersList.deleteClusterModal.description'),
        };
      },
      modalClass: 'hcs-delete-modal-class',
      controllerAs: '$ctrl',
      type: 'dialog',
    });
  }

  public deleteCluster(clusterId: string): void {
    //delete Cluster && update Cluster list
    this.HcsUpgradeService.deleteCluster(clusterId)
      .then(() => this.$state.go('hcs.clusterList', { groupId: this.groupId }, { reload: true }))
      .catch((err) => this.Notification.errorWithTrackingId(err, err.data.errors[0].message));
  }

  public initCustomer(): void {
    if (this.groupId === this.typeUnassigned.toLowerCase()) {
      this.groupName = 'Unassigned';
      this.customerId = '';
    } else {
      this.customerId = this.groupId;
      this.HcsControllerService.getHcsControllerCustomer(this.groupId)
        .then((customer: IHcsCustomer) => {
          this.groupName = customer.name;
          this.customerId = customer.uuid;
        })
        .catch((err) => this.Notification.errorWithTrackingId(err, err.data.errors[0].message));

      //initialize sw profile only for upgrade inventory
      this.initSoftwareProfiles();
    }
  }

  public initClusters(): void {
    this.HcsUpgradeService.listClusters(this.customerId)
      .then((clusters: IHcsClusterSummaryItem[]) => {
        this.formatClusterList(clusters);
      })
      .catch((err) => this.Notification.errorWithTrackingId(err, err.data.errors[0].message))
      .finally(() => {
        this.loading = false;
      });
  }

  public initSoftwareProfiles(): void {
    //get software Profiles List
    this.HcsUpgradeService.listSoftwareProfiles()
      .then((swProfiles: ISoftwareProfilesObject) => {
        this.softwareVersionProfiles = [];
        _.forEach(swProfiles.softwareProfiles, (swProfile) => {
          const swProfileListItem = {
            label: swProfile.name,
            value: swProfile.uuid,
          };
          this.softwareVersionProfiles.push(swProfileListItem);
        });

        if (this.softwareVersionProfiles.length === 0  && !this.disableSwProfileSelect) {
          this.warningMsgSwProfileSelect = this.$translate.instant('hcs.clusterDetail.addCustomerModal.swProfileWarningMsg.addSWProfile');
          this.disableSwProfileSelect = true;
        }
      })
      .catch((err) => this.Notification.errorWithTrackingId(err, err.data.errors[0].message));

    //get selected sw profile for the customer
    this.HcsUpgradeService.getHcsUpgradeCustomer(this.groupId)
      .then((customer: IHcsUpgradeCustomer) => {
        this.softwareVersionSelected = {
          label: customer.softwareProfile.name,
          value: customer.softwareProfile.uuid,
        };
      })
      .catch((err) => this.Notification.errorWithTrackingId(err, err.data.errors[0].message));
  }

  public formatClusterList(clustersData: IHcsClusterSummaryItem[]): void {
    this.clusterList = [];
    //function to get cluster data from response object
    _.forEach(clustersData, (cluster: IHcsClusterSummaryItem) => {
      //if cluster status is STATUS_UPGRADE_IN_PROGRESS or STATUS_UPGRADE_SCHEDULED, disable SW Profile selection.
      if ((cluster.clusterStatus === STATUS_UPGRADE_IN_PROGRESS || cluster.clusterStatus === STATUS_UPGRADE_SCHEDULED) && !this.disableSwProfileSelect) {
        this.warningMsgSwProfileSelect = this.$translate.instant('hcs.clusterDetail.addCustomerModal.swProfileWarningMsg.upgradeInProgress');
        this.disableSwProfileSelect = true;
      }

      const applicationList: IApplicationItem[] = [];
      if (!_.isUndefined(cluster.nodes)) {
        _.forEach(cluster.nodes, (node: INodeSummaryItem) => {
          const index = _.findIndex(applicationList, (application: any) => application.name === node.typeApplication);
          if (index === -1) {
            const applicationItem: IApplicationItem = {
              name: node.typeApplication,
              count: 1,
            };
            applicationList.push(applicationItem);
          } else {
            applicationList[index].count = applicationList[index].count + 1;
          }
        });
      }
      const clusterItem: IClusterItem = {
        id: _.get(cluster, 'uuid'),
        name: _.get(cluster, 'name'),
        status: _.get(cluster, 'clusterStatus'),
        applications: applicationList,
      };
      this.clusterList.push(clusterItem);
    });
  }

  public onSoftwareVersionChanged() {
    if (this.softwareVersionSelected) {
      const swProfile: ISoftwareProfile = {
        name: this.softwareVersionSelected.label,
        uuid: this.softwareVersionSelected.value,
      };
      this.HcsUpgradeService.updateHcsUpgradeCustomerSwProfile(this.customerId, swProfile)
        .catch((err) => this.Notification.errorWithTrackingId(err, err.data.errors[0].message));
    }
  }
}