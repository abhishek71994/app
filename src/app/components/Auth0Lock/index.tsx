const appConfig = require('../../../../config/main');

import * as React from 'react';
import auth0Lock from 'auth0-lock';
import {saveAuth} from 'helpers/auth';
import './style.less';

let count = 0;

interface IProps {
  onAuthenticated?: ()=>void;
  auth0Options?: Auth0LockConstructorOptions;
}

class Auth0Lock extends React.Component<IProps, {}> {

  private lock: Auth0LockStatic;
  private divID: string;

  constructor(props) {
    super(props);
    this.divID = `auth0-lock-container-${count++}`;
  }

  public componentWillUnmount() {
    this.lock.hide();
  }

  public componentDidMount() {
    let options = this.props.auth0Options || {};
    options = Object.assign({}, options, {
      autofocus: true,
      container: this.divID,
      allowSignUp: false,
      rememberLastLogin : false,
      auth: {
        params: {
          scope: appConfig.app.auth.scope,
        },
      },
      theme: {
        primaryColor: '#935D8C',
      },
    });
    this.lock = new auth0Lock(appConfig.app.auth.clientID, appConfig.app.auth.domain, options);
    this.lock.show();
    this.lock.on('authenticated', (authResult: auth0.Auth0DecodedHash) => {
      saveAuth(authResult.idToken);
      if (this.props.onAuthenticated) {
        this.props.onAuthenticated();
      }
    });
  }

  public render() {
    return (
      <div id={this.divID} className="impact-auth0-lock" />
    );
  }
}

export { Auth0Lock }
