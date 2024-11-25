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
    if (!searchTerm) {
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
        placeholder="Search OSRS items..."
        value={query}
        onChange={handleInputChange}
        marginBottom="16px"
      />
      {loading && <Spinner margin="0 auto" marginBottom="16px" />}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {results.length > 0 && !loading && (
        <List
          alignItems="center"
          backgroundColor={theme.colors.gray[200]}
          borderRadius="10px"
          display="flex"
          flexWrap="wrap"
          gap="3px"
          justifyContent="center"
          maxHeight="224px"
          overflowY="scroll"
          paddingY="8px"
          spacing={0}
        >
          {results.map((item) => (
            <ListItem
              alignItems="center"
              key={item.id}
              display="flex"
              justifyContent="center"
              width="45px"
            >
              <Flex
                alignItems="center"
                backgroundColor={
                  tile.icon === item.imageUrl ? theme.colors.yellow[100] : 'transparent'
                }
                borderRadius="50%"
                flexDirection="column"
                justifyContent="center"
                padding="3px"
              >
                <Image
                  alt={item.name}
                  cursor="pointer"
                  onClick={async () => {
                    await updateTile({
                      variables: {
                        id: tile.id,
                        input: { icon: item.imageUrl },
                      },
                    });
                    setTileState({
                      ...tile,
                      ...tileState,
                      icon: item.imageUrl,
                    });
                  }}
                  src={item.imageUrl}
                  width="30px"
                  height="30px"
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
