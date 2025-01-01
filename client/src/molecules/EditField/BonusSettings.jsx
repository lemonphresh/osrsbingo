import React from 'react';
import theme from '../../theme';
import BonusSettingsModal from '../BonusSettingsModal';
import { Button, useDisclosure } from '@chakra-ui/react';

const BonusSettings = ({ board, canEdit, onUpdateField }) => {
  const {
    isOpen: isBonusSettingsModalOpen,
    onOpen: onOpenBonusSettingsModal,
    onClose: onCloseBonusSettingsModal,
  } = useDisclosure();

  return (
    <>
      {canEdit && (
        <Button
          _hover={{ backgroundColor: theme.colors.teal[800] }}
          color={theme.colors.teal[300]}
          onClick={onOpenBonusSettingsModal}
          textDecoration="underline"
          variant="ghost"
          width="fit-content"
        >
          Edit Board Bonus Settings
        </Button>
      )}
      {board && board.bonusSettings && (
        <BonusSettingsModal
          board={board}
          isOpen={isBonusSettingsModalOpen}
          onOpen={onOpenBonusSettingsModal}
          onClose={onCloseBonusSettingsModal}
          onUpdateField={onUpdateField}
        />
      )}
    </>
  );
};

export default BonusSettings;
