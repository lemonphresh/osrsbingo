import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Input, List, ListItem, Spinner, Flex, Image } from '@chakra-ui/react';
import { debounce } from 'lodash';
import theme from '../theme';
import { UPDATE_TILE } from '../graphql/mutations';
import { useMutation } from '@apollo/client';

const IconSearch = ({ setTileState, tile, tileState }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updateTile] = useMutation(UPDATE_TILE);

  const searchItems = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/items`, {
        params: {
          alpha: searchTerm,
        },
      });

      const items = response.data;
      setResults(items);
    } catch (err) {
      setError('Failed to fetch items.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((searchTerm) => searchItems(searchTerm), 500),
    []
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <Flex flexDirection="column" width="100%" padding="8px">
      <Input
        autoComplete="off"
        bg="gray.700"
        borderColor="gray.600"
        color="white"
        placeholder="Zombie axe, Dragon scimitar, etc..."
        _placeholder={{ color: 'gray.400' }}
        _hover={{ borderColor: 'gray.500' }}
        _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px #9F7AEA' }}
        value={query}
        onChange={handleInputChange}
        marginBottom="16px"
      />
      {loading && <Spinner color="purple.400" margin="0 auto" marginBottom="16px" />}
      {error && <p style={{ color: '#FC8181' }}>{error}</p>}
      {results.length > 0 && !loading && (
        <List
          alignItems="center"
          backgroundColor="gray.700"
          borderRadius="10px"
          display="flex"
          flexWrap="wrap"
          gap="3px"
          justifyContent="center"
          maxHeight="224px"
          overflowY="auto"
          paddingY="8px"
          spacing={0}
          css={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#4A5568',
              borderRadius: '10px',
              '&:hover': {
                background: '#718096',
              },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: '#4A5568 transparent',
          }}
        >
          {results?.map((item) => (
            <ListItem
              alignItems="center"
              key={item.wikiUrl || item.name}
              display="flex"
              justifyContent="center"
              width="45px"
            >
              <Flex
                alignItems="center"
                backgroundColor={
                  tile.icon === item.imageUrl ? theme.colors.orange[200] : 'transparent'
                }
                borderRadius="50%"
                flexDirection="column"
                height="30px"
                width="30px"
                justifyContent="center"
                padding="4px"
                _hover={{
                  backgroundColor:
                    tile.icon === item.imageUrl ? theme.colors.orange[200] : 'whiteAlpha.200',
                }}
                transition="background-color 0.15s ease"
              >
                <Image
                  alt={item.name}
                  cursor="pointer"
                  loading="lazy"
                  onClick={async () => {
                    await updateTile({
                      variables: {
                        id: tile.id,
                        input: { icon: item.imageUrl === tile.icon ? null : item.imageUrl },
                      },
                    });
                    setTileState({
                      ...tile,
                      ...tileState,
                      icon: item.imageUrl === tile.icon ? null : item.imageUrl,
                    });
                  }}
                  src={item.imageUrl}
                  maxHeight="30px"
                  maxWidth="30px"
                />
              </Flex>
            </ListItem>
          ))}
        </List>
      )}
    </Flex>
  );
};

export default IconSearch;
