import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, Modal, TouchableOpacity, StyleSheet, Dimensions, PanResponder, Animated, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

interface ImageCropperProps {
  isVisible: boolean;
  imageUri: string | null;
  onCrop: (croppedUri: string) => void;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_SIZE = Math.min(SCREEN_WIDTH * 0.8, 300);

export const ImageCropper: React.FC<ImageCropperProps> = ({ 
  isVisible, 
  imageUri, 
  onCrop, 
  onClose 
}) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [currentScale, setCurrentScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastPosition = useRef({ x: 0, y: 0 });
  const loadedUri = useRef<string | null>(null);

  const initialDistance = useRef<number | null>(null);
  const initialScale = useRef<number>(1);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          const { touches } = evt.nativeEvent;
          const dist = Math.sqrt(
            Math.pow(touches[0].pageX - touches[1].pageX, 2) +
            Math.pow(touches[0].pageY - touches[1].pageY, 2)
          );
          initialDistance.current = dist;
          initialScale.current = currentScale;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2 && initialDistance.current !== null) {
          const { touches } = evt.nativeEvent;
          const dist = Math.sqrt(
            Math.pow(touches[0].pageX - touches[1].pageX, 2) +
            Math.pow(touches[0].pageY - touches[1].pageY, 2)
          );
          const newScale = (dist / initialDistance.current) * initialScale.current;
          const clampedScale = Math.min(Math.max(newScale, 0.5), 5); // 0.5x to 5x
          setCurrentScale(clampedScale);
        } else if (evt.nativeEvent.touches.length === 1) {
          setPosition({
            x: lastPosition.current.x + gestureState.dx,
            y: lastPosition.current.y + gestureState.dy
          });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length <= 1) {
          lastPosition.current = {
            x: lastPosition.current.x + gestureState.dx,
            y: lastPosition.current.y + gestureState.dy
          };
        }
        initialDistance.current = null;
      },
    })
  ).current;

  if (!imageUri) return null;

  const handleImageLoad = () => {
    if (!imageUri || loadedUri.current === imageUri) return;
    
    // Mark as loaded to prevent resets on re-renders
    loadedUri.current = imageUri;

    Image.getSize(imageUri, (width, height) => {
      setImageSize({ width, height });

      // Calculate display dimensions
      // Ensure the image covers the crop area exactly at scale=1
      const scaleToFit = Math.max(CROP_SIZE / width, CROP_SIZE / height);
      const dWidth = width * scaleToFit * 1.05; // 5% buffer padding
      const dHeight = height * scaleToFit * 1.05;
      setDisplaySize({ width: dWidth, height: dHeight });
      
      // ONLY reset position on first load of this specific URI
      setPosition({ x: 0, y: 0 });
      lastPosition.current = { x: 0, y: 0 };
      setCurrentScale(1);
    }, (error) => {
      console.error('Failed to get image size:', error);
      // Fallback: Use screen width if size detection fails
      const fallbackSize = SCREEN_WIDTH;
      setImageSize({ width: fallbackSize, height: fallbackSize });
      setDisplaySize({ width: SCREEN_WIDTH, height: SCREEN_WIDTH });
    });
  };

  const handleCrop = async () => {
    if (imageSize.width === 0 || displaySize.width === 0) {
      alert('Please wait for the image to load...');
      return;
    }

    try {
      const scaleFactor = (imageSize.width / displaySize.width) / currentScale;
      const cropSizeInImagePixels = CROP_SIZE * scaleFactor;
      
      const currentX = position.x;
      const currentY = position.y;

      const originX = (imageSize.width / 2) - (cropSizeInImagePixels / 2) - (currentX * scaleFactor);
      const originY = (imageSize.height / 2) - (cropSizeInImagePixels / 2) - (currentY * scaleFactor);

      const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
      const cropW = clamp(cropSizeInImagePixels, 1, imageSize.width);
      const cropH = clamp(cropSizeInImagePixels, 1, imageSize.height);
      const safeX = clamp(originX, 0, imageSize.width - cropW);
      const safeY = clamp(originY, 0, imageSize.height - cropH);

      const result = await manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: safeX,
              originY: safeY,
              width: cropW,
              height: cropH,
            },
          },
          { resize: { width: 512, height: 512 } }
        ],
        { compress: 0.9, format: SaveFormat.JPEG }
      );

      onCrop(result.uri);
      onClose();
    } catch (error) {
      console.error('Crop Error:', error);
      alert('Failed to crop image.');
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Adjust Photo</Text>
          <TouchableOpacity onPress={handleCrop} style={styles.doneButton}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cropArea}>
          <View style={styles.imageWrapper} {...panResponder.panHandlers}>
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
                {
                  width: displaySize.width,
                  height: displaySize.height,
                  transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                    { scale: currentScale }
                  ],
                }
              ]}
              onLoad={handleImageLoad}
            />
          </View>
          
          {/* Square Cutout Overlay */}
          <View style={styles.overlayContainer} pointerEvents="none">
            <View style={styles.dimmed} />
            <View style={styles.middleRow}>
              <View style={styles.dimmed} />
              <View style={styles.cutout} />
              <View style={styles.dimmed} />
            </View>
            <View style={styles.dimmed} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.hint}>
            Pinch to zoom • Drag to position
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1001,
  },
  backButton: {
    width: 44,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneText: {
    color: 'white',
    fontWeight: '700',
  },
  cropArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    // No absolute positioning here
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    zIndex: 10,
  },
  dimmed: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  middleRow: {
    flexDirection: 'row',
    height: CROP_SIZE,
  },
  cutout: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderWidth: 2,
    borderColor: '#38BDF8',
    backgroundColor: 'transparent',
  },
  footer: {
    paddingBottom: 40,
    paddingTop: 20,
    alignItems: 'center',
    backgroundColor: 'black',
  },
  hint: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
