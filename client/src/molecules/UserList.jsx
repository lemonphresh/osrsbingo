import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_USERS } from './graphql/queries';

const UserList = () => {
  const { loading, error, data } = useQuery(GET_USERS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data.getUsers.map((user) => (
        <li key={user.id}>
          {user.username} ({user.rsn})
        </li>
      ))}
    </ul>
  );
};

export default UserList;
