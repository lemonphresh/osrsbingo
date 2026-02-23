import React, { useState } from 'react';
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
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
    baseTileValue: 0,
    category: 'Other',
    theme: 'DEFAULT',
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
          <FormLabel fontWeight="semibold">Name: </FormLabel>
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

        <FormControl>
          <FormLabel fontWeight="semibold">Description: </FormLabel>
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
          <FormLabel fontWeight="semibold">Category:</FormLabel>
          <Select
            backgroundColor={theme.colors.gray[300]}
            color={theme.colors.gray[700]}
            name="category"
            onChange={handleChange}
            value={formData.category}
          >
            <option value="PvM">PvM</option>
            <option value="PvP">PvP</option>
            <option value="Skilling">Skilling</option>
            <option value="Social">Social</option>
            <option value="Other">Other</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel fontWeight="semibold">Color Scheme:</FormLabel>
          <Select
            backgroundColor={theme.colors.gray[300]}
            color={theme.colors.gray[700]}
            name="theme"
            onChange={handleChange}
            value={formData.theme}
          >
            <option value="DEFAULT">Default</option>
            <option value="purple">Purple</option>
            <option value="blue">Blue</option>
            <option value="cyan">Cyan</option>
            <option value="green">Green</option>
            <option value="yellow">Yellow</option>
            <option value="orange">Orange</option>
            <option value="pink">Pink</option>
            <option value="red">Red</option>
            <option value="gray">Gray</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel fontWeight="semibold">Board Type:</FormLabel>
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

        <FormControl>
          <FormLabel fontWeight="semibold">Base Tile Value:</FormLabel>
          <Text fontSize="14px" marginBottom="4px" marginLeft="8px">
            This will apply to every tile upon board creation. You can change individual tile values
            later!
          </Text>
          <NumberInput
            color={theme.colors.gray[700]}
            colorScheme="purple"
            max={100}
            maxWidth="80px"
            min={0}
            onChange={(val) =>
              setFormData((prevData) => ({
                ...prevData,
                baseTileValue: parseInt(val),
              }))
            }
            name="baseTileValue"
            step={5}
            width="100%"
          >
            <NumberInputField
              autoComplete="off"
              backgroundColor={theme.colors.gray[300]}
              placeholder={formData.baseTileValue || 0}
              value={formData.baseTileValue || 0}
            />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl display="flex" justifyContent="center" flexDirection="column">
          <Flex>
            <FormLabel fontWeight="semibold" mb="0">
              Public Board:
            </FormLabel>
            <Switch name="isPublic" isChecked={formData.isPublic} onChange={handleChange} />
          </Flex>
          <Text fontSize="14px" marginBottom="4px" marginLeft="8px">
            This means others will be able to view your board. You can change this later!
          </Text>
        </FormControl>

        <Flex
          alignItems="center"
          flexDirection="column"
          gap="8px"
          justifyContent="center"
          marginBottom="16px"
        >
          <Text fontSize="14px">Example layout: </Text>
          <Flex backgroundColor={theme.colors.gray[800]} borderRadius="8px" padding="6px">
            <MiniBingoBoard grid={exampleGrids[formData.type]} themeName={formData.theme} />
          </Flex>
        </Flex>
        <Button colorScheme="purple" type="submit" width="full">
          Create Board
        </Button>
      </VStack>
    </Section>
  );
};

export default BoardCreationForm;
