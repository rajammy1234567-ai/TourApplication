import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

/* ✅ DATA */
const DATA = [
  {
    packageId: '1',
    title: 'Northern Lights Experience in Norway',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
    duration: '2 Days',
    people: '12 People',
    rating: 4.9,
    location: 'Norway',
    price: '$1200',
  },
  {
    packageId: '2',
    title: 'Dubai Desert Safari Adventure',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    duration: '1 Day',
    people: '20 People',
    rating: 4.7,
    location: 'Dubai',
    price: '$300',
  },
  {
    packageId: '3',
    title: 'Bali Beach Relax Tour',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    duration: '5 Days',
    people: '10 People',
    rating: 4.8,
    location: 'Bali, Indonesia',
    price: '$800',
  },
  {
    packageId: '4',
    title: 'Manali Snow Adventure',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
    duration: '3 Days',
    people: '8 People',
    rating: 4.6,
    location: 'Manali, India',
    price: '$250',
  },
  {
    packageId: '5',
    title: 'Thailand Island Trip',
    image: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98',
    duration: '4 Days',
    people: '15 People',
    rating: 4.9,
    location: 'Thailand',
    price: '$600',
  },
];



const DiscoverTours = () => {

  const renderItem = ({ item }) => (
    
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />

      {/* TOP OVERLAY */}
      <View style={styles.overlayTop}>
        <View style={styles.rating}>
          <Text style={styles.ratingText}>⭐ {item.rating}</Text>
        </View>
        <Ionicons name="heart-outline" size={20} color="#fff" />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.row}>
          <Text style={styles.meta}>⏱ {item.duration}</Text>
          <Text style={styles.meta}>👥 {item.people}</Text>
        </View>

        {/* ✅ NAVIGATION FIXED */}
        <TouchableOpacity
          style={styles.button}
          onPress={() =>{
            console.log("SENDING ID:", item.packageId); 
            router.push({
              pathname: '/tourDetails',
              params: {
                // id: item.id,
                packageId: item.packageId,
                title: item.title,
                image: item.image,
                rating: item.rating.toString(),
                duration: item.duration,
                people: item.people,

                // ✅ IMPORTANT (tumhari requirement)
                price: String(item.price),
                locationName: item.location,

                // dummy coords (baad me API se replace)
                latitude: 32.2432,
                longitude: 77.1892,
              },
            })}
          }
        >
          <Text style={styles.buttonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
    
  );
  

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <Ionicons name="arrow-back" size={22} />
          <Text style={styles.headerTitle}>Discover Tours</Text>
          <Ionicons name="search" size={22} />
        </View>

        {/* LIST */}
        <FlatList
          data={DATA}
          keyExtractor={(item) => item.packageId}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>
    </SafeAreaView>
  );
};

export default DiscoverTours;

/* STYLES */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
  },

  image: {
    width: '100%',
    height: width * 0.5,
  },

  overlayTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  rating: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },

  cardBody: {
    padding: 14,
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  meta: {
    fontSize: 12,
    color: '#555',
  },

  button: {
    backgroundColor: '#2F5AF3',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});