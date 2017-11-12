import * as React from 'react';
import { IndexRoute, Route } from 'react-router';
import { App, Home, Login, Review, ReviewSelector, Conduct, Settings, OutcomeSets, OutcomeSet, Meeting, Organisation, Account, Report, ServiceReport, BeneficiaryRedirect } from 'containers';

export default (
  <Route path="/" component={App}>
    <IndexRoute component={Home} />
    <Route path="record" component={Conduct} />
    <Route path="review" component={ReviewSelector} />
    <Route path="review/:id" component={Review} />
    <Route path="settings" component={Settings}>
      <Route path="account" component={Account} />
      <Route path="organisation" component={Organisation} />
      <Route path="questions" component={OutcomeSets} />
      <Route path="questions/:id" component={OutcomeSet} />
    </Route>
    <Route path="login" component={Login} />
    <Route path="meeting/:id" component={Meeting} />
    <Route path="report" component={Report} />
    <Route path="report/service/:questionSetID/:start/:end" component={ServiceReport} />
    <Route path ="jti/:jti" component={BeneficiaryRedirect} />
  </Route>
);
