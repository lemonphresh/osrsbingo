import React, { useRef, useState } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import {
  Box,
  Button,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { EXPORT_BS_DRAFT_WORKBOOK, IMPORT_BS_DRAFT_WORKBOOK } from '../../../graphql/bsOperations';
import { useToastContext } from '../../../providers/ToastProvider';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MAX_FILE_BYTES = 6 * 1024 * 1024;

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return window.btoa(binary);
}

function downloadBase64(filename, contentBase64) {
  const binary = window.atob(contentBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: XLSX_MIME }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function WorkbookControls({ eventId, refetch }) {
  const { showToast } = useToastContext();
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [contentBase64, setContentBase64] = useState('');
  const [preview, setPreview] = useState(null);

  const [exportWorkbook, { loading: exporting }] = useLazyQuery(EXPORT_BS_DRAFT_WORKBOOK, {
    fetchPolicy: 'network-only',
  });
  const [importWorkbook, { loading: importing }] = useMutation(IMPORT_BS_DRAFT_WORKBOOK);

  const closeImport = () => {
    setFileName('');
    setContentBase64('');
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = async () => {
    try {
      const { data } = await exportWorkbook({ variables: { eventId } });
      const file = data?.exportBSDraftWorkbook;
      if (!file) throw new Error('The server did not return a workbook.');
      downloadBase64(file.filename, file.contentBase64);
      showToast('Draft workbook exported.', 'success');
    } catch (err) {
      showToast(err.message ?? 'Failed to export workbook.', 'error');
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      showToast('Choose an .xlsx Battleship workbook.', 'error');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      showToast('Workbook must be 6 MB or smaller.', 'error');
      event.target.value = '';
      return;
    }
    try {
      const encoded = arrayBufferToBase64(await file.arrayBuffer());
      setFileName(file.name);
      setContentBase64(encoded);
      setPreview(null);
      const { data } = await importWorkbook({
        variables: { eventId, contentBase64: encoded, apply: false },
      });
      setPreview(data?.importBSDraftWorkbook ?? null);
    } catch (err) {
      showToast(err.message ?? 'Failed to read workbook.', 'error');
      closeImport();
    }
  };

  const handleApply = async () => {
    try {
      const { data } = await importWorkbook({
        variables: { eventId, contentBase64, apply: true },
      });
      const result = data?.importBSDraftWorkbook;
      setPreview(result ?? null);
      if (!result?.applied) return;
      showToast('Ocean and ship tiles imported.', 'success');
      closeImport();
      refetch?.();
    } catch (err) {
      showToast(err.message ?? 'Failed to import workbook.', 'error');
    }
  };

  const errors = preview?.errors ?? [];
  const ready =
    preview &&
    errors.length === 0 &&
    preview.oceanTileCount === 100 &&
    preview.shipTileCount === 17;

  return (
    <>
      <HStack spacing={2}>
        <Button
          size="xs"
          variant="outline"
          borderColor="#1a4028"
          color="#6b9e78"
          fontFamily="mono"
          fontSize="10px"
          letterSpacing="wider"
          textTransform="uppercase"
          isLoading={exporting}
          onClick={handleExport}
          _hover={{ bg: '#091a10', borderColor: '#4ade80', color: '#4ade80' }}
        >
          Export Excel
        </Button>
        <Button
          size="xs"
          variant="outline"
          borderColor="#1a4028"
          color="#6b9e78"
          fontFamily="mono"
          fontSize="10px"
          letterSpacing="wider"
          textTransform="uppercase"
          onClick={() => fileInputRef.current?.click()}
          _hover={{ bg: '#091a10', borderColor: '#4ade80', color: '#4ade80' }}
        >
          Import Excel
        </Button>
      </HStack>
      <Input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        display="none"
        onChange={handleFile}
      />

      <Modal
        isOpen={Boolean(fileName)}
        onClose={closeImport}
        closeOnEsc={!importing}
        closeOnOverlayClick={!importing}
        isCentered
        size="lg"
      >
        <ModalOverlay />
        <ModalContent bg="#091a10" border="1px solid" borderColor="#1a4028" color="#d4f0da">
          <ModalHeader fontFamily="mono" fontSize="sm" color="#4ade80">
            Import Battleship Draft
          </ModalHeader>
          <ModalCloseButton isDisabled={importing} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
                  {fileName}
                </Text>
                <Text fontFamily="mono" fontSize="10px" color="#6b9e78" mt={1}>
                  Import replaces all 100 ocean assignments and all 17 ship-cell assignments. Excel
                  dropdowns are checked again by the server before anything changes.
                </Text>
              </Box>

              {importing && !preview ? (
                <HStack justify="center" py={5}>
                  <Spinner size="sm" color="#4ade80" />
                  <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
                    Validating workbook...
                  </Text>
                </HStack>
              ) : preview ? (
                <VStack align="stretch" spacing={2}>
                  <HStack spacing={4}>
                    <Text fontFamily="mono" fontSize="xs" color={ready ? '#4ade80' : '#f87171'}>
                      Ocean: {preview.oceanTileCount}/100
                    </Text>
                    <Text fontFamily="mono" fontSize="xs" color={ready ? '#4ade80' : '#f87171'}>
                      Ships: {preview.shipTileCount}/17
                    </Text>
                  </HStack>
                  {errors.length > 0 && (
                    <Box
                      maxH="240px"
                      overflowY="auto"
                      bg="#1a0a0a"
                      border="1px solid"
                      borderColor="#7f1d1d"
                      borderRadius="md"
                      p={3}
                    >
                      {errors.map((error, index) => (
                        <Text
                          key={`${index}-${error}`}
                          fontFamily="mono"
                          fontSize="10px"
                          color="#fca5a5"
                          mb={1}
                        >
                          • {error}
                        </Text>
                      ))}
                    </Box>
                  )}
                  {ready && (
                    <Text fontFamily="mono" fontSize="xs" color="#4ade80">
                      Workbook is valid and ready to import.
                    </Text>
                  )}
                </VStack>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button
              size="sm"
              variant="ghost"
              color="#6b9e78"
              onClick={closeImport}
              isDisabled={importing}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              colorScheme="green"
              onClick={handleApply}
              isLoading={importing}
              isDisabled={!ready}
            >
              Apply Import
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
