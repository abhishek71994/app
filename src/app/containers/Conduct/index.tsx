import * as React from 'react';
import { Helmet } from 'react-helmet';
import {IOutcomeResult, IOutcomeMutation, allOutcomeSets} from 'apollo/modules/outcomeSets';
import {IMeetingMutation, newMeeting} from 'apollo/modules/meetings';
import {IOutcomeSet} from 'models/outcomeSet';
import {IURLConnector} from 'redux/modules/url';
import {setURL} from 'modules/url';
import { bindActionCreators } from 'redux';
import * as moment from 'moment';
import { Button, Select, Input, Grid, ButtonProps, SelectProps } from 'semantic-ui-react';
import {DateTimePicker} from 'components/DateTimePicker';
import {AssessmentTypeSelector} from 'components/AssessmentTypeSelector';
import {Hint} from 'components/Hint';
import './style.less';
const strings = require('./../../../strings.json');
const { connect } = require('react-redux');

interface IProp extends IOutcomeMutation, IMeetingMutation, IURLConnector {
  data: IOutcomeResult;
}

interface IState {
  startMeetingError?: string;
  selectedOS?: string;
  selectedBenID?: string;
  conducted?: moment.Moment;
  dateSelectionError?: string;
  saving?: boolean;
}

@connect(undefined, (dispatch) => ({
  setURL: bindActionCreators(setURL, dispatch),
}))
class ConductInner extends React.Component<IProp, IState> {

  constructor(props) {
    super(props);
    this.state = {
      startMeetingError: undefined,
      conducted: moment(),
      saving: false,
    };
    this.renderNewMeetingControl = this.renderNewMeetingControl.bind(this);
    this.startMeeting = this.startMeeting.bind(this);
    this.setOS = this.setOS.bind(this);
    this.setBenID = this.setBenID.bind(this);
    this.setConductedDate = this.setConductedDate.bind(this);
  }

  private validateStartMeetingOptions(beneficiaryID?: string, outcomeSetID?: string): string|null {
    if (!beneficiaryID || beneficiaryID === '') {
      return 'Beneficiary ID is required';
    }
    if (!outcomeSetID || beneficiaryID === '') {
      return 'Question set must be selected';
    }
    return null;
  }

  private startMeeting() {
    const benID = this.state.selectedBenID;
    const osID = this.state.selectedOS;
    const validation = this.validateStartMeetingOptions(benID, osID);
    if (validation !== null) {
      this.setState({
        startMeetingError: validation,
      });
      return;
    }
    const conducted = this.state.conducted;
    this.setState({
      saving: true,
    });
    this.props.newMeeting(benID, osID, conducted.toDate())
    .then((meeting) => {
      this.props.setURL(`/meeting/${meeting.id}`);
    })
    .catch((e: Error)=> {
      this.setState({
        startMeetingError: e.message,
        saving: false,
      });
    });
  }

  private getOptions(oss: IOutcomeSet[]): any[] {
    if (oss === undefined) {
      return [];
    }
    return oss.map((os) => {
      return {
        key: os.id,
        value: os.id,
        text: os.name,
      };
    });
  }

  private setOS(_, data) {
    this.setState({
      selectedOS: data.value,
    });
  }

  private setBenID(_, data) {
    this.setState({
      selectedBenID: data.value,
    });
  }

  private setConductedDate(date: moment.Moment) {
    if (date > moment()) {
      this.setState({
        dateSelectionError: 'Conducted date must be in the past',
        conducted: this.state.conducted,
      });
      return;
    }
    this.setState({
      conducted: date,
      dateSelectionError: undefined,
    });
  }

  private renderNewMeetingControl(outcomeSets: IOutcomeSet[]|undefined): JSX.Element {
    const startProps: ButtonProps = {};
    if (this.state.saving) {
      startProps.loading = true;
      startProps.disabled = true;
    }
    const selectProps: SelectProps = {};
    if (this.props.data.loading) {
      selectProps.loading = true;
      selectProps.disabled = true;
    }
    const conductedCopy = this.state.conducted.clone();
    return (
      <div className="impactform">
        <span className="label"><Hint text={strings.beneficiaryIDExplanation} /><h3 id="benID">Beneficiary ID</h3></span>
        <Input type="text" placeholder="Beneficiary ID" onChange={this.setBenID} />
        <h3 className="label">Question Set</h3>
        <Select {...selectProps} placeholder="Question Set" onChange={this.setOS} options={this.getOptions(outcomeSets)} />
        <h3 className="label">Date Conducted</h3>
        <span className="conductedDate">{this.state.conducted.format('llll')}</span>
        <DateTimePicker moment={conductedCopy} onChange={this.setConductedDate}/>
        <p>{this.state.dateSelectionError}</p>
        <Button {...startProps} className="submit" onClick={this.startMeeting}>Start</Button>
        <p>{this.state.startMeetingError}</p>
      </div>
    );
  }

  private printer(x) {
    console.log(x);
  }

  public render() {
    const { data } = this.props;
    return (
      <Grid container columns={1} id="conduct">
        <Grid.Column>
          <Helmet title="Assessment"/>
          <h1>Assessment</h1>
          <AssessmentTypeSelector typeSelector={this.printer}/>
          {this.renderNewMeetingControl(data.allOutcomeSets)}
        </Grid.Column>
      </Grid>
    );
  }
}

const Conduct = allOutcomeSets<IProp>(newMeeting(ConductInner));
export { Conduct }
