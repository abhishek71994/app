import * as React from 'react';
import {Aggregation} from 'models/pref';
import {IMeeting} from 'models/meeting';
import {Answer} from 'models/answer';
import {ICategoryAggregate} from 'models/aggregates';
import {ImpactTable, IRow} from 'components/ImpactTable';
import {getHumanisedTimeSinceDate} from 'helpers/moment';
import {Select, DropdownItemProps} from 'semantic-ui-react';
import './style.less';

interface IProp {
  meetings: IMeeting[];
  aggregation: Aggregation;
}

interface IState {
  firstMeeting: IMeeting;
  secondMeeting: IMeeting;
}

class MeetingTable extends React.Component<IProp, IState> {

  constructor(props) {
    super(props);

    this.state = {
      firstMeeting: this.initialMeeting(),
      secondMeeting: this.lastMeeting(),
    };

    this.onFirstMeetingSelectChange = this.onFirstMeetingSelectChange.bind(this);
    this.onSecondMeetingSelectChange = this.onSecondMeetingSelectChange.bind(this);
    this.initialMeeting = this.initialMeeting.bind(this);
    this.lastMeeting = this.lastMeeting.bind(this);
  }

  private initialMeeting(): IMeeting {
    const { meetings } = this.props;

    return meetings.reduce((first: IMeeting, m: IMeeting): IMeeting => {
      const fConducted = Date.parse(first.conducted);
      const mConducted = Date.parse(m.conducted);
      if (mConducted < fConducted) {
        return m;
      }
      return first;
    }, meetings[0]);
  }

  private lastMeeting(): IMeeting {
    const { meetings } = this.props;

    return meetings.reduce((last: IMeeting, m: IMeeting): IMeeting => {
      const fConducted = Date.parse(last.conducted);
      const mConducted = Date.parse(m.conducted);
      if (mConducted > fConducted) {
        return m;
      }
      return last;
    }, meetings[0]);
  }

  private getCategoryRows(): IRow[] {
    const f = this.state.firstMeeting;
    const l = this.state.secondMeeting;
    let rows = f.aggregates.category.reduce((rows: any, c: ICategoryAggregate) => {
      const category = f.outcomeSet.categories.find((x) => x.id === c.categoryID);
      rows[category.name] = {
        first: c.value,
        name: category.name,
      };
      return rows;
    }, {});
    rows = l.aggregates.category.reduce((rows: any, c: ICategoryAggregate) => {
      const category = l.outcomeSet.categories.find((x) => x.id === c.categoryID);
      if (rows[category.name] === undefined) {
        rows[category.name] = {
          name: category.name,
        };
      }
      rows[category.name] = { ...rows[category.name], last: c.value };
      return rows;
    }, rows);
    return Object.keys(rows).map((k) => rows[k]);
  }

  private getQuestionRows(): IRow[] {
    const f = this.state.firstMeeting;
    const l = this.state.secondMeeting;
    let rows = f.answers.reduce((rows: any, a: Answer) => {
      const q = f.outcomeSet.questions.find((x) => x.id === a.questionID);
      rows[q.question] = {
        first: a.answer,
        name: q.question,
      };
      return rows;
    }, {});
    rows = l.answers.reduce((rows: any, a: Answer) => {
      const q = l.outcomeSet.questions.find((x) => x.id === a.questionID);
      if (rows[q.question] === undefined) {
        rows[q.question] = {
          name: q.question,
        };
      }
      rows[q.question] = { ...rows[q.question], last: a.answer };
      return rows;
    }, rows);
    return Object.keys(rows).map((k) => rows[k]);
  }

  private getColumnTitle(prefix: string, meeting: IMeeting): string {
    return `${prefix} (${getHumanisedTimeSinceDate(new Date(meeting.conducted))})`;
  }

  private onFirstMeetingSelectChange(_, { value }): void {
    const { meetings } = this.props;

    this.setState((prevState) => ({
      ...prevState, firstMeeting: meetings.find((meeting) => meeting.id === value ),
    }));
  }

  private onSecondMeetingSelectChange(_, { value }): void {
    const { meetings } = this.props;

    this.setState((prevState) => ({
      ...prevState, secondMeeting: meetings.find((meeting) => meeting.id === value ),
    }));
  }

  private getMeetingOptions(): DropdownItemProps[] {
    const { meetings } = this.props;

    return meetings.map((meeting) => {
      return {
        value: meeting.id,
        key: meeting.id,
        text: getHumanisedTimeSinceDate(new Date(meeting.conducted)),
      };
    });
  }

  private renderMeetingSelectionFrom(): JSX.Element {
    return (
      <div id="selectMeetingsContainer">
        <span>First meeting</span>
        <Select
          value={this.state.firstMeeting.id}
          onChange={this.onFirstMeetingSelectChange}
          options={this.getMeetingOptions()}
        />
        <span>Second meeting</span>
        <Select
          value={this.state.secondMeeting.id}
          onChange={this.onSecondMeetingSelectChange}
          options={this.getMeetingOptions()}
        />
      </div>
    );
  }

  private renderTable(): JSX.Element {
    const { aggregation } = this.props;

    const isCat = aggregation === Aggregation.CATEGORY;
    const rows = isCat ? this.getCategoryRows() : this.getQuestionRows();

    if (this.state.firstMeeting.id === this.state.secondMeeting.id) {
      return <div>You can't compare two same meetings.</div>;
    }

    return (
      <div>
        <ImpactTable
          data={rows}
          nameColName={isCat ? 'Category' : 'Question'}
          firstColName={this.getColumnTitle('First meeting', this.initialMeeting())}
          lastColName={this.getColumnTitle('Second meeting', this.lastMeeting())}
        />
      </div>
    );
  }

  public render() {
    if (!Array.isArray(this.props.meetings) || this.props.meetings.length === 0) {
      return (<div />);
    }

    return (
      <div className="meeting-table">
        {this.renderMeetingSelectionFrom()}
        {this.renderTable()}
      </div>
    );
  }
}

export {MeetingTable}
