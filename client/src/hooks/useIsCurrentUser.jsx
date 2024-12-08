import { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useParams } from 'react-router-dom';

const useIsCurrentUser = () => {
  const { user } = useAuth();
  const params = useParams();

  const [isCurrentUser, setIsCurrentUser] = useState(
    user && parseInt(user.id) === parseInt(params.userId, 10)
  );
  useEffect(() => {
    setIsCurrentUser(user && parseInt(user.id) === parseInt(params.userId, 10));
  }, [isCurrentUser, params.userId, user]);

  return isCurrentUser;
};

export default useIsCurrentUser;
