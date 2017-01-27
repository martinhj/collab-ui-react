interface IAlarm {
  id: string;
  firstReported: number;
  lastReported: number;
  severity: string;
  title: string;
  description: string;
  solution: string;
  solutionReplacementValues?: Array<{
    text: string,
    link: string,
  }>;
}

export class AlarmListSectionComponentCtrl implements ng.IComponentController {

  public alarms: Array<IAlarm>;

  private severityIconMap = {
    critical: 'icon icon-error',
    error: 'icon icon-priority',
    warning: 'icon icon-warning',
    alert: 'icon icon-info',
  };

  /* @ngInject */
  constructor() {}

  public $onInit() {}

  public $onChanges(changes: {[bindings: string]: ng.IChangesObject}) {

    const { alarms } = changes;
    if (alarms && alarms.currentValue) {
      this.alarms = this.sortAlarmsBySeverity(alarms.currentValue);
    }
  }

  public sortAlarmsBySeverity(alarms: Array<IAlarm>): Array<IAlarm> {

    enum SortOrder {
      'critical' = 0,
      'error' = 1,
      'warning' = 2,
      'alert' = 3,
    }

    return _.sortBy(alarms, (alarm: IAlarm) => {
      return SortOrder[alarm.severity];
    });
  }

  public getSeverityIcon(severity: string): string {
    if (!this.severityIconMap[severity]) {
      return 'icon icon-warning';
    }
    return this.severityIconMap[severity];
  }

}

export class AlarmListSectionComponent implements ng.IComponentOptions {
  public controller = AlarmListSectionComponentCtrl;
  public templateUrl = 'modules/hercules/cluster-sidepanel/alarm-list/alarm-list-section.html';
  public bindings = {
    alarms: '<',
  };
}
