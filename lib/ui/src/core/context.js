import React from 'react';
import PropTypes from 'prop-types';

import initProviderApi from './init-provider-api';
import handleHistoryLoad from './onload-history';
import initKeyHandler from './init-key-handler';

import getInitialState from './initial-state';

import initPanels from './panels';
import initStories from './stories';
import initUi from './ui';
import initOptions from './options';

const Context = React.createContext();

export class Provider extends React.Component {
  static propTypes = {
    navigate: PropTypes.func.isRequired,
    provider: PropTypes.shape({}).isRequired,
    location: PropTypes.shape({}).isRequired,
    path: PropTypes.string.isRequired,
    viewMode: PropTypes.oneOf(['components', 'info']),
    componentId: PropTypes.string,
    children: PropTypes.node.isRequired,
  };

  constructor(props) {
    super(props);
    const { provider, location, path, viewMode, componentId, navigate } = props;

    console.log('context constructed');

    const store = {
      getState: () => this.state,
      setState: (a, b) => this.setState(a, b),
    };

    const apiData = {
      navigate,
      store,
      provider,
    };

    const state = getInitialState({ location, path, viewMode, componentId });
    const api = {
      navigate,
      getChannel() {
        return provider.channel;
      },
      getElements(type) {
        return provider.getElements(type);
      },
      ...initOptions(apiData),
      ...initUi(apiData),
      ...initPanels(apiData),
      ...initStories(apiData),
    };

    const eventHandler = initKeyHandler({ store, api });
    eventHandler.bind();

    /** Init external interaction with the state */
    initProviderApi({ provider, store, api, eventHandler });

    /** parse old url params to set state and redirect to new routing scheme */
    handleHistoryLoad({ location, navigate, api });

    this.state = state;
    this.api = api;
  }

  static getDerivedStateFromProps = (props, state) => {
    if (state.path !== props.path) {
      return {
        ...state,
        location: props.location,
        path: props.path,
        viewMode: props.viewMode,
        componentId: props.componentId,
      };
    }
    return null;
  };

  render() {
    const { children } = this.props;
    return (
      <Context.Provider
        value={{
          state: this.state,
          api: this.api,
        }}
      >
        {children}
      </Context.Provider>
    );
  }
}

export const { Consumer } = Context;