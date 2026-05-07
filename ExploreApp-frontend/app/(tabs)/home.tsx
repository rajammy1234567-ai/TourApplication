import React, { useState } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Destination = {
  id: number;
  name: string;
  country: string;
  rating: number;
  image: string;
};

export default function HomeScreen() {
  const [liked, setLiked] = useState<{ [key: number]: boolean }>({});
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Beach', 'Mountain'];

  const destinations: Destination[] = [
    {
      id: 1,
      name: 'Santorini',
      country: 'Greece',
      rating: 4,
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    },
    {
      id: 2,
      name: 'Kyoto',
      country: 'Japan',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
    },
  ];

  const toggleLike = (id: number) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderStars = (rating: number) => {
    return (
      <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Ionicons
            key={i}
            name={i <= rating ? 'star' : 'star-outline'}
            size={14}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
          }}
          style={styles.headerImage}
        />

        <View style={styles.overlay} />

        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.username}>Alex Johnson</Text>

          <Text style={styles.heading}>
            Where will your next adventure take you?
          </Text>

          {/* SEARCH + FILTER */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#666" />
            <TextInput
              placeholder="Search destinations..."
              style={{ flex: 1, marginLeft: 10 }}
            />
            <Ionicons name="options" size={20} color="#003D82" />
          </View>
        </View>
      </View>

      {/* CATEGORY */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryBtn,
              activeCategory === cat && styles.activeCategory,
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === cat && { color: '#fff' },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* DESTINATIONS */}
      <FlatList
        horizontal
        data={destinations}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 20 }}
        renderItem={({ item }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() =>
      router.push({
        pathname: '/tourDetails',
        params: {
          packageId: item.id.toString(),
          title: item.name,
          image: item.image,
          rating: item.rating.toString(),
          location: item.country,
        },
      })
    }
    style={styles.card}
  >
    
    <Image source={{ uri: item.image }} style={styles.cardImage} />

    {/* HEART */}
    <TouchableOpacity
      style={styles.heart}
      onPress={() => toggleLike(item.id)}
    >
      <Ionicons
        name={liked[item.id] ? 'heart' : 'heart-outline'}
        size={20}
        color="red"
      />
    </TouchableOpacity>

    {/* TEXT */}
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardSub}>{item.country}</Text>
      {renderStars(item.rating)}
    </View>

  </TouchableOpacity>
)}
      />


  {/* FEATURED TOURS */}
<View style={styles.featureSection}>
  
  <View style={styles.featureHeader}>
    <Text style={styles.featureTitle}>Featured Tours</Text>
    <Text style={styles.seeAll}>See All</Text>
  </View>

  {/* CARD 1 */}
  <View style={styles.tourCard}>
    <Image
      source={{
        uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
      }}
      style={styles.tourImage}
    />

    <View style={{ flex: 1 }}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>20% OFF</Text>
      </View>

      <Text style={styles.tourTitle}>Maldives Paradise</Text>
      <Text style={styles.tourSub}>5 Days, 4 Nights</Text>

      <View style={styles.priceRow}>
        <Text style={styles.oldPrice}>$1,200</Text>
        <Text style={styles.newPrice}>$960</Text>
        <Text style={styles.per}>/pax</Text>
      </View>
    </View>

    <View style={styles.rightSection}>
      <Text style={styles.rating}>⭐ 4.8</Text>
      <Ionicons name="chevron-forward" size={20} color="#003D82" />
    </View>
  </View>

  {/* CARD 2 */}
  <View style={styles.tourCard}>
    <Image
      source={{
        uri: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
      }}
      style={styles.tourImage}
    />

    <View style={{ flex: 1 }}>
      <Text style={styles.tourTitle}>Swiss Alps Explorer</Text>
      <Text style={styles.tourSub}>7 Days, 6 Nights</Text>

      <View style={styles.priceRow}>
        <Text style={styles.newPrice}>$1,450</Text>
        <Text style={styles.per}>/pax</Text>
      </View>
    </View>

    <View style={styles.rightSection}>
      <Text style={styles.rating}>⭐ 4.9</Text>
      <Ionicons name="chevron-forward" size={20} color="#003D82" />
    </View>
  </View>

</View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  header: {
    height: 300,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },

  headerImage: { width: '100%', height: '100%' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  headerContent: {
    position: 'absolute',
    top: 50,
    padding: 20,
  },

  greeting: { color: '#fff' },
  username: { color: '#fff', fontSize: 20, fontWeight: '700' },

  heading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 10,
  },

  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },

  categoryBtn: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 20,
    margin: 10,
  },

  activeCategory: { backgroundColor: '#003D82' },

  categoryText: {},

  card: {
    marginLeft: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },

  cardImage: {
    width: 180,
    height: 220,
  },

  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  cardContent: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },

  cardTitle: { color: '#fff', fontWeight: '700' },
  cardSub: { color: '#ddd' },

featureSection: {
  marginTop: 25,
  paddingHorizontal: 15,
},

featureHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 10,
},

featureTitle: {
  fontSize: 18,
  fontWeight: '700',
},

seeAll: {
  color: '#003D82',
  fontWeight: '600',
},

tourCard: {
  flexDirection: 'row',
  backgroundColor: '#fff',
  borderRadius: 15,
  padding: 10,
  marginBottom: 15,
  alignItems: 'center',
  elevation: 3,
},

tourImage: {
  width: 80,
  height: 80,
  borderRadius: 12,
  marginRight: 10,
},

tourTitle: {
  fontWeight: '700',
},

tourSub: {
  color: '#777',
  fontSize: 12,
},

priceRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 5,
},

oldPrice: {
  textDecorationLine: 'line-through',
  color: '#999',
  marginRight: 5,
},

newPrice: {
  fontWeight: '700',
  color: '#003D82',
},

per: {
  fontSize: 12,
  color: '#777',
},

badge: {
  backgroundColor: '#FFA500',
  alignSelf: 'flex-start',
  borderRadius: 5,
  paddingHorizontal: 6,
  marginBottom: 5,
},

badgeText: {
  color: '#fff',
  fontSize: 10,
},

rightSection: {
  alignItems: 'center',
  marginLeft: 10,
},

rating: {
  fontSize: 12,
  marginBottom: 5,
},

});