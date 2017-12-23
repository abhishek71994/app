import * as React from 'react';
import { Helmet } from 'react-helmet';
import {IMeetingResult, IMeetingMutation, getMeeting, addLikertAnswer, completeMeeting} from 'apollo/modules/meetings';
import {Question} from 'models/question';
import { Likert} from 'components/Likert';
import 'rc-slider/assets/index.css';
import { Button, Grid, ButtonProps } from 'semantic-ui-react';
import './style.less';
import {setURL} from 'modules/url';
import { bindActionCreators } from 'redux';
import {IURLConnector} from 'redux/modules/url';
const { connect } = require('react-redux');
const ReactGA = require('react-ga');

interface IProps extends IMeetingMutation, IURLConnector {
  data: IMeetingResult;
  params: {
      id: string,
  };
};

interface IState {
    currentQuestion?: string;
    finished?: boolean;
    currentValue?: number;
    saveError?: string;
    saving?: boolean;
    completing?: boolean;
    completeError?: string;
};

@connect(undefined, (dispatch) => ({
  setURL: bindActionCreators(setURL, dispatch),
}))
class MeetingInner extends React.Component<IProps, IState> {

  constructor(props) {
    super(props);
    this.state = {
      currentQuestion: undefined,
      currentValue: undefined,
      finished: false,
      saveError: undefined,
      saving: false,
    };
    this.setAnswer = this.setAnswer.bind(this);
    this.next = this.next.bind(this);
    this.getNextQuestionToAnswer = this.getNextQuestionToAnswer.bind(this);
    this.renderFinished = this.renderFinished.bind(this);
    this.review = this.review.bind(this);
  }

  public componentDidUpdate() {
    if (this.state.currentQuestion === undefined &&
      this.state.finished === false &&
      this.props.data.getMeeting !== undefined ) {
      const nextQuestion = this.getNextQuestionToAnswer();
      if (nextQuestion === null) {
        this.setState({
          currentQuestion: undefined,
          finished: true,
        });
      } else {
        this.setState({
          currentQuestion: nextQuestion.id,
          currentValue: undefined,
          finished: false,
        });
      }
    }
  }

  private getNextQuestionToAnswer(): Question|null {
    const questionsToAnswer = this.props.data.getMeeting.outcomeSet.questions
    .filter((q) => !q.archived)
    .filter((question) => {
      const found = this.props.data.getMeeting.answers.find((answer) => answer.questionID === question.id);
      if (found === undefined) {
        return true;
      }
      return false;
    });
    if (questionsToAnswer.length > 0) {
      return questionsToAnswer[0] as Question;
    }
    return null;
  }

  private setAnswer(value: number) {
    this.setState({
      currentValue: value,
    });
  }
  private logGAEvent(action: string) {
    ReactGA.event({
      category : 'assessment',
      label : 'likert',
      action,
    });
  }

  private next() {
    this.setState({
      saving: true,
    });
    this.props.addLikertAnswer(this.props.params.id, this.state.currentQuestion, this.state.currentValue)
    .then(() => {
      this.setState({
        saving: false,
        currentQuestion: undefined,
        saveError: undefined,
      });
      this.logGAEvent('answered');
    })
    .catch((e: string) => {
      this.setState({
        saving: false,
        saveError: e,
      });
    });
  }

  private review() {
    this.setState({
      completing: true,
    });
    this.props.completeMeeting(this.props.params.id, this.props.data.getMeeting.beneficiary)
      .then(() => {
        this.setState({
          completing: false,
          completeError: undefined,
        });
        this.props.setURL(`/review/${this.props.data.getMeeting.beneficiary}`);
      })
      .catch((e: string) => {
        this.setState({
          completing: false,
          completeError: e,
        });
      });
  }

  private renderFinished(): JSX.Element {
    const props: ButtonProps = {};
    if (this.state.completing) {
      props.loading = true;
      props.disabled = true;
    }
    return (
      <div id="meeting">
        <Helmet>
          <title>Questionnaire Finished</title>
        </Helmet>
        <h1>Thanks!</h1>
        <p>The questionnaire is complete. Thanks for your time!</p>
        <Button {...props} onClick={this.review}>Save</Button>
        <p>{this.state.completeError}</p>
      </div>
    );
  }

  public render() {
    const meeting = this.props.data.getMeeting;
    if (meeting === undefined) {
        return (<div />);
    }
    if (this.state.finished) {
      return this.renderFinished();
    }
    const currentQuestionID = this.state.currentQuestion;
    if (currentQuestionID === undefined) {
      return (<div />);
    }
    const question = meeting.outcomeSet.questions.find((q) => q.id === currentQuestionID);
    if (question === undefined) {
      return (
        <div>
          Unknown question
        </div>
      );
    }
    const q = question as Question;
    const nextProps: ButtonProps = {};
    if (this.state.saving) {
      nextProps.loading = true;
      nextProps.disabled = true;
    }
    if (this.state.currentValue === undefined) {
      nextProps.disabled = true;
    }
    return (
      <Grid container columns={1} id="meeting">
        <Grid.Column>
          <Helmet>
            <title>Conducting Meeting</title>
          </Helmet>
          <h1>{question.question}</h1>
          <h3>{question.description}</h3>
          <Likert leftValue={q.minValue} rightValue={q.maxValue} leftLabel={q.minLabel} rightLabel={q.maxLabel} onChange={this.setAnswer} />
          <Button {...nextProps} onClick={this.next}>Next</Button>
          <p>{this.state.saveError}</p>
        </Grid.Column>
      </Grid>
    );
  }
}
const Meeting = completeMeeting<IProps>(getMeeting<IProps>((props) => props.params.id)(addLikertAnswer<IProps>(MeetingInner)));
export { Meeting }
