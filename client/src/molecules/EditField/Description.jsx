import { Button, Flex, Text, theme } from '@chakra-ui/react';
import React from 'react';
import Section from '../../atoms/Section';
import ExpandableText from '../../atoms/ExpandableText';
import { EditIcon } from '@chakra-ui/icons';
import EditField from '../EditField';

const Description = ({ board, canEdit, fieldActive, MUTATION, onClickEdit, onSave }) =>
  !fieldActive ? (
    <>
      <Flex position="relative" flexDirection="column" marginX={['0px', '16px']}>
        {canEdit && (
          <Button
            _hover={{ backgroundColor: theme.colors.teal[800] }}
            color={theme.colors.teal[300]}
            margin="0 auto"
            onClick={onClickEdit}
            position={!board?.description ? 'static' : 'absolute'}
            right="0"
            textDecoration="underline"
            top="0px"
            variant="ghost"
            width="fit-content"
          >
            {!board?.description ? 'Add description' : <EditIcon />}
          </Button>
        )}
        {board?.description && (
          <Section>
            <ExpandableText text={board?.description} />
          </Section>
        )}
      </Flex>
    </>
  ) : (
    <>
      <Text fontSize="14px" marginBottom="4px" marginLeft="8px">
        Note: you can use{' '}
        <a
          href="https://www.markdownguide.org/basic-syntax/"
          style={{
            color: theme.colors.cyan[300],
          }}
          target="_blank"
          rel="noreferrer"
        >
          Markdown
        </a>
        !
      </Text>
      <EditField
        defaultValue={board.description}
        flexDirection="column"
        entityId={board.id}
        fieldName="description"
        inputType="textarea"
        MUTATION={MUTATION}
        onSave={onSave}
        value={board.description}
      />
    </>
  );

export default Description;
