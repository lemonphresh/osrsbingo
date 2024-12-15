import { useMutation, useQuery } from '@apollo/client';
import PendingInvitations from '../molecules/PendingInvitations';
import { GET_PENDING_INVITATIONS } from '../graphql/queries';
import { RESPOND_TO_INVITATION } from '../graphql/mutations';
import Section from '../atoms/Section';
import { GET_USER } from '../graphql/queries';
import { useAuth } from '../providers/AuthProvider';
import { useEffect } from 'react';

const InvitationSection = ({ setShownUser }) => {
  const { user } = useAuth();
  const { data, refetch } = useQuery(GET_PENDING_INVITATIONS, { fetchPolicy: 'network-only' });
  const { data: userData, refetch: refetchUser } = useQuery(GET_USER, {
    variables: { id: parseInt(user?.id, 10) },
    skip: !user?.id,
    fetchPolicy: 'network-only',
  });
  const [respondToInvitation] = useMutation(RESPOND_TO_INVITATION, {
    onCompleted: async () => {
      await refetch();
      await refetchUser();
      if (userData?.getUser) {
        setShownUser(userData.getUser);
      }
    },
  });
  const handleRespond = async (invitationId, response) => {
    await respondToInvitation({ variables: { invitationId, response } });
    await refetch();
    const updatedUser = await refetchUser();
    if (updatedUser?.data?.getUser) {
      setShownUser(updatedUser.data.getUser);
    }
  };

  useEffect(() => {
    if (userData?.getUser) {
      setShownUser(userData.getUser);
    }
  }, [userData, userData?.getUser, setShownUser]);

  return (
    <Section>
      <PendingInvitations invitations={data?.pendingInvitations || []} onRespond={handleRespond} />
    </Section>
  );
};

export default InvitationSection;
