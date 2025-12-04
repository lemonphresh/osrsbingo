import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/raleway/400.css';
import '@fontsource/raleway/800.css';
import '@fontsource/roboto/400.css';
import { ChakraProvider } from '@chakra-ui/react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

import routes from './routes';
import theme from './theme';
import AuthProvider from './providers/AuthProvider';
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, split } from '@apollo/client';
import { ToastProvider } from './providers/ToastProvider';

const httpUrl = process.env.REACT_APP_SERVER_URL
  ? `${process.env.REACT_APP_SERVER_URL}/graphql`
  : '/graphql';

// Convert http(s) to ws(s) for WebSocket URL
const wsUrl = process.env.REACT_APP_SERVER_URL
  ? `${process.env.REACT_APP_SERVER_URL.replace(/^http/, 'ws')}/graphql`
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/graphql`;

const httpLink = new HttpLink({ uri: httpUrl, credentials: 'include' });

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: () => {
      const token = localStorage.getItem('authToken');
      return {
        authorization: token ? `Bearer ${token}` : '',
      };
    },
  })
);

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Split based on operation type: subscriptions go to WS, everything else to HTTP
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  authLink.concat(httpLink)
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

const router = createBrowserRouter(routes);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ApolloProvider client={client}>
    <ChakraProvider theme={theme} initialColorMode={theme.config.initialColorMode}>
      <ToastProvider>
        <AuthProvider>
          <React.StrictMode>
            <RouterProvider router={router} />
          </React.StrictMode>
        </AuthProvider>
      </ToastProvider>
    </ChakraProvider>
  </ApolloProvider>
);
