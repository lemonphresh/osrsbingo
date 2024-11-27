import React, { useState } from 'react';
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import MiniBingoBoard from '../atoms/MiniBingoBoard';
import Section from '../atoms/Section';
import theme from '../theme';

const exampleGrids = {
  FIVE: Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => ({
      id: `${row}-${col}`,
      isComplete: Math.random() > 0.7,
    }))
  ),
  SEVEN: Array.from({ length: 7 }, (_, row) =>
    Array.from({ length: 7 }, (_, col) => ({
      id: `${row}-${col}`,
      isComplete: Math.random() > 0.7,
    }))
  ),
};

const BoardCreationForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    isPublic: false,
    description: '',
    type: 'FIVE',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <Section
      as="form"
      autocomplete="off"
      onSubmit={handleSubmit}
      maxWidth="100%"
      mx="auto"
      p="4"
      width="100%"
    >
      <VStack spacing={4} width="100%">
        <FormControl isRequired>
          <FormLabel fontWeight="bold">Name: </FormLabel>
          <Input
            backgroundColor={theme.colors.gray[300]}
            color={theme.colors.gray[700]}
            maxLength={25}
            name="name"
            onChange={handleChange}
            placeholder="Enter board name"
            value={formData.name}
          />
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel fontWeight="bold" mb="0">
            Public Board:
          </FormLabel>
          <Switch name="isPublic" isChecked={formData.isPublic} onChange={handleChange} />
        </FormControl>

        <FormControl>
          <FormLabel fontWeight="bold">Description: </FormLabel>
          <Textarea
            backgroundColor={theme.colors.gray[300]}
            color={theme.colors.gray[700]}
            name="description"
            onChange={handleChange}
            placeholder="Enter a brief description"
            value={formData.description}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel fontWeight="bold">Board Type:</FormLabel>
          <Select
            backgroundColor={theme.colors.gray[300]}
            color={theme.colors.gray[700]}
            name="type"
            onChange={handleChange}
            value={formData.type}
          >
            <option value="FIVE">5x5</option>
            <option value="SEVEN">7x7</option>
          </Select>
        </FormControl>

        <Flex
          alignItems="center"
          flexDirection="column"
          gap="8px"
          justifyContent="center"
          marginBottom="16px"
        >
          <Text fontSize="14px">Example layout: </Text>
          <MiniBingoBoard grid={exampleGrids[formData.type]} />
        </Flex>
        <Button colorScheme="purple" type="submit" width="full">
          Create Board
        </Button>
      </VStack>
    </Section>
  );
};

export default BoardCreationForm;
