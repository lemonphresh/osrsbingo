import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_USERS } from '../graphql/queries';
import { useAuth } from '../providers/AuthProvider';

const UserList = () => {
  const { loading, error, data } = useQuery(GET_USERS);
  const { user } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data.getUsers.map((u) => (
        <li key={u.id}>
          {u.displayName === user?.displayName ? `!!!!! ${u.displayName}` : u.displayName} ({u.rsn})
        </li>
      ))}
    </ul>
  );
};

export default UserList;
