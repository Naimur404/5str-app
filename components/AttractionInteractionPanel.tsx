import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { AttractionInteractionButton } from './AttractionInteractionButton';
import { useAttractionInteraction } from '@/hooks/useAttractionInteraction';
import { useAttractionTracking } from '@/hooks/useAttractionTracking';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Share } from 'react-native';

interface AttractionInteractionPanelProps {
  attractionId: number;
  attractionName: string;
  attractionSlug: string;
  initialStats?: {
    total_likes: number;
    total_shares: number;
    total_bookmarks?: number;
    total_wishlists?: number;
  };
  style?: any;
}

export const AttractionInteractionPanel: React.FC<AttractionInteractionPanelProps> = ({
  attractionId,
  attractionName,
  attractionSlug,
  initialStats,
  style,
}) => {
  const {
    isLiked,
    isBookmarked,
    isWishlisted,
    loading,
    like,
    bookmark,
    addToWishlist,
    share,
  } = useAttractionInteraction(attractionId);

  // Attraction tracking
  const { trackLike, trackBookmark, trackShare } = useAttractionTracking(attractionId, {
    autoTrackView: false, // Already tracked in detail page
  });

  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const borderColor = colors.border; // Use direct colors instead of useThemeColor for consistency
  
  // Show loading state while initializing
  if (loading && !isLiked && !isBookmarked && !isWishlisted) {
    return (
      <View style={[
        styles.container, 
        styles.loadingContainer, 
        { 
          borderColor,
          backgroundColor: colors.card,
        }
      ]}>
        <ActivityIndicator size="small" color={colors.tint} />
        <ThemedText style={[styles.loadingText, { color: colors.text }]}>Loading interactions...</ThemedText>
      </View>
    );
  }

  const handleLike = async () => {
    try {
      await like();
      trackLike(!isLiked, { element: 'interaction_panel' });
    } catch (error) {
      console.error('Error liking attraction:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      await bookmark();
      trackBookmark(!isBookmarked, { element: 'interaction_panel' });
    } catch (error) {
      console.error('Error bookmarking attraction:', error);
    }
  };

  const handleWishlist = async () => {
    try {
      await addToWishlist();
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  const handleShare = async () => {
    try {
      const attractionUrl = `https://5str.com/attraction/${attractionSlug}`;
      const shareMessage = `Check out ${attractionName} on 5str!\\n${attractionUrl}`;
      
      const result = await Share.share({
        message: shareMessage,
        url: attractionUrl,
        title: attractionName,
      });

      if (result.action === Share.sharedAction) {
        // Record the share interaction
        await share('native', shareMessage);
        trackShare({ element: 'interaction_panel', platform: 'native' });
      }
    } catch (error) {
      console.error('Error sharing attraction:', error);
    }
  };

  return (
    <View style={[
      styles.container, 
      { 
        borderColor,
        backgroundColor: colors.card, // Use explicit card color for dark mode
      }, 
      style
    ]}>
      <View style={[
        styles.buttonsContainer,
        { backgroundColor: 'transparent' } // Ensure transparent background
      ]}>
        <AttractionInteractionButton
          type="like"
          isActive={isLiked}
          loading={loading}
          onPress={handleLike}
          count={initialStats?.total_likes}
          size="small"
          style={styles.button}
        />
        
        <AttractionInteractionButton
          type="bookmark"
          isActive={isBookmarked}
          loading={loading}
          onPress={handleBookmark}
          count={initialStats?.total_bookmarks}
          size="small"
          style={styles.button}
          showCount={false}
        />
        
        <AttractionInteractionButton
          type="share"
          isActive={false}
          loading={loading}
          onPress={handleShare}
          count={initialStats?.total_shares}
          size="small"
          style={styles.button}
        />
        
        <AttractionInteractionButton
          type="wishlist"
          isActive={isWishlisted}
          loading={loading}
          onPress={handleWishlist}
          count={initialStats?.total_wishlists}
          size="small"
          style={styles.button}
          showCount={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
    opacity: 0.7,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
    paddingVertical: 4,
  },
});