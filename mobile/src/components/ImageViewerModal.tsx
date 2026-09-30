import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface ImageViewerModalProps {
  uri: string | null;
  onClose: () => void;
}

/** Fullscreen viewer for a Monster's original (full-resolution) image.
 * Lives outside the list's own state, so opening/closing never touches the
 * SectionList data and never remounts the list. Android hardware back is
 * handled by Modal's `onRequestClose`. */
export function ImageViewerModal({ uri, onClose }: ImageViewerModalProps) {
  return (
    <Modal
      visible={uri !== null}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>
        {uri && (
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="contain"
            transition={100}
            cachePolicy="memory-disk"
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    zIndex: 1,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
