import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation CreateUser($username: String!, $password: String!, $rsn: String, $permissions: String!) {
    createUser(username: $username, password: $password, rsn: $rsn, permissions: $permissions) {
      id
      username
      rsn
      permissions
      token
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($username: String!, $password: String!) {
    loginUser(username: $username, password: $password) {
      token
      user {
        id
        username
        rsn
      }
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $fields: UserUpdateInput!) {
    updateUser(id: $id, fields: $fields) {
      id
      username
      rsn
    }
  }
`;
